import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = {
  guildId: string;
  guildCode: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export default async function RaidMonthWidget({
  guildId,
  guildCode,
  textPrimary,
  textSecondary,
  accent,
  cardBg,
  cardBorder,
}: Props) {
  const supabase = await createClient();

  const now = kstNow();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const todayStr = `${year}-${pad2(month)}-${pad2(now.getUTCDate())}`;

  const firstDate = `${year}-${pad2(month)}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const lastDate = `${year}-${pad2(month)}-${pad2(lastDayNum)}`;

  const { data } = await supabase
    .from("raid_schedules")
    .select("scheduled_date")
    .eq("guild_id", guildId)
    .gte("scheduled_date", firstDate)
    .lte("scheduled_date", lastDate);

  const raidDays = new Set<string>();
  for (const r of data ?? []) {
    if (r.scheduled_date) raidDays.add(r.scheduled_date as string);
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const totalCells = Math.ceil((firstWeekday + lastDayNum) / 7) * 7;

  const cells: { day: number | null; dateStr: string | null }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstWeekday + 1;
    if (dayNum < 1 || dayNum > lastDayNum) {
      cells.push({ day: null, dateStr: null });
    } else {
      cells.push({ day: dayNum, dateStr: `${year}-${pad2(month)}-${pad2(dayNum)}` });
    }
  }

  const calendarHref = `/guild/${guildCode}/raids/calendar`;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <h2 className="text-sm font-bold" style={{ color: textPrimary }}>레이드 달력</h2>
        <Link href={calendarHref} className="text-[11px] hover:underline" style={{ color: accent }}>
          {year}.{month} 전체 보기 →
        </Link>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className="text-center text-[10px]"
              style={{ color: i === 0 ? "#f87171" : i === 6 ? "#22d3ee" : textSecondary }}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, idx) => {
            if (!c.day || !c.dateStr) {
              return <div key={idx} className="h-9" />;
            }
            const hasRaid = raidDays.has(c.dateStr);
            const isToday = c.dateStr === todayStr;
            let bg = "transparent";
            let color = textSecondary;
            let weight = 400;
            if (isToday) {
              bg = accent;
              color = "#ffffff";
              weight = 700;
            } else if (hasRaid) {
              bg = accent + "22";
              color = accent;
              weight = 700;
            } else {
              color = textPrimary;
            }
            return (
              <Link
                key={idx}
                href={calendarHref}
                className="h-9 flex items-center justify-center rounded transition-opacity hover:opacity-80"
                style={{ backgroundColor: bg }}
              >
                <span className="text-xs" style={{ color: color, fontWeight: weight }}>
                  {c.day}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-2.5 text-[10px]" style={{ color: textSecondary }}>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent + "22" }} />
            레이드 있는 날
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent }} />
            오늘
          </span>
        </div>
      </div>
    </div>
  );
}
