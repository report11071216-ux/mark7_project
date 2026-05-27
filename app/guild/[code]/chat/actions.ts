"use server";
import { createClient } from "@/lib/supabase/server";

type SendResult =
  | { ok: true; message: { id: string; user_id: string; content: string; created_at: string } }
  | { ok: false; error: string };

export async function sendMessage(guildCode: string, content: string): Promise<SendResult> {
  const text = (content ?? "").trim();
  if (!text) return { ok: false, error: "메시지를 입력해 주세요." };
  if (text.length > 1000) return { ok: false, error: "메시지가 너무 길어요. (최대 1000자)" };

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const code = guildCode.toUpperCase();
  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) return { ok: false, error: "길드를 찾을 수 없어요." };

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { ok: false, error: "이 길드의 멤버가 아니에요." };

  const { data: inserted, error } = await supabase
    .from("guild_messages")
    .insert({ guild_id: guild.id, user_id: user.id, content: text })
    .select("id, user_id, content, created_at")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "메시지 전송에 실패했어요." };
  }

  return { ok: true, message: inserted };
}
