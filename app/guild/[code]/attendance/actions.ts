"use server";
import { createClient } from "@/lib/supabase/server";
import { getAttendanceDate } from "@/lib/attendance";
import { revalidatePath } from "next/cache";

type AttendanceCard = {
  id: string;
  grade: string;
  name: string;
  imageUrl: string | null;
  isNew: boolean;
  ticketEarned: boolean;
};

type AttendanceResult = {
  success: boolean;
  error?: string;
  points?: number;
  bonusPoints?: number;
  card?: AttendanceCard | null;
};

export async function checkAttendance(guildCode: string): Promise<AttendanceResult> {
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

  const today = getAttendanceDate();

  // 출석 처리 전체를 서버 함수(SECURITY DEFINER)에서 수행 — 위조/조작 차단
  const { data, error } = await supabase.rpc("check_attendance", {
    p_guild_id: guild.id,
    p_attendance_date: today,
  });

  if (error) {
    return { success: false, error: "출석 처리 중 오류가 발생했어요" };
  }

  const res = (data ?? {}) as {
    success?: boolean;
    error?: string;
    points?: number;
    bonusPoints?: number;
    card?: AttendanceCard | null;
  };

  if (!res.success) {
    return { success: false, error: res.error || "출석에 실패했어요" };
  }

  revalidatePath(`/guild/${guildCode}`);
  revalidatePath("/mypage");

  return {
    success: true,
    points: res.points ?? 0,
    bonusPoints: res.bonusPoints ?? 0,
    card: res.card ?? null,
  };
}
