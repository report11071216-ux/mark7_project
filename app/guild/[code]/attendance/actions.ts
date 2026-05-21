// app/guild/[code]/attendance/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAttendanceDate } from "@/lib/attendance";
import { revalidatePath } from "next/cache";

const ATTENDANCE_POINTS = 1; // TODO: 8-E에서 platform_settings로 이관

export async function checkAttendance(guildCode: string) {
  const supabase = await createClient();
  // 1. 로그인 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }
  // 2. 길드 조회
  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", guildCode)
    .single();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }
  // 3. 멤버십 확인
  const { data: member } = await supabase
    .from("guild_members")
    .select("id, points")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .single();
  if (!member) {
    return { success: false, error: "길드원이 아닙니다" };
  }
  // 4. 오늘 출석일 계산 (오전 6시 리셋)
  const today = getAttendanceDate();
  // 5. 중복 출석 체크
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
  // 6. 출석 기록 insert
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
  // 7. 개인 포인트 +1
  await supabase
    .from("guild_members")
    .update({ points: (member.points ?? 0) + ATTENDANCE_POINTS })
    .eq("id", member.id);
  // 8. 길드 포인트 +1 (현재 값 조회 후 업데이트)
  const { data: guildData } = await supabase
    .from("guilds")
    .select("total_points")
    .eq("id", guild.id)
    .single();
  await supabase
    .from("guilds")
    .update({ total_points: (guildData?.total_points ?? 0) + ATTENDANCE_POINTS })
    .eq("id", guild.id);
  // 9. 페이지 캐시 무효화
  revalidatePath(`/guild/${guildCode}`);
  return { success: true, points: ATTENDANCE_POINTS };
}
