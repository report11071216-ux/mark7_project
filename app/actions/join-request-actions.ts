"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendGuildWebhook, buildJoinRequestMessage } from "@/lib/discord";

// 가입 신청 (유저)
export async function requestJoinGuild(guildId: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  // 이미 길드원인지
  const { data: existing } = await supabase
    .from("guild_members")
    .select("id")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { success: false, error: "이미 이 길드의 멤버예요" };

  // 가입 가능 길드 수 제한 (베타 2개)
  const { count: myGuildCount } = await supabase
    .from("guild_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((myGuildCount ?? 0) >= 2) {
    return { success: false, error: "베타에서는 최대 2개 길드까지 가입할 수 있어요" };
  }

  const cleanMessage = (message ?? "").trim().slice(0, 200);

  const { error } = await supabase
    .from("guild_join_requests")
    .insert({
      guild_id: guildId,
      user_id: user.id,
      message: cleanMessage,
      status: "pending",
    });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "이미 가입 신청을 했어요" };
    }
    return { success: false, error: "신청에 실패했어요" };
  }

  // 디스코드 가입신청 알림 (신청자 이름 조회 후 발송)
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, main_character_name")
    .eq("id", user.id)
    .maybeSingle();
  const applicantName = profile?.main_character_name || profile?.username || "누군가";
  await sendGuildWebhook(guildId, "join", buildJoinRequestMessage(applicantName, cleanMessage));

  revalidatePath("/plaza/recruiting");
  return { success: true };
}

// 신청 취소 (유저)
export async function cancelJoinRequest(guildId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("guild_join_requests")
    .delete()
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { success: false, error: "취소에 실패했어요" };
  return { success: true };
}
