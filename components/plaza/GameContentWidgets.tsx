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
    <div className="plaza-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Map className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">오늘의 모험섬</h3>
        <span className="ml-auto text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Adventure Island
        </span>
      </div>
      <div className="p-4">
        <AdventureIslandList items={islandList} />
      </div>
    </div>
  );
}

// ─── 가디언토벌 (DB 로테이션 + 이미지) ───
function GuardianRaidWidget({
  guardianIndex,
  imageUrl,
}: {
  guardianIndex: number;
  imageUrl: string | null;
}) {
  const currentName = GUARDIAN_ORDER[guardianIndex] ?? null;

  return (
    <div className="plaza-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Swords className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">이번 주 가디언</h3>
        {currentName && (
          <span className="ml-auto text-[10px] font-mono text-slate-400">
            {guardianIndex + 1}/{GUARDIAN_ORDER.length}
          </span>
        )}
      </div>
      <div className="p-4">
        {!currentName ? (
          <p className="text-xs text-slate-400 text-center py-4">
            가디언 정보가 없어요
          </p>
        ) : (
          <div>
            {imageUrl && (
              <div className="mb-3 rounded-xl overflow-hidden aspect-video bg-slate-100">
                <img
                  src={imageUrl}
                  alt={currentName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="mb-3">
              <p className="text-sm font-bold text-slate-900">{currentName}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                매주 수요일 06:00 초기화
              </p>
            </div>
            <div className="flex gap-1 flex-wrap">
              {GUARDIAN_ORDER.map((name, i) => (
                <span
                  key={name}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition ${
                    i === guardianIndex
                      ? "bg-blue-600 text-white"
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
    <div className="plaza-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Skull className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">오늘의 필드보스</h3>
        <span className="ml-auto text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Field Boss
        </span>
      </div>
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
                        <p className="text-[10px] font-mono text-blue-600">
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

// ─── 메인 export ───
export default async function GameContentWidgets() {
  const supabase = await createClient();

  const [calendar, guardianSettingResult, guardianImagesResult] = await Promise.all([
    getCalendar(),
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "current_guardian_index")
      .maybeSingle(),
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "guardian_images")
      .maybeSingle(),
  ]);

  const guardianIndex = Number(guardianSettingResult.data?.value ?? 0);
  const guardianImages = (guardianImagesResult.data?.value ?? {}) as { [key: string]: string };
  const guardianImageUrl = guardianImages[String(guardianIndex)] ?? null;

  const adventures = calendar.filter((c) => c.CategoryName?.includes("모험"));
  const fieldBosses = calendar.filter((c) => c.CategoryName?.includes("필드"));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdventureIslandWidget items={adventures} />
      <GuardianRaidWidget guardianIndex={guardianIndex} imageUrl={guardianImageUrl} />
      <FieldBossWidget items={fieldBosses} />
    </div>
  );
}
