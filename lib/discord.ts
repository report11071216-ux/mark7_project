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

// 디스코드 임베드 (레이드 알림용)
export type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  author?: { name: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: { url: string };
  footer?: { text: string };
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
  content: string,
  embeds?: DiscordEmbed[]
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const body: { username: string; content?: string; embeds?: DiscordEmbed[] } = {
      username: "길드패스",
    };
    if (content) body.content = content;
    if (embeds && embeds.length > 0) body.embeds = embeds;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

// 임베드 발송 (레이드 알림용)
export async function sendGuildEmbed(
  guildId: string,
  type: NotificationType,
  embed: DiscordEmbed
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
    await postToWebhook(url, "", [embed]);
  } catch {
    // 조용히 무시 (알림은 부가 기능)
  }
}

// ─────────────────────────────────────────────
// 메시지 빌더 (문구를 바꾸려면 이 아래만 고치면 됨)
// ─────────────────────────────────────────────
const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-06-18" + "20:00" → "6월 18일 (목) 오후 8:00"
function formatKDateTime(dateStr: string, timeStr: string): string {
  const dp = (dateStr || "").split("-");
  if (dp.length !== 3) return (dateStr || "") + " " + (timeStr || "");
  const y = Number(dp[0]);
  const m = Number(dp[1]);
  const d = Number(dp[2]);
  if (!y || !m || !d) return (dateStr || "") + " " + (timeStr || "");
  const wd = KO_WEEKDAYS[new Date(y, m - 1, d).getDay()];

  const t = (timeStr || "").slice(0, 5);
  const tp = t.split(":");
  let label = "";
  if (tp.length === 2) {
    const hh = Number(tp[0]);
    const mm = tp[1];
    const ampm = hh < 12 ? "오전" : "오후";
    let h12 = hh % 12;
    if (h12 === 0) h12 = 12;
    label = " " + ampm + " " + h12 + ":" + mm;
  }
  return m + "월 " + d + "일 (" + wd + ")" + label;
}

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

// ⚔️ 레이드 (임베드): 새 일정이 열렸을 때
export function buildRaidEmbed(args: {
  raidTitle: string;
  difficulty: string;
  skillLevel: string;
  maxMembers: number;
  scheduledDate: string;
  scheduledTime: string;
  raidImage?: string | null;
}): DiscordEmbed {
  const raid = args.raidTitle?.trim() || "레이드";
  const diff = args.difficulty || "노말";
  const skill = (args.skillLevel || "").trim();

  // 난이도 색상 (앱 통일 색: 노말=노랑 / 하드=빨강 / 나메=보라)
  let color = 0xeab308;
  if (diff === "하드") color = 0xef4444;
  else if (diff === "나메") color = 0x8b5cf6;

  const diffValue = skill ? diff + " · " + skill : diff;

  const embed: DiscordEmbed = {
    author: { name: "⚔️ 새 레이드 모집" },
    title: raid,
    color: color,
    fields: [
      { name: "난이도", value: diffValue, inline: true },
      { name: "정원", value: args.maxMembers + "명", inline: true },
      {
        name: "일시",
        value: formatKDateTime(args.scheduledDate, args.scheduledTime),
        inline: false,
      },
    ],
    footer: { text: "길드패스" },
  };

  const img = (args.raidImage ?? "").trim();
  if (img && img.startsWith("http")) {
    embed.thumbnail = { url: img };
  }

  return embed;
}

// 🙋 레이드 참여 (임베드): 누군가 참여 신청했을 때
export function buildJoinEmbed(args: {
  raidTitle: string;
  participantName: string;
  role: "dealer" | "support" | null;
  current: number;
  max: number;
  scheduledDate: string;
  scheduledTime: string;
}): DiscordEmbed {
  const raid = args.raidTitle?.trim() || "레이드";
  const name = args.participantName?.trim() || "길드원";
  const roleLabel =
    args.role === "support" ? " (서포터)" : args.role === "dealer" ? " (딜러)" : "";

  const cur = Number(args.current) || 0;
  const max = Number(args.max) || 0;
  const full = max > 0 && cur >= max;

  const embed: DiscordEmbed = {
    author: { name: "🙋 레이드 참여" },
    title: raid,
    description: "**" + name + "**님이 참여했어요" + roleLabel,
    color: full ? 0xf59e0b : 0x10b981,
    fields: [
      {
        name: "현재 인원",
        value: cur + "/" + max + "명" + (full ? " · 마감!" : ""),
        inline: true,
      },
      {
        name: "일시",
        value: formatKDateTime(args.scheduledDate, args.scheduledTime),
        inline: true,
      },
    ],
    footer: { text: "길드패스" },
  };

  return embed;
}

// ⚔️ 레이드 (텍스트): 임베드를 못 쓰는 곳을 위한 폴백
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

// 📋 레이드 브리핑: 그날 예정된 레이드 목록 (cron 발송용)
export function buildRaidDigestMessage(args: {
  guildName: string;
  raids: {
    time: string;
    raidTitle: string;
    difficulty: string;
    skillLevel: string;
    maxMembers: number;
  }[];
}): string {
  const count = args.raids.length;
  let msg = `📋 **오늘 ${args.guildName} 레이드 브리핑** — 총 ${count}개 일정\n`;
  for (const r of args.raids) {
    const parts = [r.raidTitle, r.difficulty, r.skillLevel].filter(Boolean);
    msg += `\n🗓️ ${r.time} · ${parts.join(" · ")} (정원 ${r.maxMembers}명)`;
  }
  return msg;
}
