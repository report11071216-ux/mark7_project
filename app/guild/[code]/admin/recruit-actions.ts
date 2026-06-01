"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RecruitInput = {
  isRecruiting: boolean;
  description: string;
  tags: string[];
  discordUrl: string;
  recruitMessage: string;
};

export async function saveRecruitInfo(guildCode: string, input: RecruitInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", guildCode)
    .single();
  if (!guild) return { success: false, error: "길드를 찾을 수 없습니다" };

  // 운영진 확인
  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || (member.role !== "master" && member.role !== "submaster")) {
    return { success: false, error: "권한이 없습니다" };
  }

  const cleanTags = (input.tags ?? []).filter(Boolean).slice(0, 5);
  const cleanDesc = (input.description ?? "").trim().slice(0, 40);
  const cleanMsg = (input.recruitMessage ?? "").trim().slice(0, 500);
  const cleanDiscord = (input.discordUrl ?? "").trim().slice(0, 200);

  const { error } = await supabase
    .from("guilds")
    .update({
      is_recruiting: input.isRecruiting,
      description: cleanDesc,
      recruit_tags: cleanTags,
      recruit_discord_url: cleanDiscord,
      recruit_message: cleanMsg,
      recruit_updated_at: new Date().toISOString(),
    })
    .eq("id", guild.id);

  if (error) return { success: false, error: "저장에 실패했습니다" };

  revalidatePath(`/guild/${guildCode}/admin`);
  revalidatePath("/plaza/recruiting");
  revalidatePath("/plaza");
  return { success: true };
}
