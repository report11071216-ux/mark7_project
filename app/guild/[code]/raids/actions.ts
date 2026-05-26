"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type NewRaidInput = {
  title: string;
  max_members: number;
  difficulty: string;
  skill_level: string;
  raid_date: string;
  raid_time: string;
  image_url: string | null;
};

export async function createRaid(guildCode: string, input: NewRaidInput) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isStaff = membership?.role === "master" || membership?.role === "submaster";
  if (!isStaff) {
    return { success: false, error: "마스터·부마스터만 레이드를 만들 수 있습니다" };
  }

  if (!input.title.trim() || !input.raid_date || !input.raid_time) {
    return { success: false, error: "필수 항목을 입력하세요" };
  }

  const { data: inserted, error } = await supabase
    .from("raids")
    .insert({
      guild_id: guild.id,
      created_by: user.id,
      title: input.title.trim(),
      max_members: input.max_members,
      difficulty: input.difficulty,
      skill_level: input.skill_level,
      raid_date: input.raid_date,
      raid_time: input.raid_time,
      image_url: input.image_url,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message ?? "생성 실패" };
  }

  revalidatePath(`/guild/${code}/raids`);
  return { success: true, raidId: inserted.id };
}
