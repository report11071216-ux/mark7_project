import { createClient } from "@/lib/supabase/server";
import { getClassRole, getClassSynergy } from "@/lib/lostark-classes";
import RaidMonthWidgetClient from "./RaidMonthWidgetClient";
import type { RaidSchedule, Participant } from "./ScheduleDetailModal";

type Props = {
  guildId: string;
  guildCode: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
};

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = kstNow();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const todayStr = `${year}-${pad2(month)}-${pad2(now.getUTCDate())}`;
  const firstDate = `${year}-${pad2(month)}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const lastDate = `${year}-${pad2(month)}-${pad2(lastDayNum)}`;

  const [membershipResult, raidsResult, schedulesResult] = await Promise.all([
    supabase
      .from("guild_members")
      .select("role")
      .eq("guild_id", guildId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("raids")
      .select("id, title, image_url, gold_normal, gold_hard, gold_nightmare")
      .eq("guild_id", guildId)
      .order("title"),
    supabase
      .from("raid_schedules")
      .select("id, raid_id, difficulty, skill_level, max_members, scheduled_date, scheduled_time, created_by, raids(title, image_url)")
      .eq("guild_id", guildId)
      .gte("scheduled_date", firstDate)
      .lte("scheduled_date", lastDate)
      .order("scheduled_time"),
  ]);

  const currentUserRole = membershipResult.data?.role || "member";

  const raids = (raidsResult.data || []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) || "제목 없음",
    image_url: (r.image_url as string) || "",
    gold_normal: r.gold_normal == null ? null : Number(r.gold_normal),
    gold_hard: r.gold_hard == null ? null : Number(r.gold_hard),
    gold_nightmare: r.gold_nightmare == null ? null : Number(r.gold_nightmare),
  }));

  const scheduleList = (schedulesResult.data || []) as any[];
  const scheduleIds = scheduleList.map((s) => s.id);

  let participantRows: any[] = [];
  if (scheduleIds.length > 0) {
    const { data } = await supabase
      .from("raid_participants")
      .select("schedule_id, user_id")
      .in("schedule_id", scheduleIds);
    participantRows = data || [];
  }

  const idSet = new Set<string>();
  for (const p of participantRows) idSet.add(p.user_id);
  for (const s of scheduleList) {
    if (s.created_by) idSet.add(s.created_by);
  }
  const allUserIds = Array.from(idSet);

  let profileRows: any[] = [];
  if (allUserIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, main_character_name, character_class, item_level, equipped_mark_id, equipped_card_id")
      .in("id", allUserIds);
    profileRows = data || [];
  }

  const profileMap: { [key: string]: any } = {};
  for (const pr of profileRows) profileMap[pr.id] = pr;

  // 코스메틱 — 장착 마크 + 카드 배경
  const purchaseIds = Array.from(
    new Set(
      profileRows
        .flatMap((p) => [p.equipped_mark_id, p.equipped_card_id])
        .filter(Boolean)
    )
  ) as string[];
  const markImageByPurchase: { [key: string]: string | null } = {};
  const cardFrameByPurchase: { [key: string]: string | null } = {};
  if (purchaseIds.length > 0) {
    const { data: purchases } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", purchaseIds);
    const itemIds = Array.from(
      new Set((purchases || []).map((p) => p.item_id).filter(Boolean))
    ) as string[];
    const itemMap: { [key: string]: { image_url: string | null; frame_url: string | null } } = {};
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from("shop_items")
        .select("id, image_url, frame_url")
        .in("id", itemIds);
      for (const it of items || []) {
        itemMap[it.id] = { image_url: it.image_url, frame_url: it.frame_url };
      }
    }
    for (const pu of purchases || []) {
      if (!pu.item_id) continue;
      const it = itemMap[pu.item_id];
      if (!it) continue;
      markImageByPurchase[pu.id] = it.image_url;
      cardFrameByPurchase[pu.id] = it.frame_url;
    }
  }

  function nameOf(uid: string): string {
    const pr = profileMap[uid];
    if (!pr) return "길드원";
    return pr.main_character_name || pr.username || "길드원";
  }
  function avatarOf(uid: string): string {
    const pr = profileMap[uid];
    if (!pr) return "";
    if (pr.equipped_mark_id && markImageByPurchase[pr.equipped_mark_id]) {
      return markImageByPurchase[pr.equipped_mark_id] as string;
    }
    return pr.avatar_url || "";
  }
  function cardBgOf(uid: string): string {
    const pr = profileMap[uid];
    if (!pr) return "";
    if (pr.equipped_card_id && cardFrameByPurchase[pr.equipped_card_id]) {
      return cardFrameByPurchase[pr.equipped_card_id] as string;
    }
    return "";
  }
  function classOf(uid: string): string {
    const pr = profileMap[uid];
    return pr && pr.character_class ? String(pr.character_class) : "";
  }
  function ilvlOf(uid: string): number | null {
    const pr = profileMap[uid];
    if (!pr || pr.item_level == null) return null;
    const n = Number(pr.item_level);
    return Number.isFinite(n) ? n : null;
  }

  const participantsBySchedule: { [key: string]: Participant[] } = {};
  for (const p of participantRows) {
    const key = String(p.schedule_id);
    if (!participantsBySchedule[key]) participantsBySchedule[key] = [];
    const cls = classOf(p.user_id);
    participantsBySchedule[key].push({
      userId: p.user_id,
      name: nameOf(p.user_id),
      avatar: avatarOf(p.user_id),
      cardBgUrl: cardBgOf(p.user_id),
      characterClass: cls,
      itemLevel: ilvlOf(p.user_id),
      role: cls ? getClassRole(cls) : null,
      synergy: cls ? getClassSynergy(cls) : "",
    });
  }

  const schedules: RaidSchedule[] = scheduleList.map((s) => {
    const raidInfo = Array.isArray(s.raids) ? s.raids[0] : s.raids;
    const list = participantsBySchedule[String(s.id)] || [];
    return {
      id: s.id as string,
      raidId: s.raid_id as string,
      raidTitle: raidInfo ? (raidInfo.title as string) : "알 수 없는 레이드",
      raidImage: raidInfo ? ((raidInfo.image_url as string) || "") : "",
      difficulty: (s.difficulty as string) || "노말",
      skillLevel: (s.skill_level as string) || "",
      maxMembers: Number(s.max_members) || 8,
      scheduledDate: s.scheduled_date as string,
      scheduledTime: ((s.scheduled_time as string) || "").slice(0, 5),
      createdBy: (s.created_by as string) || "",
      createdByName: s.created_by ? nameOf(s.created_by) : "길드원",
      participants: list,
      participantCount: list.length,
    };
  });

  const schedulesByDate: { [key: string]: RaidSchedule[] } = {};
  for (const s of schedules) {
    if (!schedulesByDate[s.scheduledDate]) schedulesByDate[s.scheduledDate] = [];
    schedulesByDate[s.scheduledDate].push(s);
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
    <RaidMonthWidgetClient
      year={year}
      month={month}
      todayStr={todayStr}
      calendarHref={calendarHref}
      guildCode={guildCode}
      cells={cells}
      schedulesByDate={schedulesByDate}
      raids={raids}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
      textPrimary={textPrimary}
      textSecondary={textSecondary}
      accent={accent}
      cardBg={cardBg}
      cardBorder={cardBorder}
    />
  );
}
