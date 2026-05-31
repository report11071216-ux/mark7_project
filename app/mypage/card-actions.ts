"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function equipAttendanceCard(cardId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

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

type DrawnCard = {
  id: string;
  grade: string;
  name: string;
  imageUrl: string | null;
  isNew: boolean;
};

// 공통: 카드 풀에서 한 장 뽑아 유저에게 지급 (메모리상 상태로 처리)
async function drawAndGrant(
  supabase: any,
  userId: string,
  poolByGrade: { [grade: string]: any[] },
  ownedSet: Set<string>
): Promise<DrawnCard | null> {
  const grade = drawCardGrade();
  const pool = poolByGrade[grade] ?? [];
  if (pool.length === 0) return null;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !ownedSet.has(picked.id);
  return {
    id: picked.id,
    grade: picked.grade,
    name: picked.name,
    imageUrl: picked.image_url,
    isNew,
  };
}

// 1회 뽑기 (뽑기권 1개 소모)
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
    cards: [
      {
        id: picked.id,
        grade: picked.grade,
        name: picked.name,
        imageUrl: picked.image_url,
        isNew,
      },
    ],
    ticketsEarned: ticketEarned ? 1 : 0,
    remainingTickets: newTickets,
  };
}

// 11연 뽑기 (뽑기권 11개 소모)
export async function drawEleven() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: state } = await supabase
    .from("user_card_state")
    .select("draw_tickets, total_duplicates")
    .eq("user_id", user.id)
    .maybeSingle();

  const tickets = state?.draw_tickets ?? 0;
  if (tickets < 11) {
    return { success: false, error: "뽑기권이 11개 필요해요" };
  }

  // 전체 활성 카드 풀 한 번에 조회
  const { data: allCards } = await supabase
    .from("attendance_cards")
    .select("id, grade, name, image_url")
    .eq("is_active", true);

  if (!allCards || allCards.length === 0) {
    return { success: false, error: "뽑을 카드가 없어요" };
  }

  const poolByGrade: { [grade: string]: any[] } = {};
  for (const c of allCards) {
    if (!poolByGrade[c.grade]) poolByGrade[c.grade] = [];
    poolByGrade[c.grade].push(c);
  }

  // 내 보유 카드 현황
  const { data: myCards } = await supabase
    .from("user_cards")
    .select("id, card_id, count")
    .eq("user_id", user.id);

  const ownedCountMap: { [cardId: string]: number } = {};
  const ownedRowMap: { [cardId: string]: string } = {};
  for (const uc of myCards ?? []) {
    ownedCountMap[uc.card_id] = uc.count ?? 1;
    ownedRowMap[uc.card_id] = uc.id;
  }

  let newDup = state?.total_duplicates ?? 0;
  let ticketsAfter = tickets - 11;
  let earnedTickets = 0;

  const results: DrawnCard[] = [];
  // 11번 뽑기 (메모리상 누적)
  for (let i = 0; i < 11; i++) {
    const grade = drawCardGrade();
    const pool = poolByGrade[grade];
    if (!pool || pool.length === 0) {
      // 해당 등급 비어있으면 커먼으로 폴백 (커먼도 없으면 스킵)
      const fallback = poolByGrade["common"];
      if (!fallback || fallback.length === 0) continue;
      const picked = fallback[Math.floor(Math.random() * fallback.length)];
      const wasOwned = ownedCountMap[picked.id] != null;
      if (wasOwned) { ownedCountMap[picked.id] += 1; newDup += 1; if (newDup % 5 === 0) earnedTickets += 1; }
      else { ownedCountMap[picked.id] = 1; }
      results.push({ id: picked.id, grade: picked.grade, name: picked.name, imageUrl: picked.image_url, isNew: !wasOwned });
      continue;
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const wasOwned = ownedCountMap[picked.id] != null;
    if (wasOwned) {
      ownedCountMap[picked.id] += 1;
      newDup += 1;
      if (newDup % 5 === 0) earnedTickets += 1;
    } else {
      ownedCountMap[picked.id] = 1;
    }
    results.push({
      id: picked.id,
      grade: picked.grade,
      name: picked.name,
      imageUrl: picked.image_url,
      isNew: !wasOwned,
    });
  }

  ticketsAfter += earnedTickets;

  // DB 반영: 뽑은 카드별로 upsert (있으면 count, 없으면 insert)
  // 결과를 card_id별로 집계
  const drawnCountById: { [cardId: string]: number } = {};
  for (const r of results) {
    drawnCountById[r.id] = (drawnCountById[r.id] ?? 0) + 1;
  }

  for (const cardId of Object.keys(drawnCountById)) {
    const addCount = drawnCountById[cardId];
    if (ownedRowMap[cardId]) {
      // 기존 보유 → count 증가 (원래 count + 이번에 뽑은 수)
      const { data: cur } = await supabase
        .from("user_cards")
        .select("count")
        .eq("id", ownedRowMap[cardId])
        .maybeSingle();
      await supabase
        .from("user_cards")
        .update({ count: (cur?.count ?? 1) + addCount })
        .eq("id", ownedRowMap[cardId]);
    } else {
      // 신규 → insert (이번에 뽑은 수)
      await supabase
        .from("user_cards")
        .insert({ user_id: user.id, card_id: cardId, count: addCount });
    }
  }

  await supabase
    .from("user_card_state")
    .update({
      draw_tickets: ticketsAfter,
      total_duplicates: newDup,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  revalidatePath("/mypage");
  return {
    success: true,
    cards: results,
    ticketsEarned: earnedTickets,
    remainingTickets: ticketsAfter,
  };
}
