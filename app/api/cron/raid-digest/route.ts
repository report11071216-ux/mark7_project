import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendGuildWebhook, buildRaidDigestMessage } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // CRON_SECRET 인증 (주간 랭킹 cron과 동일 패턴)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // 오늘 날짜 (KST 기준)
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // 오늘 예정된 레이드 일정 (시간순)
  const { data: schedules, error } = await supabase
    .from("raid_schedules")
    .select("guild_id, scheduled_time, difficulty, skill_level, max_members, raid_id")
    .eq("scheduled_date", todayStr)
    .order("scheduled_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = schedules ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "오늘 레이드 없음" });
  }

  // 레이드 이름 조회 (raid_id → title)
  const raidIds = Array.from(new Set(rows.map((r) => r.raid_id).filter(Boolean))) as string[];
  let raidTitleMap = new Map<string, string>();
  if (raidIds.length > 0) {
    const { data: raids } = await supabase
      .from("raids")
      .select("id, title")
      .in("id", raidIds);
    raidTitleMap = new Map((raids ?? []).map((r) => [r.id, r.title as string]));
  }

  // 길드 이름 조회
  const guildIds = Array.from(new Set(rows.map((r) => r.guild_id).filter(Boolean))) as string[];
  let guildNameMap = new Map<string, string>();
  if (guildIds.length > 0) {
    const { data: guilds } = await supabase
      .from("guilds")
      .select("id, name")
      .in("id", guildIds);
    guildNameMap = new Map((guilds ?? []).map((g) => [g.id, g.name as string]));
  }

  // 길드별로 그룹핑
  const byGuild = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!r.guild_id) continue;
    const list = byGuild.get(r.guild_id) ?? [];
    list.push(r);
    byGuild.set(r.guild_id, list);
  }

  // 길드별 발송
  let sent = 0;
  for (const [guildId, list] of byGuild) {
    const guildName = guildNameMap.get(guildId) ?? "우리 길드";
    const content = buildRaidDigestMessage({
      guildName,
      raids: list.map((r) => ({
        time: (r.scheduled_time ?? "").slice(0, 5), // "20:30:00" → "20:30"
        raidTitle: raidTitleMap.get(r.raid_id) ?? "레이드",
        difficulty: r.difficulty ?? "",
        skillLevel: r.skill_level ?? "",
        maxMembers: r.max_members ?? 0,
      })),
    });
    await sendGuildWebhook(guildId, "raid", content);
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
