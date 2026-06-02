import { createClient } from "@/lib/supabase/server";

export type NotificationType = "notice" | "raid" | "welcome" | "join";

type ChannelSetting = { url?: string; enabled?: boolean };

type NotificationSettings = {
  default_url?: string;
  notice?: ChannelSetting;
  raid?: ChannelSetting;
  welcome?: ChannelSetting;
  join?: ChannelSetting;
};

export function isValidDiscordWebhook(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("https://discord.com/api/webhooks/") ||
    trimmed.startsWith("https://discordapp.com/api/webhooks/")
  );
}

export function resolveWebhookUrl(
  settings: NotificationSettings | null | undefined,
  type: NotificationType
): { url: string | null; enabled: boolean } {
  const s = settings ?? {};
  const channel: ChannelSetting = s[type] ?? {};
  const enabled = channel.enabled !== false;
  const specific = (channel.url ?? "").trim();
  const fallback = (s.default_url ?? "").trim();
  const url = specific || fallback || null;
  return { url, enabled };
}

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

// ─────────────────────────────────────────────
// 메시지 빌더 (문구를 바꾸려면 이 아래만 고치면 됨)
// ─────────────────────────────────────────────
// 👋 환영: 새 길드원이 들어왔을 때. welcomeMessage가 있으면 덧붙임
export function buildWelcomeMessage(
  memberName: string,
  welcomeMessage?: string | null
): string {
  const name = memberName?.trim() || "새 길드원";
  let msg = `👋 새 길드원 **${name}**님이 들어왔어요! 환영해 주세요 🎉`;
  const extra = (welcomeMessage ?? "").trim();
  if (extra) {
    msg += `\n${extra}`;
  }
  return msg;
}

// 📢 공지: 공지글이 올라왔을 때
export function buildNoticeMessage(
  title: string,
  authorName: string
): string {
  const t = title?.trim() || "(제목 없음)";
  const author = authorName?.trim() || "운영진";
  return `📢 **새 공지가 올라왔어요**\n${t}\n작성자: ${author}`;
}

// ⚔️ 레이드: 새 일정이 열렸을 때
export function buildRaidMessage(args: {
  raidTitle: string;
  difficulty: string;
  skillLevel: string;
  maxMembers: number;
  scheduledDate: string;
  scheduledTime: string;
}): string {
  const raid = args.raidTitle?.trim() || "레이드";
  const parts = [raid, args.difficulty, args.skillLevel].filter(Boolean);
  return (
    `⚔️ **새 레이드 일정이 열렸어요!**\n` +
    `${parts.join(" · ")}\n` +
    `🗓️ ${args.scheduledDate} ${args.scheduledTime} · 정원 ${args.maxMembers}명`
  );
}

// 🙋 가입 신청: 누군가 길드에 가입 신청했을 때
export function buildJoinRequestMessage(
  applicantName: string,
  message?: string | null
): string {
  const name = applicantName?.trim() || "누군가";
  let msg = `🙋 **${name}**님이 가입을 신청했어요!\n관리자 패널에서 승인/거절할 수 있어요.`;
  const extra = (message ?? "").trim();
  if (extra) {
    msg += `\n신청 메시지: ${extra}`;
  }
  return msg;
}
