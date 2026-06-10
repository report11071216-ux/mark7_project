"use server";
import { createClient } from "@/lib/supabase/server";

export async function buyNameplateCard(guildId: string, cardId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("buy_nameplate_card", {
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
  return { success: false, error: res?.error ?? "구매에 실패했어요" };
}
