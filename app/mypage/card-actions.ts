"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 카드 장착 / 해제 (card_id 기준)
export async function equipAttendanceCard(cardId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  // 장착하려는 카드를 실제 보유했는지 확인 (해제는 null이라 통과)
  if (cardId) {
    const { data: owned } = await supabase
      .from("user_cards")
      .select("id")
      .eq("user_id", user.id)
      .eq("card_id", cardId)
      .maybeSingle();
    if (!owned) {
      return { success: false, error: "보유하지 않은 카드예요" };
    }
  }

  const { data: state } = await supabase
    .from("user_card_state")
    .select("draw_tickets, total_duplicates")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("user_card_state")
    .upsert(
      {
        user_id: user.id,
        equipped_card_id: cardId,
        draw_tickets: state?.draw_tickets ?? 0,
        total_duplicates: state?.total_duplicates ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return { success: false, error: `저장 실패: ${error.message}` };
  revalidatePath("/mypage");
  return { success: true };
}

function drawCardGrade(): string {
  const r = Math.random() * 100;
  if (r < 70) return "common";
  if (r < 90) return "rare";
  if (r < 98) return "unique";
  return "epic";
}

// 뽑기권으로 추가 뽑기
export async function drawWithTicket() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: state } = await supabase
    .from("user_card_state")
    .select("draw_tickets, total_duplicates")
    .eq("user_id", user.id)
    .maybeSingle();

  const tickets = state?.draw_tickets ?? 0;
  if (tickets < 1) {
    return { success: false, error: "뽑기권이 없어요" };
  }

  const grade = drawCardGrade();
  const { data: pool } = await supabase
    .from("attendance_cards")
    .select("id, grade, name, image_url")
    .eq("grade", grade)
    .eq("is_active", true);

  if (!pool || pool.length === 0) {
    return { success: false, error: "뽑을 카드가 없어요 (해당 등급 미등록)" };
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];

  let isNew = false;
  let ticketEarned = false;
  let newTickets = tickets - 1;
  let newDup = state?.total_duplicates ?? 0;

  const { data: owned } = await supabase
    .from("user_cards")
    .select("id, count")
    .eq("user_id", user.id)
    .eq("card_id", picked.id)
    .maybeSingle();

  if (owned) {
    await supabase
      .from("user_cards")
      .update({ count: (owned.count ?? 1) + 1 })
      .eq("id", owned.id);
    newDup = newDup + 1;
    if (newDup % 5 === 0) {
      newTickets = newTickets + 1;
      ticketEarned = true;
    }
  } else {
    isNew = true;
    await supabase
      .from("user_cards")
      .insert({ user_id: user.id, card_id: picked.id, count: 1 });
  }

  // equipped_card_id는 건드리지 않고 뽑기권/중복만 갱신
  await supabase
    .from("user_card_state")
    .update({
      draw_tickets: newTickets,
      total_duplicates: newDup,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  revalidatePath("/mypage");
  return {
    success: true,
    card: {
      id: picked.id,
      grade: picked.grade,
      name: picked.name,
      imageUrl: picked.image_url,
      isNew,
      ticketEarned,
    },
    remainingTickets: newTickets,
  };
}
