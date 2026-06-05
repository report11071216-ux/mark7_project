"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getCharacterProfile,
  getCharacterSiblings,
  getFullArmory,
  extractCombatPower,
  parseItemLevel,
} from "@/lib/lostark";

export type SyncResult = {
  success: boolean;
  message: string;
};

export type SubAccount = {
  accountKey: string;
  charCount: number;
};

// 보유 캐릭터 저장 최소 아이템레벨 (대표 캐릭터는 예외로 항상 저장)
const MIN_CHARACTER_ITEM_LEVEL = 1640;

// 부계정 최대 개수 (베타)
const MAX_SUB_ACCOUNTS = 3;

// ── 한 원정대(계정)의 siblings를 account_key 그룹으로 저장 ──
// 같은 account_key 그룹만 비우고 다시 넣으므로 다른 계정 데이터는 건드리지 않음.
async function saveRoster(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entryName: string,
  repName: string,
  siblings: any[]
) {
  await supabase
    .from("user_characters")
    .delete()
    .eq("user_id", userId)
    .eq("account_key", entryName);

  const rows = (Array.isArray(siblings) ? siblings : [])
    .map((s) => {
      const lvl = parseItemLevel(s.ItemAvgLevel || s.ItemMaxLevel);
      const isRep = repName ? s.CharacterName === repName : false;
      return {
        user_id: userId,
        character_name: s.CharacterName,
        server_name: s.ServerName,
        character_class: s.CharacterClassName,
        item_level: lvl,
        character_level: s.CharacterLevel,
        is_representative: isRep,
        account_key: entryName,
      };
    })
    .filter((r) => r.is_representative || r.item_level >= MIN_CHARACTER_ITEM_LEVEL);

  if (rows.length > 0) {
    await supabase.from("user_characters").insert(rows);
  }
}

export async function syncLostarkCharacter(
  characterName: string
): Promise<SyncResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다" };
  if (!characterName.trim()) return { success: false, message: "캐릭터명을 입력해주세요" };

  const profile = await getCharacterProfile(characterName.trim());
  if (!profile) {
    return {
      success: false,
      message: "캐릭터를 찾을 수 없어요. 이름을 다시 확인해주세요.",
    };
  }

  // 전투력은 이제 API의 CombatPower 필드를 그대로 사용 (profile 전체 전달)
  const combatPower = extractCombatPower(profile);
  const itemLevel = parseItemLevel(profile.ItemAvgLevel);

  const { error } = await supabase
    .from("profiles")
    .update({
      username: profile.CharacterName,
      main_character_name: profile.CharacterName,
      lostark_character_name: profile.CharacterName,
      character_class: profile.CharacterClassName,
      item_level: itemLevel,
      combat_power: combatPower,
      server_name: profile.ServerName,
      expedition_level: profile.ExpeditionLevel,
      character_image_url: profile.CharacterImage ?? null,
      character_data: profile,
      lostark_synced_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false, message: "저장 중 오류가 발생했어요" };

  // ── 메인 원정대 저장 (부계정은 보존) ──
  try {
    const siblings = await getCharacterSiblings(profile.CharacterName);
    // 레거시(account_key 없는) 행 정리 — 예전 통짜 저장분
    await supabase
      .from("user_characters")
      .delete()
      .eq("user_id", user.id)
      .is("account_key", null);
    // 메인 원정대 그룹만 갱신 (대표 캐릭은 메인)
    await saveRoster(supabase, user.id, profile.CharacterName, profile.CharacterName, siblings);
  } catch {
    // 보유 캐릭터 저장 실패는 연동 자체를 막지 않음
  }

  revalidatePath("/mypage");
  return {
    success: true,
    message: `${profile.CharacterName} 연동 완료!`,
  };
}

// ── 부계정(다른 계정 원정대) 추가 ──
export async function addSubAccount(characterName: string): Promise<SyncResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다" };

  const name = characterName.trim();
  if (!name) return { success: false, message: "캐릭터명을 입력해주세요" };

  const { data: prof } = await supabase
    .from("profiles")
    .select("main_character_name")
    .eq("id", user.id)
    .maybeSingle();
  const mainName = (prof?.main_character_name as string) || "";

  if (mainName && name === mainName) {
    return { success: false, message: "메인 캐릭터예요. 부계정으로 추가할 수 없어요." };
  }

  // 이미 등록된 캐릭터인지 (같은 원정대 중복 방지)
  const { data: dup } = await supabase
    .from("user_characters")
    .select("character_name")
    .eq("user_id", user.id)
    .eq("character_name", name)
    .maybeSingle();
  if (dup) {
    return { success: false, message: "이미 등록된 원정대의 캐릭터예요." };
  }

  // 부계정 개수 제한 (현재 보유한 account_key 종류 수)
  const { data: keyRows } = await supabase
    .from("user_characters")
    .select("account_key")
    .eq("user_id", user.id)
    .not("account_key", "is", null);
  const subKeys = new Set<string>();
  for (const r of keyRows || []) {
    const k = (r.account_key as string) || "";
    if (k && k !== mainName) subKeys.add(k);
  }
  if (subKeys.size >= MAX_SUB_ACCOUNTS) {
    return {
      success: false,
      message: `부계정은 최대 ${MAX_SUB_ACCOUNTS}개까지 추가할 수 있어요.`,
    };
  }

  // 캐릭터 존재 확인
  const profile = await getCharacterProfile(name);
  if (!profile) {
    return { success: false, message: "캐릭터를 찾을 수 없어요. 이름을 다시 확인해주세요." };
  }

  const siblings = await getCharacterSiblings(profile.CharacterName);

  // 이미 등록된 원정대와 겹치는지 (다른 입력으로 같은 계정 재추가 방지)
  const sibNames = (Array.isArray(siblings) ? siblings : [])
    .map((s) => s.CharacterName as string)
    .filter(Boolean);
  if (sibNames.length > 0) {
    const { data: overlap } = await supabase
      .from("user_characters")
      .select("character_name")
      .eq("user_id", user.id)
      .in("character_name", sibNames)
      .limit(1);
    if (overlap && overlap.length > 0) {
      return {
        success: false,
        message: "이미 등록된 원정대예요. 다른 계정의 캐릭터를 입력해주세요.",
      };
    }
  }

  // 부계정 그룹으로 저장 (대표는 메인 그대로 유지 → 부계정 캐릭은 모두 비대표)
  await saveRoster(supabase, user.id, profile.CharacterName, mainName, siblings);

  revalidatePath("/mypage");
  return { success: true, message: `${profile.CharacterName} 원정대를 추가했어요!` };
}

// ── 부계정 삭제 ──
export async function removeSubAccount(accountKey: string): Promise<SyncResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다" };

  const key = (accountKey || "").trim();
  if (!key) return { success: false, message: "잘못된 요청이에요" };

  const { data: prof } = await supabase
    .from("profiles")
    .select("main_character_name")
    .eq("id", user.id)
    .maybeSingle();
  const mainName = (prof?.main_character_name as string) || "";

  if (mainName && key === mainName) {
    return { success: false, message: "메인 원정대는 삭제할 수 없어요." };
  }

  await supabase
    .from("user_characters")
    .delete()
    .eq("user_id", user.id)
    .eq("account_key", key);

  revalidatePath("/mypage");
  return { success: true, message: "부계정을 삭제했어요." };
}

// ── 부계정 목록 ──
export async function listSubAccounts(): Promise<SubAccount[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: prof } = await supabase
    .from("profiles")
    .select("main_character_name")
    .eq("id", user.id)
    .maybeSingle();
  const mainName = (prof?.main_character_name as string) || "";

  const { data } = await supabase
    .from("user_characters")
    .select("account_key")
    .eq("user_id", user.id)
    .not("account_key", "is", null);

  const counts: { [key: string]: number } = {};
  for (const r of data || []) {
    const k = (r.account_key as string) || "";
    if (!k || k === mainName) continue;
    counts[k] = (counts[k] || 0) + 1;
  }

  return Object.keys(counts).map((k) => ({ accountKey: k, charCount: counts[k] }));
}

export async function fetchArmoryData(characterName: string) {
  if (!characterName) return null;
  return await getFullArmory(characterName);
}

export async function equipProfileCard(purchaseId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }
  const { data, error } = await supabase.rpc("equip_profile_card", {
    p_purchase_id: purchaseId,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/mypage");
  return data as { success: boolean; error?: string };
}

export async function equipPersonalMark(purchaseId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }
  const { data, error } = await supabase.rpc("equip_personal_mark", {
    p_purchase_id: purchaseId,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/mypage");
  return data as { success: boolean; error?: string };
}

export async function deletePurchase(purchaseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  // 본인 구매인지 확인
  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, buyer_id")
    .eq("id", purchaseId)
    .maybeSingle();

  if (!purchase) {
    return { success: false, error: "아이템을 찾을 수 없습니다" };
  }
  if (purchase.buyer_id !== user.id) {
    return { success: false, error: "본인 아이템만 삭제할 수 있습니다" };
  }

  // 장착 중이면 먼저 해제 (죽은 참조 방지)
  const { data: profile } = await supabase
    .from("profiles")
    .select("equipped_card_id, equipped_mark_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const updates: { equipped_card_id?: null; equipped_mark_id?: null } = {};
    if (profile.equipped_card_id === purchaseId) updates.equipped_card_id = null;
    if (profile.equipped_mark_id === purchaseId) updates.equipped_mark_id = null;
    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", user.id);
    }
  }

  const { error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", purchaseId)
    .eq("buyer_id", user.id);

  if (error) {
    return { success: false, error: "삭제 중 오류가 발생했어요" };
  }

  revalidatePath("/mypage");
  return { success: true };
}
