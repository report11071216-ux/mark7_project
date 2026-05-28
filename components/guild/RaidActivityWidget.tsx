import { createClient } from "@/lib/supabase/server";
import RaidActivityCard from "./RaidActivityCard";
import type { WidgetColors } from "./WidgetRenderer";

type Props = {
  guildId: string;
  colors: WidgetColors;
};

function kstNow() {
  return new Date(Date.now() + 9 * 3600 * 1000);
}
function ymd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default async function RaidActivityWidget({ guildId, colors }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const myId = user?.id ?? "";

  const kst = kstNow();
  const dow = kst.getUTCDay(); // 0=일 ~ 6=토
  const diffToMon = (dow + 6) % 7;
  const monday = new Date(kst.getTime() - diffToMon * 24 * 3600 * 1000);
  const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);

  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const monthStart = new Date(Date.UTC(y, m, 1));
  const monthEnd = new Date(Date.UTC(y, m + 1, 0));

  const weekStartY = ymd(monday);
  const weekEndY = ymd(sunday);
  const monthStartY = ymd(monthStart);
  const monthEndY = ymd(monthEnd);

  const rangeStart = weekStartY < monthStartY ? weekStartY : monthStartY;
  const rangeEnd = weekEndY > monthEndY ? weekEndY : monthEndY;

  // 완료된 레이드만 카운트
  const [memberResult, scheduleResult] = await Promise.all([
    supabase
      .from("guild_members")
      .select("user_id", { count: "exact", head: true })
      .eq("guild_id", guildId),
    supabase
      .from("raid_schedules")
      .select("id, scheduled_date")
      .eq("guild_id", guildId)
      .eq("completed", true)
      .gte("scheduled_date", rangeStart)
      .lte("scheduled_date", rangeEnd),
  ]);

  const memberCount = memberResult.count ?? 0;
  const sched = (scheduleResult.data ?? []) as { id: string; scheduled_date: string }[];
  const allIds = sched.map((s) => s.id);

  let participants: { schedule_id: string; user_id: string }[] = [];
  if (allIds.length > 0) {
    const { data: parts } = await supabase
      .from("raid_participants")
      .select("schedule_id, user_id")
      .in("schedule_id", allIds);
    participants = parts ?? [];
  }

  function compute(startY: string, endY: string) {
    const ids = new Set(
      sched
        .filter((s) => s.scheduled_date >= startY && s.scheduled_date <= endY)
        .map((s) => s.id)
    );
    const parts = participants.filter((p) => ids.has(p.schedule_id));
    const distinct = new Set(parts.map((p) => p.user_id));
    const mine = parts.filter((p) => p.user_id === myId).length;
    return {
      scheduleCount: ids.size,
      memberCount: memberCount,
      participantCount: distinct.size,
      rate: memberCount > 0 ? Math.round((distinct.size / memberCount) * 100) : 0,
      myCount: mine,
    };
  }

  const week = compute(weekStartY, weekEndY);
  const month = compute(monthStartY, monthEndY);

  return <RaidActivityCard week={week} month={month} colors={colors} />;
}
