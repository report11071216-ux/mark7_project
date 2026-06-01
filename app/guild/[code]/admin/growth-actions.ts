"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { GUILD_COSTS } from "@/lib/guild-grade";

// 인원 / 보관함 확장
export async function buyGuildCapacity(guildCode: string, type: "member" | "vault") {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) return { success: false, error: "길드를 찾을 수 없습니다" };

  const cost = type === "member" ? GUILD_COSTS.member : GUILD_COSTS.vault;

  const { error } = await supabase.rpc("purchase_guild_capacity", {
    p_guild_id: guild.id,
    p_type: type,
    p_cost: cost,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/guild/${code}`);
  revalidatePath(`/guild/${code}/admin`);
  return { success: true };
}

// 경험치 구매 (1회 = expUnit 포인트)
export async function buyGuildExp(guildCode: string) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) return { success: false, error: "길드를 찾을 수 없습니다" };

  const { error } = await supabase.rpc("purchase_guild_exp", {
    p_guild_id: guild.id,
    p_cost: GUILD_COSTS.expUnit,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/guild/${code}`);
  revalidatePath(`/guild/${code}/admin`);
  return { success: true };
}
