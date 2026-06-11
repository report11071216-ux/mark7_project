import {
  getCalendar,
  GUARDIAN_ORDER,
  isTodayKST,
  type CalendarContent,
  type RewardItem,
  type RewardSubItem,
} from "@/lib/lostark";
import { createClient } from "@/lib/supabase/server";
import { Map, Skull, Aperture, Swords, Gamepad2 } from "lucide-react";

const GRADE_BORDER: { [key: string]: string } = {
  일반: "ring-slate-400",
  고급: "ring-green-400",
  희귀: "ring-blue-400",
  영웅: "ring-violet-400",
  전설: "ring-orange-400",
  유물: "ring-red-400",
  고대: "ring-yellow-400",
};

type Weakness = { name: string; color: string };

// RewardItems(중첩 구조)에서 오늘 받을 수 있는 보상만 평탄화해서 추출
function flattenTodayRewards(rewardItems: RewardItem[] | null): RewardSubItem[] {
  if (!rewardItems || rewardItems.length === 0) return [];
  const out: RewardSubItem[] = [];
  const seen = new Set<string>();
  for (const group of rewardItems) {
    for (const item of group.Items ?? []) {
      const todayOk = !item.StartTimes || item.StartTimes.some((t) => isTodayKST(t));
      if (!todayOk) continue;
      if (seen.has(item.Name)) continue;
      seen.add(item.Name);
      out.push(item);
    }
  }
  return out;
}

// 카오스게이트 이름에서 지역 괄호 제거: "일렁이는 악마군단 (애니츠)" → "일렁이는 악마군단"
function stripRegion(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, "").trim();
}

function RewardIcons({ items }: { items: RewardSubItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.slice(0, 5).map((item, i) => (
        <div key={i} className="relative group">
          <img
            src={item.Icon}
            alt={item.Name}
            className={`w-[18px] h-[18px] rounded object-cover ring-1 ${GRADE_BORDER[item.Grade] ?? "ring-plaza-line"}`}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-black text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-20">
            {item.Name}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentRow({
  icon,
  name,
  rewards,
  sub,
  badge,
  badgeColor,
}: {
  icon: string | null;
  name: string;
  rewards?: RewardSubItem[];
  sub?: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2">
        {icon ? (
          <img src={icon} alt={name} className="w-[34px] h-[34px] rounded-lg object-cover ring-1 ring-plaza-line shrink-0" />
        ) : (
          <div className="w-[34px] h-[34px] rounded-lg bg-plaza-surface-2 ring-1 ring-plaza-line shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold text-plaza-ink leading-tight truncate">{name}</p>
          {rewards && rewards.length > 0 ? <RewardIcons items={rewards} /> : null}
        </div>
      </div>
      {badge ? (
        <span
          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 text-white"
          style={{ backgroundColor: badgeColor ?? "#7c3aed" }}
        >
          {badge}
        </span>
      ) : null}
      {sub ? <p className="text-[10px] text-plaza-ink-dim mt-1.5">{sub}</p> : null}
    </div>
  );
}

function Column({
  icon: Icon,
  iconColor,
  label,
  children,
  empty,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <div className="flex-1 min-w-0 border-r border-plaza-line last:border-r-0 px-3.5 py-3.5">
      <div className="flex items-center gap-1.5 mb-3">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-xs font-bold text-plaza-ink-soft">{label}</span>
      </div>
      {empty ? (
        <p className="text-[11px] text-plaza-ink-dim py-2">오늘 정보 없음</p>
      ) : (
        children
      )}
    </div>
  );
}

function todayWeekdayKST(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[now.getUTCDay()] + "요일";
}

export default async function GameContentWidgets() {
  const supabase = await createClient();

  const [calendar, guardianSettingResult, guardianImagesResult, guardianWeaknessesResult] =
    await Promise.all([
      getCalendar(),
      supabase.from("platform_settings").select("value").eq("key", "current_guardian_index").maybeSingle(),
      supabase.from("platform_settings").select("value").eq("key", "guardian_images").maybeSingle(),
      supabase.from("platform_settings").select("value").eq("key", "guardian_weaknesses").maybeSingle(),
    ]);

  const guardianIndex = Number(guardianSettingResult.data?.value ?? 0);
  const guardianImages = (guardianImagesResult.data?.value ?? {}) as { [key: string]: string };
  const guardianWeaknessesAll = (guardianWeaknessesResult.data?.value ?? {}) as { [key: string]: Weakness[] };
  const guardianImageUrl = guardianImages[String(guardianIndex)] ?? null;
  const currentWeaknesses: Weakness[] = Array.isArray(guardianWeaknessesAll[String(guardianIndex)])
    ? guardianWeaknessesAll[String(guardianIndex)]
    : [];
  const currentGuardian = GUARDIAN_ORDER[guardianIndex] ?? null;

  const todayOnly = (c: CalendarContent) => c.StartTimes?.some((t) => isTodayKST(t));

  const adventures = calendar.filter((c) => c.CategoryName?.includes("모험") && todayOnly(c));
  const fieldBosses = calendar.filter((c) => c.CategoryName?.includes("필드") && todayOnly(c));
  const chaosGatesRaw = calendar.filter((c) => c.CategoryName?.includes("카오스") && todayOnly(c));

  // 카오스게이트는 지역만 다른 같은 콘텐츠가 여러 개 옴 → 콘텐츠명(지역 제거) 기준 대표 1개만
  const chaosGates: CalendarContent[] = [];
  const seenChaos = new Set<string>();
  for (const c of chaosGatesRaw) {
    const baseName = stripRegion(c.ContentsName);
    if (seenChaos.has(baseName)) continue;
    seenChaos.add(baseName);
    chaosGates.push({ ...c, ContentsName: baseName });
  }

  return (
    <div className="bg-plaza-surface rounded-2xl border border-plaza-line overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-plaza-line">
        <Gamepad2 className="w-4 h-4 text-plaza-accent" />
        <span className="text-sm font-bold text-plaza-ink">오늘의 인게임</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-plaza-ink-dim">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {todayWeekdayKST()} · 실시간
        </span>
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* 모험섬 */}
        <Column icon={Map} iconColor="text-blue-400" label="모험 섬" empty={adventures.length === 0}>
          {adventures.slice(0, 4).map((c, i) => (
            <ContentRow key={i} icon={c.ContentsIcon ?? null} name={c.ContentsName} rewards={flattenTodayRewards(c.RewardItems)} />
          ))}
        </Column>

        {/* 필드보스 */}
        <Column icon={Skull} iconColor="text-rose-400" label="필드 보스" empty={fieldBosses.length === 0}>
          {fieldBosses.slice(0, 2).map((c, i) => (
            <ContentRow key={i} icon={c.ContentsIcon ?? null} name={c.ContentsName} rewards={flattenTodayRewards(c.RewardItems)} sub="정각마다 출현" />
          ))}
        </Column>

        {/* 카오스게이트 */}
        <Column icon={Aperture} iconColor="text-plaza-accent" label="카오스게이트" empty={chaosGates.length === 0}>
          {chaosGates.slice(0, 1).map((c, i) => (
            <ContentRow key={i} icon={c.ContentsIcon ?? null} name={c.ContentsName} rewards={flattenTodayRewards(c.RewardItems)} sub="여러 지역 · 매시간 50분" />
          ))}
        </Column>

        {/* 가디언 토벌 */}
        <Column icon={Swords} iconColor="text-plaza-ink-soft" label="가디언 토벌" empty={!currentGuardian}>
          <ContentRow
            icon={guardianImageUrl}
            name={currentGuardian ?? ""}
            sub="수요일 06:00 초기화"
            badge={currentWeaknesses.length > 0 ? currentWeaknesses.map((w) => w.name).join(" · ") + " 취약" : undefined}
            badgeColor={currentWeaknesses[0]?.color}
          />
        </Column>
      </div>
    </div>
  );
}
