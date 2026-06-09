"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Result = { ok: true } | { ok: false; error: string };

export async function setMemberTitle(
  guildCode: string,
  guildId: string,
  targetUserId: string,
  title: string
): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { error } = await supabase.rpc("set_member_title", {
    p_guild_id: guildId,
    p_target_user_id: targetUserId,
    p_title: title,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/guild/${guildCode}/members`);
  return { ok: true };
}
