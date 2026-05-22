import {
  getCalendar,
  GUARDIAN_ORDER,
  formatKST,
  isTodayKST,
  type CalendarContent,
  type RewardItem,
} from "@/lib/lostark";
import { Swords, Map, Skull } from "lucide-react";

// 아이템 등급 테두리 색상
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
          {/* 툴팁 */}
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
    (item) =>
      item.StartTimes?.some((t) => isTodayKST(t))
  );

  return (
    <div className="plaza-card overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Map className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">오늘의 모험섬</h3>
        <span className="ml-auto text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Adventure Island
        </span>
      </div>
      <div className="p-4 flex-1">
        {todayItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            오늘 모험섬 정보가 없어요
          </p>
        ) : (
          <div className="space-y-4">
            {todayItems.map((item, i) => {
              const todayTimes = (item.StartTimes ?? []).filter(isTodayKST);
              return (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
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
                      <p className="text-[10px] font-mono text-blue-600">
                        {todayTimes.map(formatKST).join(" · ")}
                      </p>
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

// ─── 가디언토벌 ───
function GuardianRaidWidget({ items }: { items: CalendarContent[] }) {
  const current = items[0];

  const guardianIndex = current
    ? GUARDIAN_ORDER.findIndex((name) =>
        current.ContentsName.includes(name)
      )
    : -1;

  return (
    <div className="plaza-card overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Swords className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">이번 주 가디언</h3>
        {guardianIndex >= 0 && (
          <span className="ml-auto text-[10px] font-mono text-slate-400">
            {guardianIndex + 1}/{GUARDIAN_ORDER.length}
          </span>
        )}
      </div>
      <div className="p-4 flex-1">
        {!current ? (
          <p className="text-xs text-slate-400 text-center py-4">
            가디언 정보가 없어요
          </p>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              {current.ContentsIcon && (
                <img
                  src={current.ContentsIcon}
                  alt={current.ContentsName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-100"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {current.ContentsName}
                </p>
                {current.MinItemLevel > 0 && (
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    최소 {current.MinItemLevel.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {/* 순서 트랙 */}
            <div className="flex gap-1 mt-3 flex-wrap">
              {GUARDIAN_ORDER.map((name, i) => (
                <span
                  key={name}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition ${
                    i === guardianIndex
                      ? "bg-blue-600 text-white"
                      : i < (guardianIndex >= 0 ? guardianIndex : 0)
                      ? "bg-slate-100 text-slate-400 line-through"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
            <RewardItems items={current.RewardItems} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 필드보스 ───
function FieldBossWidget({ items }: { items: CalendarContent[] }) {
  const todayItems = items.filter(
    (item) =>
      item.StartTimes?.some((t) => isTodayKST(t))
  );

  return (
    <div className="plaza-card overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Skull className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">오늘의 필드보스</h3>
        <span className="ml-auto text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Field Boss
        </span>
      </div>
      <div className="p-4 flex-1">
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
                  <div className="flex items-center gap-2 mb-1">
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
  const calendar = await getCalendar();

  const adventures = calendar.filter((c) =>
    c.CategoryName.includes("모험 섬") || c.CategoryName.includes("모험섬")
  );
  const guardians = calendar.filter((c) =>
    c.CategoryName.includes("가디언 토벌") || c.CategoryName.includes("가디언토벌")
  );
  const fieldBosses = calendar.filter((c) =>
    c.CategoryName.includes("필드 보스") || c.CategoryName.includes("필드보스")
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdventureIslandWidget items={adventures} />
      <GuardianRaidWidget items={guardians} />
      <FieldBossWidget items={fieldBosses} />
    </div>
  );
}
