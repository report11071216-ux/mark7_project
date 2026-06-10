"use server";
import { createClient } from "@/lib/supabase/server";

export async function equipNameplateCard(guildId: string, cardId: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("equip_nameplate_card", {
    p_guild_id: guildId,
    p_card_id: cardId,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const res = data as any;
  if (res?.success) {
    return { success: true };
  }
  return { success: false, error: res?.error ?? "장착에 실패했어요" };
}
