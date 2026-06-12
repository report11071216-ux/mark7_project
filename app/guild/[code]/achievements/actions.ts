"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function claimAchievement(
  guildId: string,
  guildCode: string,
  achievementKey: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("claim_guild_achievement", {
    p_guild_id: guildId,
    p_achievement_key: achievementKey,
  });

  if (error) {
    return { success: false, error: "수령에 실패했어요" };
  }

  const result = data as {
    success: boolean;
    error?: string;
    guild_reward?: number;
    personal_reward?: number;
  };

  if (!result.success) {
    return { success: false, error: result.error ?? "수령에 실패했어요" };
  }

  revalidatePath(`/guild/${guildCode}/achievements`);
  return {
    success: true,
    guildReward: result.guild_reward ?? 0,
    personalReward: result.personal_reward ?? 0,
  };
}
