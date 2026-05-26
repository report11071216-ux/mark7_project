"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── (1) 레이드 도감 등록 ──
type NewRaidEntryInput = {
  title: string;
  image_url: string | null;
  gold_normal: number;
  gold_hard: number;
  gold_nightmare: number;
};

export async function createRaidEntry(guildCode: string, input: NewRaidEntryInput) {
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
    return { success: false, error: "마스터·부마스터만 레이드를 등록할 수 있습니다" };
  }

  if (!input.title.trim()) {
    return { success: false, error: "레이드명을 입력하세요" };
  }

  const { data: inserted, error } = await supabase
    .from("raids")
    .insert({
      guild_id: guild.id,
      created_by: user.id,
      title: input.title.trim(),
      image_url: input.image_url,
      gold_normal: input.gold_normal,
      gold_hard: input.gold_hard,
      gold_nightmare: input.gold_nightmare,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message ?? "등록 실패" };
  }

  revalidatePath(`/guild/${code}/raids`);
  return { success: true, raidId: inserted.id };
}

// ── 레이드 도감 삭제 ──
export async function deleteRaidEntry(guildCode: string, raidId: string) {
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
    return { success: false, error: "마스터·부마스터만 삭제할 수 있습니다" };
  }

  const { error } = await supabase
    .from("raids")
    .delete()
    .eq("id", raidId)
    .eq("guild_id", guild.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/guild/${code}/raids`);
  return { success: true };
}
