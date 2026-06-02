"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 승인 (길드장/부마) — RPC 호출
export async function approveJoinRequest(guildCode: string, requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data, error } = await supabase.rpc("approve_join_request", {
    p_request_id: requestId,
  });
  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string };
  if (result.success) {
    revalidatePath(`/guild/${guildCode}/admin`);
    revalidatePath(`/guild/${guildCode}/members`);
  }
  return result;
}

// 거절 (길드장/부마)
export async function rejectJoinRequest(guildCode: string, requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("guild_join_requests")
    .update({ status: "rejected", processed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) return { success: false, error: "거절 처리에 실패했어요" };

  revalidatePath(`/guild/${guildCode}/admin`);
  return { success: true };
}
