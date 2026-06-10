import {
  getCalendar,
  GUARDIAN_ORDER,
  isTodayKST,
  type CalendarContent,
  type RewardItem,
} from "@/lib/lostark";
import { createClient } from "@/lib/supabase/server";
import { Map, Skull, Aperture, Swords, Gamepad2 } from "lucide-react";

const GRADE_BORDER: { [key: string]: string } = {
  일반: "ring-slate-300",
  고급: "ring-green-400",
  희귀: "ring-blue-400",
  영웅: "ring-violet-500",
  전설: "ring-orange-400",
  유물: "ring-red-500",
  고대: "ring-yellow-400",
};

type Weakness = { name: string; color: string };

function RewardIcons({ items }: { items: RewardItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1">
      {items.slice(0, 4).map((item, i) => (
        <div key={i} className="relative group">
          <img
            src={item.Icon}
            alt={item.Name}
            className={`w-[18px] h-[18px] rounded object-cover ring-1 ${GRADE_BORDER[item.Grade] ?? "ring-slate-200"}`}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-20">
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
  rewards?: RewardItem[];
  sub?: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2">
        {icon ? (
          <img src={icon} alt={name} className="w-[34px] h-[34px] rounded-lg object-cover ring-1 ring-slate-200 shrink-0" />
        ) : (
          <div className="w-[34px] h-[34px] rounded-lg bg-slate-100 ring-1 ring-slate-200 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 leading-tight truncate">{name}</p>
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
      {sub ? <p className="text-[10px] text-slate-400 mt-1.5">{sub}</p> : null}
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
    <div className="flex-1 min-w-0 border-r border-slate-100 last:border-r-0 px-3.5 py-3.5">
      <div className="flex items-center gap-1.5 mb-3">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-xs font-bold text-slate-500">{label}</span>
      </div>
      {empty ? (
        <p className="text-[11px] text-slate-300 py-2">오늘 정보 없음</p>
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
  const chaosGates = calendar.filter((c) => c.CategoryName?.includes("카오스") && todayOnly(c));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Gamepad2 className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-bold text-slate-900">오늘의 인게임</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {todayWeekdayKST()} · 실시간
        </span>
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* 모험섬 */}
        <Column icon={Map} iconColor="text-blue-500" label="모험 섬" empty={adventures.length === 0}>
          {adventures.slice(0, 4).map((c, i) => (
            <ContentRow key={i} icon={c.ContentsIcon ?? null} name={c.ContentsName} rewards={c.RewardItems} />
          ))}
        </Column>

        {/* 필드보스 */}
        <Column icon={Skull} iconColor="text-rose-500" label="필드 보스" empty={fieldBosses.length === 0}>
          {fieldBosses.slice(0, 2).map((c, i) => (
            <ContentRow key={i} icon={c.ContentsIcon ?? null} name={c.ContentsName} rewards={c.RewardItems} sub="정각마다 출현" />
          ))}
        </Column>

        {/* 카오스게이트 */}
        <Column icon={Aperture} iconColor="text-violet-500" label="카오스게이트" empty={chaosGates.length === 0}>
          {chaosGates.slice(0, 2).map((c, i) => (
            <ContentRow key={i} icon={c.ContentsIcon ?? null} name={c.ContentsName} sub="매시간 50분 진행" />
          ))}
        </Column>

        {/* 가디언 토벌 */}
        <Column icon={Swords} iconColor="text-slate-500" label="가디언 토벌" empty={!currentGuardian}>
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
}```

---

핵심:

- **4개 분리 카드 → 하나의 패널** 안 4열 타임라인. 콘텐츠끼리 묶여서 깔끔해요.
- **모험섬 시간 제거** — 이름 + 보상 아이콘만. "오늘 무슨 섬"만 보여요.
- **보상 아이콘** — 기존 `RewardItems` 데이터 그대로, 이름 밑에 작게(18px). 등급별 테두리 색 유지, 호버하면 이름 툴팁.
- **상단 "○요일 · 실시간"** — KST 기준 오늘 요일 자동 표시 + 초록 점.
- **가디언** — 취약속성을 배지로(그 속성 색 그대로).
- 모바일에선 세로로 쌓여요(`flex-col sm:flex-row`).

`AdventureIslandList.tsx`는 이제 안 쓰지만 import 안 하니 그냥 둬도 무해해요(나중에 정리 가능).

빌드 통과되면 광장 인게임 정보가 하나의 패널로 깔끔해지는지, 보상 아이콘이 잘 뜨는지 확인해주세요. 실제 로아 아이콘 이미지가 들어올 거예요. 에러 나면 메시지·줄번호 주세요.
