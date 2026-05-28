import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyRaidsButton from "./EmptyRaidsButton";

type Props = {
  guildId: string;
  guildCode: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
  surface: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function diffBadge(diff: string): { bg: string; color: string } {
  if (diff === "하드") return { bg: "rgba(245,158,11,0.16)", color: "#fbbf24" };
  if (diff === "나메") return { bg: "rgba(217,70,239,0.16)", color: "#e879f9" };
  return { bg: "rgba(161,161,170,0.16)", color: "#a1a1aa" };
}

export default async function UpcomingRaidsWidget({
  guildId,
  guildCode,
  textPrimary,
  textSecondary,
  accent,
  cardBg,
  cardBorder,
  surface,
}: Props) {
  const supabase = await createClient();

  const now = kstNow();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth();
  const d = now.getUTCDate();
  const dow = now.getUTCDay();

  const weekStart = new Date(Date.UTC(y, mo, d - dow));
  const todayStr = `${y}-${pad2(mo + 1)}-${pad2(d)}`;

  function dateStrOf(addDays: number): string {
    const dt = new Date(weekStart.getTime() + addDays * 24 * 60 * 60 * 1000);
    return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
  }

  const rangeStart = dateStrOf(0);
  const rangeEnd = dateStrOf(27);

  const [schedulesResult, raidsResult] = await Promise.all([
    supabase
      .from("raid_schedules")
      .select("id, difficulty, skill_level, max_members, scheduled_date, scheduled_time, raids(title, image_url)")
      .eq("guild_id", guildId)
      .gte("scheduled_date", rangeStart)
      .lte("scheduled_date", rangeEnd)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true }),
    supabase
      .from("raids")
      .select("id, title, image_url, gold_normal, gold_hard, gold_nightmare")
      .eq("guild_id", guildId)
      .order("title"),
  ]);

  const schedules = (schedulesResult.data ?? []) as any[];
  const raids = (raidsResult.data ?? []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) || "제목 없음",
    image_url: (r.image_url as string) || "",
    gold_normal: r.gold_normal == null ? null : Number(r.gold_normal),
    gold_hard: r.gold_hard == null ? null : Number(r.gold_hard),
    gold_nightmare: r.gold_nightmare == null ? null : Number(r.gold_nightmare),
  }));

  const ids = schedules.map((s) => s.id);
  const countMap: { [key: string]: number } = {};
  if (ids.length > 0) {
    const { data: parts } = await supabase
      .from("raid_participants")
      .select("schedule_id")
      .in("schedule_id", ids);
    for (const p of parts ?? []) {
      const k = String(p.schedule_id);
      countMap[k] = (countMap[k] || 0) + 1;
    }
  }

  const items = schedules.map((s) => {
    const raid = Array.isArray(s.raids) ? s.raids[0] : s.raids;
    return {
      id: s.id as string,
      title: raid ? (raid.title as string) || "레이드" : "레이드",
      image: raid ? (raid.image_url as string) || "" : "",
      difficulty: (s.difficulty as string) || "노말",
      date: s.scheduled_date as string,
      time: ((s.scheduled_time as string) || "").slice(0, 5),
      maxMembers: Number(s.max_members) || 8,
      count: countMap[String(s.id)] || 0,
    };
  });

  const weekCells = [];
  for (let i = 0; i < 7; i++) {
    const ds = dateStrOf(i);
    const dt = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
    weekCells.push({
      dateStr: ds,
      dayNum: dt.getUTCDate(),
      weekday: i,
      count: items.filter((it) => it.date === ds).length,
      isToday: ds === todayStr,
    });
  }

  const upcoming = items.filter((it) => it.date >= todayStr).slice(0, 5);
  const calendarHref = `/guild/${guildCode}/raids/calendar`;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <h2 className="text-sm font-bold" style={{ color: textPrimary }}>레이드 일정</h2>
        <Link href={calendarHref} className="text-[11px] hover:underline" style={{ color: accent }}>
          전체 보기 →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pt-3">
        {weekCells.map((c) => (
          <Link
            key={c.dateStr}
            href={calendarHref}
            className="flex flex-col items-center rounded-md py-1.5 transition-opacity hover:opacity-80"
            style={{ backgroundColor: c.isToday ? accent : c.count > 0 ? surface : "transparent" }}
          >
            <span
              className="text-[9px]"
              style={{
                color: c.isToday
                  ? "#ffffff"
                  : c.weekday === 0
                  ? "#f87171"
                  : c.weekday === 6
                  ? "#22d3ee"
                  : textSecondary,
              }}
            >
              {WEEKDAYS[c.weekday]}
            </span>
            <span className="text-xs font-bold" style={{ color: c.isToday ? "#ffffff" : textPrimary }}>
              {c.dayNum}
            </span>
            <span className="mt-0.5 h-1.5 flex items-center">
              {c.count > 0 ? (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: c.isToday ? "#ffffff" : accent }}
                />
              ) : null}
            </span>
          </Link>
        ))}
      </div>

      <div className="p-3 space-y-1.5">
        {upcoming.length === 0 ? (
          <EmptyRaidsButton
            guildCode={guildCode}
            todayStr={todayStr}
            raids={raids}
            textSecondary={textSecondary}
            accent={accent}
            surface={surface}
          />
        ) : (
          upcoming.map((it) => {
            const badge = diffBadge(it.difficulty);
            const dp = it.date.split("-");
            const dateLabel = `${Number(dp[1])}/${Number(dp[2])}`;
            return (
              <Link
                key={it.id}
                href={calendarHref}
                className="flex items-center gap-2.5 rounded-md p-1.5 transition-opacity hover:opacity-80"
                style={{ backgroundColor: surface }}
              >
                {it.image ? (
                  <img src={it.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {it.title.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate" style={{ color: textPrimary }}>
                    {it.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono" style={{ color: accent }}>
                      {dateLabel} {it.time}
                    </span>
                    <span
                      className="px-1 rounded text-[9px]"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {it.difficulty}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: textSecondary }}>
                  {it.count}/{it.maxMembers}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
