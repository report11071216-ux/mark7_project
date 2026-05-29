"use server";
import { createClient } from "@/lib/supabase/server";
import { getAttendanceDate } from "@/lib/attendance";
import { revalidatePath } from "next/cache";

const ATTENDANCE_POINTS = 1;

// 카드 뽑기 확률 (커먼70 / 레어20 / 유니크8 / 에픽2)
function drawCardGrade(): string {
  const r = Math.random() * 100;
  if (r < 70) return "common";
  if (r < 90) return "rare";   // 70~90 = 20%
  if (r < 98) return "unique"; // 90~98 = 8%
  return "epic";               // 98~100 = 2%
}

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

  // ── 장착 카드 보너스 포인트 계산 ──
  const { data: cardState } = await supabase
    .from("user_card_state")
    .select("equipped_grade, draw_tickets, total_duplicates")
    .eq("user_id", user.id)
    .maybeSingle();

  let bonusPoints = 0;
  if (cardState?.equipped_grade) {
    const { data: equippedCard } = await supabase
      .from("attendance_cards")
      .select("bonus_points")
      .eq("grade", cardState.equipped_grade)
      .maybeSingle();
    bonusPoints = equippedCard?.bonus_points ?? 0;
  }
  const totalPoints = ATTENDANCE_POINTS + bonusPoints;

  // ── 출석 기록 ──
  const { error: insertError } = await supabase
    .from("attendances")
    .insert({
      guild_id: guild.id,
      user_id: user.id,
      attendance_date: today,
      points_earned: totalPoints,
    });
  if (insertError) {
    return { success: false, error: "출석 기록 실패" };
  }

  // 개인 포인트 적립 (기본 + 카드 보너스)
  await supabase
    .from("guild_members")
    .update({ points: (member.points ?? 0) + totalPoints })
    .eq("id", member.id);

  // ── 카드 뽑기 ──
  const drawnGrade = drawCardGrade();
  let isNew = false;
  let ticketEarned = false;

  // 이미 가진 등급인지 확인
  const { data: ownedCard } = await supabase
    .from("user_cards")
    .select("id, count")
    .eq("user_id", user.id)
    .eq("grade", drawnGrade)
    .maybeSingle();

  if (ownedCard) {
    // 중복 → count +1
    await supabase
      .from("user_cards")
      .update({ count: (ownedCard.count ?? 1) + 1 })
      .eq("id", ownedCard.id);

    // 누적 중복 +1, 5의 배수면 뽑기권 지급
    const prevDup = cardState?.total_duplicates ?? 0;
    const newDup = prevDup + 1;
    const prevTickets = cardState?.draw_tickets ?? 0;
    let newTickets = prevTickets;
    if (newDup % 5 === 0) {
      newTickets = prevTickets + 1;
      ticketEarned = true;
    }
    await supabase
      .from("user_card_state")
      .upsert(
        {
          user_id: user.id,
          equipped_grade: cardState?.equipped_grade ?? null,
          draw_tickets: newTickets,
          total_duplicates: newDup,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  } else {
    // 새 등급 → 도감 추가
    isNew = true;
    await supabase
      .from("user_cards")
      .insert({ user_id: user.id, grade: drawnGrade, count: 1 });

    // 상태 행이 없으면 생성 (중복 아님 → total_duplicates 변동 없음)
    if (!cardState) {
      await supabase
        .from("user_card_state")
        .insert({ user_id: user.id, total_duplicates: 0, draw_tickets: 0 });
    }
  }

  revalidatePath(`/guild/${guildCode}`);
  revalidatePath("/mypage");

  return {
    success: true,
    points: totalPoints,
    bonusPoints,
    // 카드 뽑기 결과 (연출용)
    card: {
      grade: drawnGrade,
      isNew,         // 처음 획득한 등급인지
      ticketEarned,  // 이번에 뽑기권 받았는지
    },
  };
}
