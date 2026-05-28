import { createClient } from "@/lib/supabase/server";

export type NotificationType = "notice" | "raid" | "welcome";

type ChannelSetting = { url?: string; enabled?: boolean };
type NotificationSettings = {
  default_url?: string;
  notice?: ChannelSetting;
  raid?: ChannelSetting;
  welcome?: ChannelSetting;
};

export function isValidDiscordWebhook(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("https://discord.com/api/webhooks/") ||
    trimmed.startsWith("https://discordapp.com/api/webhooks/")
  );
}

// 종류에 맞는 실제 발송 URL 결정: 종류별 URL 있으면 그걸로, 없으면 기본 URL
export function resolveWebhookUrl(
  settings: NotificationSettings | null | undefined,
  type: NotificationType
): { url: string | null; enabled: boolean } {
  const s = settings ?? {};
  const channel: ChannelSetting = s[type] ?? {};
  // enabled 기본값 true (키가 없으면 켜진 것으로 간주)
  const enabled = channel.enabled !== false;
  const specific = (channel.url ?? "").trim();
  const fallback = (s.default_url ?? "").trim();
  const url = specific || fallback || null;
  return { url, enabled };
}

// 직접 URL로 메시지 발송 (저수준)
export async function postToWebhook(
  url: string,
  content: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "길드패스", content }),
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "unknown" };
  }
}

// 길드 ID + 종류로 알림 발송 (2단계에서 이 함수만 부르면 됨)
// 실패해도 throw 하지 않음 — 알림 실패가 본 기능을 막으면 안 되므로
export async function sendGuildWebhook(
  guildId: string,
  type: NotificationType,
  content: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: guild } = await supabase
      .from("guilds")
      .select("notification_settings")
      .eq("id", guildId)
      .maybeSingle();

    const { url, enabled } = resolveWebhookUrl(
      guild?.notification_settings as NotificationSettings,
      type
    );
    if (!enabled || !url) return;
    await postToWebhook(url, content);
  } catch {
    // 조용히 무시 (알림은 부가 기능)
  }
}
