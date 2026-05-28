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

// 보유 캐릭터 저장 최소 아이템레벨 (대표 캐릭터는 예외로 항상 저장)
const MIN_CHARACTER_ITEM_LEVEL = 1640;

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

  const combatPower = extractCombatPower(profile.Stats, profile.CharacterClassName);
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

  // ── 보유 캐릭터(원정대) 저장 ──
  try {
    const siblings = await getCharacterSiblings(profile.CharacterName);
    // 기존 목록 비우고 최신화
    await supabase.from("user_characters").delete().eq("user_id", user.id);

    const rows = (Array.isArray(siblings) ? siblings : [])
      .map((s) => {
        const lvl = parseItemLevel(s.ItemAvgLevel || s.ItemMaxLevel);
        const isRep = s.CharacterName === profile.CharacterName;
        return {
          user_id: user.id,
          character_name: s.CharacterName,
          server_name: s.ServerName,
          character_class: s.CharacterClassName,
          item_level: lvl,
          character_level: s.CharacterLevel,
          is_representative: isRep,
        };
      })
      .filter((r) => r.is_representative || r.item_level >= MIN_CHARACTER_ITEM_LEVEL);

    if (rows.length > 0) {
      await supabase.from("user_characters").insert(rows);
    }
  } catch {
    // 보유 캐릭터 저장 실패는 연동 자체를 막지 않음
  }

  revalidatePath("/mypage");
  return {
    success: true,
    message: `${profile.CharacterName} 연동 완료!`,
  };
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
