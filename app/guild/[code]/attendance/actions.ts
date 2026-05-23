import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // 정산 대상 날짜 = 어제 (KST 기준)
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(kstNow.getUTCHours() - 6); // 06시 리셋 보정
  kstNow.setUTCDate(kstNow.getUTCDate() - 1);
  const targetDate = kstNow.toISOString().split("T")[0];

  // 중복 정산 방지
  const { data: lastPayout } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "last_guild_point_payout")
    .maybeSingle();

  if (lastPayout?.value === targetDate) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already paid", date: targetDate });
  }

  // 해당 날짜 출석 기록 전부 조회
  const { data: attendances, error: attError } = await supabase
    .from("attendances")
    .select("guild_id")
    .eq("attendance_date", targetDate);

  if (attError) {
    return NextResponse.json({ error: attError.message }, { status: 500 });
  }

  // 길드별 출석자 수 집계
  const countMap: { [key: string]: number } = {};
  for (const a of attendances ?? []) {
    if (!a.guild_id) continue;
    countMap[a.guild_id] = (countMap[a.guild_id] ?? 0) + 1;
  }

  const guildIds = Object.keys(countMap);
  let updatedCount = 0;

  for (const gid of guildIds) {
    const { data: guild } = await supabase
      .from("guilds")
      .select("total_points")
      .eq("id", gid)
      .maybeSingle();

    if (!guild) continue;

    const { error: updateError } = await supabase
      .from("guilds")
      .update({ total_points: (guild.total_points ?? 0) + countMap[gid] })
      .eq("id", gid);

    if (!updateError) updatedCount++;
  }

  // 정산일 기록
  await supabase
    .from("platform_settings")
    .update({ value: targetDate })
    .eq("key", "last_guild_point_payout");

  return NextResponse.json({
    ok: true,
    date: targetDate,
    guildsUpdated: updatedCount,
    breakdown: countMap,
  });
}
