"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type DrawnCard = {
  id: string;
  grade: string;
  name: string;
  imageUrl: string | null;
  isNew: boolean;
};

// 출석 카드 장착/해제 (equip_attendance_card RPC)
export async function equipAttendanceCard(cardId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data, error } = await supabase.rpc("equip_attendance_card", {
    p_card_id: cardId,
  });
  if (error) return { success: false, error: `저장 실패: ${error.message}` };

  const result = (data ?? {}) as { success?: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error ?? "장착에 실패했어요" };
  }
  revalidatePath("/mypage");
  return { success: true };
}

// 1회 뽑기 (뽑기권 1개 소모) — draw_cards RPC
export async function drawWithTicket() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data, error } = await supabase.rpc("draw_cards", { p_count: 1 });
  if (error) return { success: false, error: `뽑기 실패: ${error.message}` };

  const result = (data ?? {}) as {
    success?: boolean;
    error?: string;
    cards?: DrawnCard[];
    ticketsEarned?: number;
    remainingTickets?: number;
  };
  if (!result.success) {
    return { success: false, error: result.error ?? "뽑기에 실패했어요" };
  }

  revalidatePath("/mypage");
  return {
    success: true,
    cards: result.cards ?? [],
    ticketsEarned: result.ticketsEarned ?? 0,
    remainingTickets: result.remainingTickets ?? 0,
  };
}

// 11연 뽑기 (뽑기권 11개 소모) — draw_cards RPC
export async function drawEleven() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data, error } = await supabase.rpc("draw_cards", { p_count: 11 });
  if (error) return { success: false, error: `뽑기 실패: ${error.message}` };

  const result = (data ?? {}) as {
    success?: boolean;
    error?: string;
    cards?: DrawnCard[];
    ticketsEarned?: number;
    remainingTickets?: number;
  };
  if (!result.success) {
    return { success: false, error: result.error ?? "뽑기에 실패했어요" };
  }

  revalidatePath("/mypage");
  return {
    success: true,
    cards: result.cards ?? [],
    ticketsEarned: result.ticketsEarned ?? 0,
    remainingTickets: result.remainingTickets ?? 0,
  };
}
