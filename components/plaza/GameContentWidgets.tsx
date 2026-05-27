import {
  getCalendar,
  GUARDIAN_ORDER,
  formatKST,
  isTodayKST,
  type CalendarContent,
  type RewardItem,
} from "@/lib/lostark";
import { createClient } from "@/lib/supabase/server";
import { Swords, Map, Skull } from "lucide-react";
import AdventureIslandList from "./AdventureIslandList";

const GRADE_BORDER: { [key: string]: string } = {
  일반: "ring-slate-300",
  고급: "ring-green-400",
  희귀: "ring-blue-400",
  영웅: "ring-violet-500",
  전설: "ring-orange-400",
  유물: "ring-red-500",
  고대: "ring-yellow-400",
};

const GRADE_LABEL: { [key: string]: string } = {
  일반: "text-slate-500",
  고급: "text-green-600",
  희귀: "text-blue-600",
  영웅: "text-violet-600",
  전설: "text-orange-500",
  유물: "text-red-500",
  고대: "text-yellow-500",
};

type Weakness = { name: string; color: string };

function RewardItems({ items }: { items: RewardItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {items.slice(0, 6).map((item, i) => (
        <div key={i} className="relative group">
          <img
            src={item.Icon}
            alt={item.Name}
            className={`w-8 h-8 rounded-md object-cover ring-2 ${
              GRADE_BORDER[item.Grade] ?? "ring-slate-200"
            }`}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-slate-900 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
            <span className={GRADE_LABEL[item.Grade] ?? "text-slate-400"}>
              {item.Name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-slate-800">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-white" />
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      {right && <div className="text-xs font-medium text-slate-300">{right}</div>}
    </div>
  );
}

// ─── 모험섬 ───
function AdventureIslandWidget({ items }: { items: CalendarContent[] }) {
  const todayItems = items.filter(
    (item) => item.StartTimes?.some((t) => isTodayKST(t))
  );
  const islandList = todayItems.map((item) => ({
    name: item.ContentsName,
    icon: item.ContentsIcon ?? null,
    times: (item.StartTimes ?? []).filter(isTodayKST).map(formatKST),
  }));

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
      <CardHeader icon={Map} title="오늘의 모험섬" />
      <div className="p-4">
        <AdventureIslandList items={islandList} />
      </div>
    </div>
  );
}

// ─── 가디언토벌 ───
function GuardianRaidWidget({
  guardianIndex,
  imageUrl,
  weaknesses,
}: {
  guardianIndex: number;
  imageUrl: string | null;
  weaknesses: Weakness[];
}) {
  const currentName = GUARDIAN_ORDER[guardianIndex] ?? null;

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
      <CardHeader
        icon={Swords}
        title="이번 주 가디언"
        right={currentName ? `${guardianIndex + 1}/${GUARDIAN_ORDER.length}` : undefined}
      />
      <div className="p-4">
        {!currentName ? (
          <p className="text-xs text-slate-400 text-center py-4">
            가디언 정보가 없어요
          </p>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-3">
              {imageUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 ring-1 ring-slate-200">
                  <img src={imageUrl} alt={currentName} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{currentName}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  매주 수요일 06:00 초기화
                </p>
              </div>
            </div>

            {weaknesses.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  취약속성
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {weaknesses.map((w, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: w.color }}
                    >
                      {w.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-1 flex-wrap">
              {GUARDIAN_ORDER.map((name, i) => (
                <span
                  key={name}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition ${
                    i === guardianIndex
                      ? "bg-slate-800 text-white"
                      : i < guardianIndex
                      ? "bg-slate-100 text-slate-400 line-through"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 필드보스 ───
function FieldBossWidget({ items }: { items: CalendarContent[] }) {
  const todayItems = items.filter(
    (item) => item.StartTimes?.some((t) => isTodayKST(t))
  );

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
      <CardHeader icon={Skull} title="오늘의 필드보스" />
      <div className="p-4">
        {todayItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            오늘 필드보스 정보가 없어요
          </p>
        ) : (
          <div className="space-y-4">
            {todayItems.map((item, i) => {
              const todayTimes = (item.StartTimes ?? []).filter(isTodayKST);
              return (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    {item.ContentsIcon && (
                      <img
                        src={item.ContentsIcon}
                        alt={item.ContentsName}
                        className="w-8 h-8 rounded-md object-cover ring-1 ring-slate-200"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.ContentsName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[10px] font-mono text-slate-600">
                          {todayTimes.map(formatKST).join(" · ")}
                        </p>
                        {item.Location && (
                          <p className="text-[10px] text-slate-400 truncate">
                            · {item.Location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <RewardItems items={item.RewardItems} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
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

  const adventures = calendar.filter((c) => c.CategoryName?.includes("모험"));
  const fieldBosses = calendar.filter((c) => c.CategoryName?.includes("필드"));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdventureIslandWidget items={adventures} />
      <GuardianRaidWidget guardianIndex={guardianIndex} imageUrl={guardianImageUrl} weaknesses={currentWeaknesses} />
      <FieldBossWidget items={fieldBosses} />
    </div>
  );
}
