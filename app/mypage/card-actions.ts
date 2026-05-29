"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function equipAttendanceCard(grade: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  if (grade) {
    const { data: owned } = await supabase
      .from("user_cards")
      .select("id")
      .eq("user_id", user.id)
      .eq("grade", grade)
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
        equipped_grade: grade,
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

export async function drawWithTicket() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: state } = await supabase
    .from("user_card_state")
    .select("equipped_grade, draw_tickets, total_duplicates")
    .eq("user_id", user.id)
    .maybeSingle();

  const tickets = state?.draw_tickets ?? 0;
  if (tickets < 1) {
    return { success: false, error: "뽑기권이 없어요" };
  }

  const r = Math.random() * 100;
  let grade = "common";
  if (r >= 98) grade = "epic";
  else if (r >= 90) grade = "unique";
  else if (r >= 70) grade = "rare";

  let isNew = false;
  let ticketEarned = false;
  let newTickets = tickets - 1;
  let newDup = state?.total_duplicates ?? 0;

  const { data: owned } = await supabase
    .from("user_cards")
    .select("id, count")
    .eq("user_id", user.id)
    .eq("grade", grade)
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
      .insert({ user_id: user.id, grade, count: 1 });
  }

  // equipped_grade는 기존 값 그대로 유지
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
    card: { grade, isNew, ticketEarned },
    remainingTickets: newTickets,
  };
}
