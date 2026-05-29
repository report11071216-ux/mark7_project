"use server";
import { createClient } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  message_type: string;
  sticker_url: string | null;
};

type SendResult = { ok: true; message: MessageRow } | { ok: false; error: string };

type MembershipCtx =
  | { ok: false; error: string }
  | { ok: true; user: { id: string }; guildId: string; supabase: Awaited<ReturnType<typeof createClient>> };

async function getGuildMembership(guildCode: string): Promise<MembershipCtx> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const code = guildCode.toUpperCase();
  const { data: guild } = await supabase
    .from("guilds").select("id").eq("code", code).maybeSingle();
  if (!guild) return { ok: false, error: "길드를 찾을 수 없어요." };
  const { data: membership } = await supabase
    .from("guild_members").select("role")
    .eq("guild_id", guild.id).eq("user_id", user.id).maybeSingle();
  if (!membership) return { ok: false, error: "이 길드의 멤버가 아니에요." };
  return { ok: true, user, guildId: guild.id, supabase };
}

export async function sendMessage(guildCode: string, content: string): Promise<SendResult> {
  const text = (content ?? "").trim();
  if (!text) return { ok: false, error: "메시지를 입력해 주세요." };
  if (text.length > 1000) return { ok: false, error: "메시지가 너무 길어요. (최대 1000자)" };

  const ctx = await getGuildMembership(guildCode);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { data: inserted, error } = await ctx.supabase
    .from("guild_messages")
    .insert({ guild_id: ctx.guildId, user_id: ctx.user.id, content: text, message_type: "text" })
    .select("id, user_id, content, created_at, message_type, sticker_url")
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "메시지 전송에 실패했어요." };
  }
  return { ok: true, message: inserted as MessageRow };
}

export async function sendSticker(guildCode: string, stickerUrl: string): Promise<SendResult> {
  const url = (stickerUrl ?? "").trim();
  if (!url) return { ok: false, error: "이모티콘이 올바르지 않아요." };

  const ctx = await getGuildMembership(guildCode);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  // 장착된 팩의 이모티콘만 전송 허용 (검증)
  const { data: theme } = await ctx.supabase
    .from("guild_themes")
    .select("equipped_sticker_sets")
    .eq("guild_id", ctx.guildId)
    .maybeSingle();
  const sets: string[] = Array.isArray(theme?.equipped_sticker_sets)
    ? (theme!.equipped_sticker_sets as string[]) : [];
  if (sets.length === 0) {
    return { ok: false, error: "장착된 이모티콘팩이 없어요." };
  }
  const { data: valid } = await ctx.supabase
    .from("stickers")
    .select("id")
    .eq("image_url", url)
    .in("shop_item_id", sets)
    .limit(1)
    .maybeSingle();
  if (!valid) {
    return { ok: false, error: "사용할 수 없는 이모티콘이에요." };
  }

  const { data: inserted, error } = await ctx.supabase
    .from("guild_messages")
    .insert({
      guild_id: ctx.guildId,
      user_id: ctx.user.id,
      content: "",
      message_type: "sticker",
      sticker_url: url,
    })
    .select("id, user_id, content, created_at, message_type, sticker_url")
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "이모티콘 전송에 실패했어요." };
  }
  return { ok: true, message: inserted as MessageRow };
}

type DeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteMessage(messageId: string): Promise<DeleteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const { data: target } = await supabase
    .from("guild_messages").select("id, user_id").eq("id", messageId).maybeSingle();
  if (!target) return { ok: false, error: "메시지를 찾을 수 없어요." };
  if (target.user_id !== user.id) return { ok: false, error: "본인 메시지만 삭제할 수 있어요." };
  const { error } = await supabase.from("guild_messages").delete().eq("id", messageId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

type ReactionResult = { ok: true; action: "added" | "removed" } | { ok: false; error: string };

export async function toggleReaction(messageId: string, emoji: string): Promise<ReactionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const { data: existing } = await supabase
    .from("message_reactions").select("id")
    .eq("message_id", messageId).eq("user_id", user.id).eq("emoji", emoji).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("message_reactions").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, action: "removed" };
  } else {
    const { error } = await supabase
      .from("message_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
    if (error) return { ok: false, error: error.message };
    return { ok: true, action: "added" };
  }
}
