"use server";
import { createClient } from "@/lib/supabase/server";
import { getAttendanceDate } from "@/lib/attendance";
import { revalidatePath } from "next/cache";

const ATTENDANCE_POINTS = 1;

export async function checkAttendance(guildCode: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", guildCode)
    .single();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: member } = await supabase
    .from("guild_members")
    .select("id, points")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .single();
  if (!member) {
    return { success: false, error: "길드원이 아닙니다" };
  }

  const today = getAttendanceDate();

  const { data: existing } = await supabase
    .from("attendances")
    .select("id")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .eq("attendance_date", today)
    .maybeSingle();
  if (existing) {
    return { success: false, error: "오늘 이미 출석했습니다" };
  }

  const { error: insertError } = await supabase
    .from("attendances")
    .insert({
      guild_id: guild.id,
      user_id: user.id,
      attendance_date: today,
      points_earned: ATTENDANCE_POINTS,
    });
  if (insertError) {
    return { success: false, error: "출석 기록 실패" };
  }

  await supabase
    .from("guild_members")
    .update({ points: (member.points ?? 0) + ATTENDANCE_POINTS })
    .eq("id", member.id);

  revalidatePath(`/guild/${guildCode}`);
  return { success: true, points: ATTENDANCE_POINTS };
}
