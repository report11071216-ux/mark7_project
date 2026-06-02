"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  isValidDiscordWebhook,
  resolveWebhookUrl,
  postToWebhook,
  type NotificationType,
} from "@/lib/discord";

function extractPathsByBucket(
  urls: (string | null | undefined)[],
  bucketName: string
): string[] {
  const marker = `/${bucketName}/`;
  const out: string[] = [];
  for (const u of urls) {
    if (!u) continue;
    const idx = u.indexOf(marker);
    if (idx === -1) continue;
    const path = u.substring(idx + marker.length).split("?")[0];
    if (path) out.push(path);
  }
  return out;
}

export async function deleteGuild(
  guildId: string,
  confirmCode: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }
  const { data: guild, error: guildErr } = await supabase
    .from("guilds")
    .select("id, code, master_id")
    .eq("id", guildId)
    .maybeSingle();
  if (guildErr || !guild) {
    return { error: "길드를 찾을 수 없습니다." };
  }
  if (guild.master_id !== user.id) {
    return { error: "길드 마스터만 삭제할 수 있어요." };
  }
  const normalizedInput = (confirmCode ?? "").trim().toUpperCase();
  const expected = (guild.code ?? "").toUpperCase();
  if (!normalizedInput || normalizedInput !== expected) {
    return { error: "입력한 길드 코드가 일치하지 않습니다." };
  }
  const { data: showcases } = await supabase
    .from("guild_showcases")
    .select("image_url")
    .eq("guild_id", guildId);
  const showcasePaths = extractPathsByBucket(
    (showcases ?? []).map((s: any) => s.image_url),
    "guild-showcases"
  );
  if (showcasePaths.length > 0) {
    await supabase.storage.from("guild-showcases").remove(showcasePaths);
  }
  const { data: raids } = await supabase
    .from("raids")
    .select("image_url")
    .eq("guild_id", guildId);
  const raidPaths = extractPathsByBucket(
    (raids ?? []).map((r: any) => r.image_url),
    "raid-images"
  );
  if (raidPaths.length > 0) {
    await supabase.storage.from("raid-images").remove(raidPaths);
  }
  const { error: deleteError } = await supabase
    .from("guilds")
    .delete()
    .eq("id", guildId);
  if (deleteError) {
    return { error: `길드 삭제 실패: ${deleteError.message}` };
  }
  redirect("/plaza");
}

// ─────────────────────────────────────────────
// 웹훅 권한 확인 (마스터/부마만)
// ─────────────────────────────────────────────
async function assertGuildManager(
  guildId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }
  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    return { error: "길드 마스터 또는 부마스터만 가능합니다." };
  }
  return {};
}

// 전체 알림 설정 저장 (5칸 + 토글 한꺼번에)
export type WebhookSettingsInput = {
  default_url: string;
  notice: { url: string; enabled: boolean };
  raid: { url: string; enabled: boolean };
  welcome: { url: string; enabled: boolean };
  join: { url: string; enabled: boolean };
};

export async function saveNotificationSettings(
  guildId: string,
  input: WebhookSettingsInput
): Promise<{ error?: string; success?: boolean }> {
  const auth = await assertGuildManager(guildId);
  if (auth.error) return { error: auth.error };

  // URL이 채워진 칸만 형식 검증 (빈 칸은 통과 = 기본으로 폴백)
  const urlsToCheck: { label: string; url: string }[] = [
    { label: "기본", url: input.default_url },
    { label: "공지", url: input.notice.url },
    { label: "레이드", url: input.raid.url },
    { label: "환영", url: input.welcome.url },
    { label: "가입 신청", url: input.join.url },
  ];
  for (const item of urlsToCheck) {
    const trimmed = (item.url ?? "").trim();
    if (trimmed && !isValidDiscordWebhook(trimmed)) {
      return {
        error: `${item.label} 채널 주소가 올바른 디스코드 웹훅이 아니에요. (https://discord.com/api/webhooks/ 로 시작해야 합니다)`,
      };
    }
  }

  const settings = {
    default_url: (input.default_url ?? "").trim(),
    notice: {
      url: (input.notice.url ?? "").trim(),
      enabled: input.notice.enabled,
    },
    raid: {
      url: (input.raid.url ?? "").trim(),
      enabled: input.raid.enabled,
    },
    welcome: {
      url: (input.welcome.url ?? "").trim(),
      enabled: input.welcome.enabled,
    },
    join: {
      url: (input.join.url ?? "").trim(),
      enabled: input.join.enabled,
    },
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guilds")
    .update({ notification_settings: settings })
    .eq("id", guildId);

  if (error) {
    return { error: `저장 실패: ${error.message}` };
  }
  return { success: true };
}

// 종류별 테스트 발송 (저장된 설정 기준)
export async function sendTestNotification(
  guildId: string,
  type: NotificationType
): Promise<{ error?: string; success?: boolean }> {
  const auth = await assertGuildManager(guildId);
  if (auth.error) return { error: auth.error };

  const supabase = await createClient();
  const { data: guild } = await supabase
    .from("guilds")
    .select("name, notification_settings")
    .eq("id", guildId)
    .maybeSingle();

  const { url, enabled } = resolveWebhookUrl(
    guild?.notification_settings as any,
    type
  );
  if (!enabled) {
    return { error: "이 알림이 꺼져 있어요. 먼저 켜고 저장해주세요." };
  }
  if (!url) {
    return {
      error: "보낼 웹훅 주소가 없어요. 이 칸이나 기본 칸 중 하나는 채워주세요.",
    };
  }

  const labelMap: { [key: string]: string } = {
    notice: "📢 공지",
    raid: "⚔️ 레이드",
    welcome: "👋 환영",
    join: "🙋 가입 신청",
  };
  const label = labelMap[type] ?? type;

  const result = await postToWebhook(
    url,
    `${label} 테스트 메시지예요. **${
      guild?.name ?? "길드"
    }** 알림이 이 채널로 잘 도착했어요!`
  );

  if (!result.ok) {
    return {
      error: result.status
        ? `디스코드 전송 실패 (코드 ${result.status}). 주소를 다시 확인해주세요.`
        : `전송 중 오류: ${result.error ?? "unknown"}`,
    };
  }
  return { success: true };
}
// ── 디스코드 서버 위젯 ID 저장 (스태프만) ──
export async function saveDiscordWidgetId(guildId: string, widgetId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guildId)
    .eq("user_id", user.id)
    .maybeSingle();
  const isStaff = membership?.role === "master" || membership?.role === "submaster";
  if (!isStaff) {
    return { error: "마스터·부마스터만 설정할 수 있습니다" };
  }

  // 숫자만 남기기 (사용자가 URL 통째로 붙여도 ID만 추출)
  const cleaned = (widgetId.match(/\d{17,20}/) ?? [""])[0];

  const { error } = await supabase
    .from("guilds")
    .update({ discord_widget_id: cleaned || null })
    .eq("id", guildId);

  if (error) {
    return { error: error.message };
  }

  return { success: true, savedId: cleaned };
}
