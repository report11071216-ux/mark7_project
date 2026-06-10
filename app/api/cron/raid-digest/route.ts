import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendGuildWebhook, buildRaidDigestMessage } from "@/lib/discord";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  // CRON_SECRET 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createClient();
  // 오늘 날짜 (KST 기준) — UTC+9로 직접 계산
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // RLS 우회 RPC로 오늘 레이드 조회 (길드명·레이드명 포함)
  const { data: rowsRaw, error } = await supabase.rpc("get_today_raid_digest", {
    p_today: todayStr,
  });
  if (error) {
    return NextResponse.json({ error: error.message, todayStr }, { status: 500 });
  }

  const rows = (rowsRaw ?? []) as {
    guild_id: string;
    guild_name: string;
    scheduled_time: string;
    difficulty: string;
    skill_level: string;
    max_members: number;
    raid_title: string;
  }[];

  console.log("[raid-digest] todayStr=", todayStr, "rows=", rows.length);

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "오늘 레이드 없음", todayStr });
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
  for (const [guildId, list] of Array.from(byGuild.entries())) {
    const guildName = list[0]?.guild_name ?? "우리 길드";
    const content = buildRaidDigestMessage({
      guildName,
      raids: list.map((r) => ({
        time: (r.scheduled_time ?? "").slice(0, 5),
        raidTitle: r.raid_title ?? "레이드",
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
