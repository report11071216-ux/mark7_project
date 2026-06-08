// app/guild/[code]/admin/member-actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
// 부마 임명/해제 (마스터만)
export async function setSubmasterRole(
  guildCode: string,
  guildId: string,
  targetUserId: string,
  makeSubmaster: boolean
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_submaster_role", {
    p_guild_id: guildId,
    p_target_user_id: targetUserId,
    p_make_submaster: makeSubmaster,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const result = (data ?? {}) as { success?: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error ?? "처리에 실패했어요" };
  }
  revalidatePath(`/guild/${guildCode.toUpperCase()}/admin`);
  revalidatePath(`/guild/${guildCode.toUpperCase()}/members`);
  return { success: true };
}
// 강퇴 (마스터: 부마·멤버 / 부마: 멤버만)
export async function kickMember(
  guildCode: string,
  guildId: string,
  targetUserId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("kick_member", {
    p_guild_id: guildId,
    p_target_user_id: targetUserId,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const result = (data ?? {}) as { success?: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error ?? "강퇴에 실패했어요" };
  }
  revalidatePath(`/guild/${guildCode.toUpperCase()}/admin`);
  revalidatePath(`/guild/${guildCode.toUpperCase()}/members`);
  return { success: true };
}
// 마스터 양도 (마스터만) — 양도 후 본인은 일반 길드원으로 강등
export async function transferMaster(
  guildCode: string,
  guildId: string,
  newMasterId: string
) {
  const supabase = await createClient();
  // transfer_guild_master RPC: boolean 반환, 실패 시 EXCEPTION
  const { error } = await supabase.rpc("transfer_guild_master", {
    p_guild_id: guildId,
    p_new_master_id: newMasterId,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/guild/${guildCode.toUpperCase()}/admin`);
  revalidatePath(`/guild/${guildCode.toUpperCase()}/members`);
  revalidatePath(`/guild/${guildCode.toUpperCase()}`);
  return { success: true };
}
