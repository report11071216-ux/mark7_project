"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  // ─ Storage 정리 ─
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
  // ─ DB 삭제 (모든 자식 테이블 CASCADE) ─
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
): Promise<{ error?: string; webhookUrl?: string | null }> {
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

function isValidDiscordWebhook(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("https://discord.com/api/webhooks/") ||
    trimmed.startsWith("https://discordapp.com/api/webhooks/")
  );
}

// 웹훅 URL 저장 (빈 문자열이면 연동 해제)
export async function saveWebhookUrl(
  guildId: string,
  webhookUrl: string
): Promise<{ error?: string; success?: boolean }> {
  const auth = await assertGuildManager(guildId);
  if (auth.error) return { error: auth.error };

  const trimmed = (webhookUrl ?? "").trim();
  if (trimmed && !isValidDiscordWebhook(trimmed)) {
    return {
      error:
        "올바른 디스코드 웹훅 주소가 아니에요. (https://discord.com/api/webhooks/ 로 시작해야 합니다)",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("guilds")
    .update({ discord_webhook_url: trimmed || null })
    .eq("id", guildId);

  if (error) {
    return { error: `저장 실패: ${error.message}` };
  }
  return { success: true };
}

// 테스트 메시지 발송
export async function sendTestWebhook(
  guildId: string
): Promise<{ error?: string; success?: boolean }> {
  const auth = await assertGuildManager(guildId);
  if (auth.error) return { error: auth.error };

  const supabase = await createClient();
  const { data: guild } = await supabase
    .from("guilds")
    .select("name, discord_webhook_url")
    .eq("id", guildId)
    .maybeSingle();

  const url = guild?.discord_webhook_url;
  if (!url) {
    return { error: "먼저 웹훅 주소를 저장해주세요." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "길드패스",
        content: `✅ **${
          guild?.name ?? "길드"
        }** 디스코드 연동이 완료됐어요! 앞으로 레이드 일정과 공지를 여기로 알려드릴게요.`,
      }),
    });
    if (!res.ok) {
      return {
        error: `디스코드 전송 실패 (코드 ${res.status}). 웹훅 주소를 다시 확인해주세요.`,
      };
    }
    return { success: true };
  } catch (e: any) {
    return { error: `전송 중 오류가 발생했어요: ${e?.message ?? "unknown"}` };
  }
}
