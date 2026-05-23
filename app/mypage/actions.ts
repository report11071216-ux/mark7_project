"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getCharacterProfile,
  getFullArmory,
  extractCombatPower,
  parseItemLevel,
} from "@/lib/lostark";

export type SyncResult = {
  success: boolean;
  message: string;
};

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
