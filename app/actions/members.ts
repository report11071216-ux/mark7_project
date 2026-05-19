"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─────────────────────────────
// 멤버 추방
// ─────────────────────────────
export async function kickMember(params: {
  guildId: string;
  guildCode: string;
  targetUserId: string;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 마스터 확인
  const { data: guild } = await supabase
    .from("guilds")
    .select("master_id")
    .eq("id", params.guildId)
    .maybeSingle();

  if (!guild || guild.master_id !== user.id) {
    return { success: false, error: "길드 마스터만 추방할 수 있습니다." };
  }

  // 자기 자신 추방 방지 (마스터 위임 후 탈퇴는 별개)
  if (params.targetUserId === user.id) {
    return { success: false, error: "자기 자신은 추방할 수 없습니다." };
  }

  // 추방 (RLS의 "Users can leave or be kicked" 정책으로 허용됨)
  const { error } = await supabase
    .from("guild_members")
    .delete()
    .eq("guild_id", params.guildId)
    .eq("user_id", params.targetUserId);

  if (error) {
    return { success: false, error: "추방 중 오류: " + error.message };
  }

  revalidatePath(`/g/${params.guildCode}`);
  revalidatePath(`/g/${params.guildCode}/admin`);
  revalidatePath("/my-guilds");

  return { success: true };
}

// ─────────────────────────────
// 마스터 위임 (RPC 호출)
// ─────────────────────────────
export async function transferMaster(params: {
  guildId: string;
  guildCode: string;
  newMasterId: string;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 7-B-1에서 만든 DB 함수 호출
  const { error } = await supabase.rpc("transfer_guild_master", {
    p_guild_id: params.guildId,
    p_new_master_id: params.newMasterId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/g/${params.guildCode}`);
  revalidatePath(`/g/${params.guildCode}/admin`);
  revalidatePath("/my-guilds");

  return { success: true };
}
