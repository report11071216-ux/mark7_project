"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function purchaseItem(
  guildCode: string,
  itemId: string,
  guildId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }
  const { data, error } = await supabase.rpc("purchase_shop_item", {
    p_item_id: itemId,
    p_guild_id: guildId,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const result = data as { success: boolean; error?: string; item_name?: string; price?: number };
  if (result.success) {
    revalidatePath(`/guild/${guildCode}/shop`);
    revalidatePath(`/guild/${guildCode}`);
  }
  return result;
}

export async function activateMegaphone(
  guildCode: string,
  purchaseId: string,
  message: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }
  const { data, error } = await supabase.rpc("activate_megaphone", {
    p_purchase_id: purchaseId,
    p_message: message,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const result = data as { success: boolean; error?: string };
  if (result.success) {
    revalidatePath(`/guild/${guildCode}/shop`);
    revalidatePath("/plaza");
  }
  return result;
}

export async function equipGuildMark(
  guildCode: string,
  purchaseId: string | null,
  guildId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }
  const { data, error } = await supabase.rpc("equip_guild_mark", {
    p_purchase_id: purchaseId,
    p_guild_id: guildId,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const result = data as { success: boolean; error?: string };
  if (result.success) {
    revalidatePath(`/guild/${guildCode}/inventory`);
    revalidatePath(`/guild/${guildCode}`);
  }
  return result;
}

// ── 이모티콘팩 장착/해제 ──
export async function toggleStickerPack(
  guildCode: string,
  guildId: string,
  shopItemId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }
  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    return { success: false, error: "마스터/부마스터만 장착할 수 있어요." };
  }
  const { data: owned } = await supabase
    .from("purchases")
    .select("id")
    .eq("guild_id", guildId)
    .eq("item_id", shopItemId)
    .limit(1)
    .maybeSingle();
  if (!owned) {
    return { success: false, error: "보유하지 않은 팩이에요." };
  }
  const { data: theme } = await supabase
    .from("guild_themes")
    .select("equipped_sticker_sets")
    .eq("guild_id", guildId)
    .maybeSingle();
  const current: string[] = Array.isArray(theme?.equipped_sticker_sets)
    ? (theme!.equipped_sticker_sets as string[])
    : [];
  let next: string[];
  if (current.includes(shopItemId)) {
    next = current.filter((id) => id !== shopItemId);
  } else {
    next = [...current, shopItemId];
  }
  const { error } = await supabase
    .from("guild_themes")
    .upsert(
      { guild_id: guildId, equipped_sticker_sets: next },
      { onConflict: "guild_id" }
    );
  if (error) {
    return { success: false, error: `저장 실패: ${error.message}` };
  }
  revalidatePath(`/guild/${guildCode}/inventory`);
  revalidatePath(`/guild/${guildCode}/chat`);
  return { success: true, equipped: next.includes(shopItemId) };
}

// ── 길드 보관함 아이템 삭제 (마스터/부마, 환불 없음) ──
export async function deleteGuildPurchase(
  guildCode: string,
  guildId: string,
  purchaseId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  // 마스터/부마 확인
  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    return { success: false, error: "마스터/부마스터만 삭제할 수 있어요." };
  }

  // 삭제 대상이 이 길드 것인지 확인
  const { data: target } = await supabase
    .from("purchases")
    .select("id, item_id, guild_id")
    .eq("id", purchaseId)
    .maybeSingle();
  if (!target || target.guild_id !== guildId) {
    return { success: false, error: "해당 아이템을 찾을 수 없어요." };
  }

  // 장착 중인 마크면 먼저 해제
  const { data: theme } = await supabase
    .from("guild_themes")
    .select("equipped_mark_id")
    .eq("guild_id", guildId)
    .maybeSingle();
  if (theme?.equipped_mark_id === purchaseId) {
    await supabase
      .from("guild_themes")
      .update({ equipped_mark_id: null })
      .eq("guild_id", guildId);
  }

  // 삭제
  const { error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", purchaseId);
  if (error) {
    return { success: false, error: `삭제 실패: ${error.message}` };
  }

  revalidatePath(`/guild/${guildCode}/inventory`);
  revalidatePath(`/guild/${guildCode}`);
  return { success: true };
}
// ── 길드 배경 장착/해제 ──
export async function toggleGuildBackground(
  guildCode: string,
  guildId: string,
  backgroundUrl: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    return { success: false, error: "마스터/부마스터만 장착할 수 있어요." };
  }

  // 현재 장착 상태 읽기
  const { data: theme } = await supabase
    .from("guild_themes")
    .select("equipped_background_url")
    .eq("guild_id", guildId)
    .maybeSingle();

  // 같은 배경이면 해제(null), 다르면 장착
  const isEquipped = theme?.equipped_background_url === backgroundUrl;
  const next = isEquipped ? null : backgroundUrl;

  const { error } = await supabase
    .from("guild_themes")
    .upsert(
      { guild_id: guildId, equipped_background_url: next },
      { onConflict: "guild_id" }
    );

  if (error) {
    return { success: false, error: `저장 실패: ${error.message}` };
  }

  revalidatePath(`/guild/${guildCode}/inventory`);
  revalidatePath(`/guild/${guildCode}`);
  return { success: true, equipped: next !== null };
}
