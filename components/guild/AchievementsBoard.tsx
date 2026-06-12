"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Users, CalendarCheck, Trophy, Lock, Gift, Check, Loader2 } from "lucide-react";
import {
  type Achievement,
  type AchievementKind,
  isAchieved,
  progressOf,
  progressText,
} from "@/lib/achievements";
import { claimAchievement } from "@/app/guild/[code]/achievements/actions";

type Current = { memberCount: number; attendanceCount: number; totalExp: number };

const TABS: { kind: AchievementKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: "member", label: "인원수", icon: Users },
  { kind: "attendance", label: "누적 출석", icon: CalendarCheck },
  { kind: "grade", label: "길드 등급", icon: Trophy },
];

export default function AchievementsBoard({
  guildId,
  guildCode,
  achievements,
  current,
  claimedKeys,
  canClaim,
}: {
  guildId: string;
  guildCode: string;
  achievements: Achievement[];
  current: Current;
  claimedKeys: string[];
  canClaim: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AchievementKind>("member");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [localClaimed, setLocalClaimed] = useState<string[]>(claimedKeys);

  const list = achievements.filter((a) => a.kind === tab);

  async function handleClaim(a: Achievement) {
    setClaiming(a.key);
    const res = await claimAchievement(guildId, guildCode, a.key);
    setClaiming(null);
    if (res.success) {
      toast.success(`보상 수령 완료! 길드 +${res.guildReward}P · 길드원 전원 +${res.personalReward}P`);
      setLocalClaimed((prev) => [...prev, a.key]);
      router.refresh();
    } else {
      toast.error(res.error ?? "수령에 실패했어요");
    }
  }

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1.5 mb-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = tab === t.kind;
          return (
            <button
              key={t.kind}
              onClick={() => setTab(t.kind)}
              className={
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors " +
                (on ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700")
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((a) => {
          const achieved = isAchieved(a, current);
          const claimed = localClaimed.includes(a.key);
          const prog = progressOf(a, current);
          const isClaimingThis = claiming === a.key;

          // 상태: claimed > claimable > locked
          let state: "claimed" | "claimable" | "locked" = "locked";
          if (claimed) state = "claimed";
          else if (achieved) state = "claimable";

          return (
            <div
              key={a.key}
              className={
                "bg-white rounded-2xl p-4 border transition relative " +
                (state === "claimable"
                  ? "border-amber-300 ring-1 ring-amber-300 shadow-[0_4px_14px_rgba(245,158,11,0.12)]"
                  : state === "claimed"
                  ? "border-slate-200"
                  : "border-slate-200 opacity-75")
              }
            >
              {state === "claimed" && (
                <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">수령 완료</span>
              )}
              {state === "claimable" && (
                <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">수령 가능</span>
              )}

              {/* 아이콘 */}
              <div
                className={
                  "w-11 h-11 rounded-xl flex items-center justify-center mb-3 " +
                  (state === "claimable" ? "bg-amber-100" : state === "claimed" ? "bg-emerald-100" : "bg-slate-100")
                }
              >
                {state === "claimed" ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : state === "claimable" ? (
                  <Gift className="w-5 h-5 text-amber-600" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <p className="text-[15px] font-bold text-slate-900">{a.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">{a.desc}</p>

              {/* 보상 칩 */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">길드 +{a.guildReward}P</span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">개인 +{a.personalReward}P</span>
              </div>

              {/* 진행도 바 */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(prog * 100)}%`,
                    background: state === "claimed" ? "#10b981" : state === "claimable" ? "#fbbf24" : "#cbd5e1",
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mb-3">{progressText(a, current)}</p>

              {/* 버튼 */}
              {state === "claimed" ? (
                <button disabled className="w-full h-9 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> 수령 완료
                </button>
              ) : state === "claimable" ? (
                canClaim ? (
                  <button
                    onClick={() => handleClaim(a)}
                    disabled={isClaimingThis}
                    className="w-full h-9 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 transition shadow-[0_3px_10px_rgba(245,158,11,0.35)] disabled:opacity-60"
                  >
                    {isClaimingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                    보상 수령
                  </button>
                ) : (
                  <button disabled className="w-full h-9 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center">
                    마스터만 수령 가능
                  </button>
                )
              ) : (
                <button disabled className="w-full h-9 rounded-lg bg-slate-100 text-slate-300 text-xs font-bold flex items-center justify-center">
                  미달성
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
