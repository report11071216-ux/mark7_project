"use server";
import { createClient } from "@/lib/supabase/server";
import { getAttendanceDate } from "@/lib/attendance";
import { revalidatePath } from "next/cache";

const ATTENDANCE_POINTS = 1;

function drawCardGrade(): string {
  const r = Math.random() * 100;
  if (r < 85) return "common";    // 85%
  if (r < 97) return "rare";      // 12%
  if (r < 99.5) return "unique";  // 2.5%
  return "epic";                  // 0.5%
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

  // ── 장착 카드 보너스 포인트 (장착 card_id → 그 카드의 grade → bonus_points) ──
  const { data: cardState } = await supabase
    .from("user_card_state")
    .select("equipped_card_id, draw_tickets, total_duplicates")
    .eq("user_id", user.id)
    .maybeSingle();

  let bonusPoints = 0;
  if (cardState?.equipped_card_id) {
    const { data: equippedCard } = await supabase
      .from("attendance_cards")
      .select("grade")
      .eq("id", cardState.equipped_card_id)
      .maybeSingle();
    if (equippedCard?.grade) {
      const { data: gradeRow } = await supabase
        .from("attendance_card_grades")
        .select("bonus_points")
        .eq("grade", equippedCard.grade)
        .maybeSingle();
      bonusPoints = gradeRow?.bonus_points ?? 0;
    }
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

  // ── 개인 포인트 적립 (출석 + 카드 보너스) ──
  await supabase
    .from("guild_members")
    .update({ points: (member.points ?? 0) + totalPoints })
    .eq("id", member.id);

  // ── 길드 포인트 적립 (개인과 동일하게 출석 + 카드 보너스만큼) ──
 // 로그용 이름 조회
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("username, main_character_name")
    .eq("id", user.id)
    .maybeSingle();
  const actorName = actorProfile?.main_character_name || actorProfile?.username || null;

  await supabase.rpc("increment_guild_points", {
    p_guild_id: guild.id,
    p_amount: totalPoints,
    p_actor_name: actorName,
    p_log_type: "attendance",
    p_memo: null,
  });

  // ── 카드 뽑기: 등급 뽑고 → 그 등급 활성 카드 중 랜덤 1장 ──
  const drawnGrade = drawCardGrade();
  let drawnCard: { id: string; grade: string; name: string; image_url: string | null } | null = null;
  let isNew = false;
  let ticketEarned = false;

  const { data: pool } = await supabase
    .from("attendance_cards")
    .select("id, grade, name, image_url")
    .eq("grade", drawnGrade)
    .eq("is_active", true);

  if (pool && pool.length > 0) {
    const picked = pool[Math.floor(Math.random() * pool.length)];
    drawnCard = picked;

    // 이미 가진 카드인지 (card_id 기준)
    const { data: owned } = await supabase
      .from("user_cards")
      .select("id, count")
      .eq("user_id", user.id)
      .eq("card_id", picked.id)
      .maybeSingle();

    if (owned) {
      // 중복
      await supabase
        .from("user_cards")
        .update({ count: (owned.count ?? 1) + 1 })
        .eq("id", owned.id);

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
            equipped_card_id: cardState?.equipped_card_id ?? null,
            draw_tickets: newTickets,
            total_duplicates: newDup,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    } else {
      // 새 카드
      isNew = true;
      await supabase
        .from("user_cards")
        .insert({ user_id: user.id, card_id: picked.id, count: 1 });

      if (!cardState) {
        await supabase
          .from("user_card_state")
          .insert({ user_id: user.id, total_duplicates: 0, draw_tickets: 0 });
      }
    }
  }
  // pool이 비어있으면(해당 등급 카드 미등록) 그냥 뽑기 스킵 (출석은 정상 처리됨)

  revalidatePath(`/guild/${guildCode}`);
  revalidatePath("/mypage");

  return {
    success: true,
    points: totalPoints,
    bonusPoints,
    card: drawnCard
      ? {
          id: drawnCard.id,
          grade: drawnCard.grade,
          name: drawnCard.name,
          imageUrl: drawnCard.image_url,
          isNew,
          ticketEarned,
        }
      : null,
  };
}
