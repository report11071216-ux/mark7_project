"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Box, TrendingUp, ArrowUp, Plus, Eye, Loader2, Shield, Gem, Crown } from "lucide-react";
import { GUILD_GRADES, GUILD_COSTS, EXP_PER_UNIT, getGradeProgress } from "@/lib/guild-grade";
import { buyGuildCapacity, buyGuildExp } from "@/app/guild/[code]/admin/growth-actions";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  totalPoints: number;
  totalExp: number;
  maxMembers: number;
  vaultSlots: number;
  rank?: number | null;   // 전체 랭킹 순위 (옵션)
  isStaff: boolean;
};

function gradeIcon(key: string, size: number, color: string) {
  if (key === "master" || key === "grandmaster") return <Crown style={{ width: size, height: size, color }} />;
  if (["platinum", "emerald", "diamond"].includes(key)) return <Gem style={{ width: size, height: size, color }} />;
  return <Shield style={{ width: size, height: size, color }} />;
}

export default function GuildGrowthPanel({
  guildCode, totalPoints, totalExp, maxMembers, vaultSlots, rank, isStaff,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const prog = getGradeProgress(totalExp);
  const current = prog.current;
  const currentIndex = GUILD_GRADES.findIndex((g) => g.key === current.key);

  const run = (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    if (!isStaff) return;
    setBusy(key);
    startTransition(async () => {
      const res = await fn();
      setBusy(null);
      if (res.success) {
        toast.success("강화 완료!");
        router.refresh();
      } else {
        toast.error(res.error ?? "실패했어요");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 등급 헤더 (다크) */}
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ backgroundColor: "#1a1530" }}>
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full" style={{ backgroundColor: "rgba(124,58,237,0.18)" }} />
        <div className="relative flex items-center gap-4">
          <div className="w-[76px] h-[76px] rounded-[20px] flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(124,58,237,0.25)", border: "2px solid #a78bfa" }}>
            {gradeIcon(current.key, 40, "#c4b5fd")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold text-white">{current.label}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#a78bfa", color: "#1a1530" }}>
                {currentIndex + 1}등급
              </span>
            </div>
            <p className="text-[13px] mt-1" style={{ color: "#b8aee0" }}>
              {rank ? <>전체 길드 중 <span className="font-bold" style={{ color: "#67e8f9" }}>{rank}위</span></> : <>누적 경험치 {totalExp.toLocaleString()} XP</>}
            </p>
            {/* 진행바 */}
            <div className="mt-2.5">
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: "#b8aee0" }}>
                  {prog.next ? `${prog.next.label}까지` : "최고 등급 달성"}
                </span>
                {prog.next && (
                  <span className="text-[11px] font-mono" style={{ color: "#c4b5fd" }}>
                    {prog.curExp.toLocaleString()} / {prog.needExp.toLocaleString()} XP
                  </span>
                )}
              </div>
              <div className="h-[9px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                <div className="h-full rounded-full" style={{ width: `${prog.percent}%`, backgroundColor: "#a78bfa" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 등급 트랙 */}
      <div className="flex gap-1.5 justify-between px-1">
        {GUILD_GRADES.map((g, i) => {
          const active = i === currentIndex;
          return (
            <div key={g.key} className="text-center" style={{ opacity: active ? 1 : 0.4, transform: active ? "scale(1.12)" : "none" }}>
              {gradeIcon(g.key, active ? 20 : 18, g.color)}
              <p className="mt-0.5 text-[9px]" style={{ color: active ? g.color : "#94a3b8", fontWeight: active ? 600 : 400 }}>{g.label}</p>
            </div>
          );
        })}
      </div>

      {/* 강화 카드 3종 */}
      <div className="space-y-2.5">
        <GrowthRow
          icon={<Users className="w-[22px] h-[22px]" style={{ color: "#534AB7" }} />}
          iconBg="#EEEDFE"
          title="길드 인원"
          desc={<>현재 <b className="text-slate-900">{maxMembers}명</b> · 다음 {GUILD_COSTS.member}P로 {maxMembers + 1}명</>}
          cost={GUILD_COSTS.member}
          color="#534AB7"
          icon2={<ArrowUp className="w-4 h-4" />}
          isStaff={isStaff}
          busy={busy === "member"}
          onClick={() => run("member", () => buyGuildCapacity(guildCode, "member"))}
        />
        <GrowthRow
          icon={<Box className="w-[22px] h-[22px]" style={{ color: "#0F6E56" }} />}
          iconBg="#E1F5EE"
          title="길드 보관함"
          desc={<>현재 <b className="text-slate-900">{vaultSlots}칸</b> · 다음 {GUILD_COSTS.vault}P로 {vaultSlots + 1}칸</>}
          cost={GUILD_COSTS.vault}
          color="#0F6E56"
          icon2={<ArrowUp className="w-4 h-4" />}
          isStaff={isStaff}
          busy={busy === "vault"}
          onClick={() => run("vault", () => buyGuildCapacity(guildCode, "vault"))}
        />
        <GrowthRow
          icon={<TrendingUp className="w-[22px] h-[22px]" style={{ color: "#185FA5" }} />}
          iconBg="#E6F1FB"
          title="길드 경험치"
          desc={<>{GUILD_COSTS.expUnit}P 투자 → <b style={{ color: "#185FA5" }}>+{EXP_PER_UNIT} XP</b> · 랭킹 상승</>}
          cost={GUILD_COSTS.expUnit}
          color="#185FA5"
          icon2={<Plus className="w-4 h-4" />}
          isStaff={isStaff}
          busy={busy === "exp"}
          onClick={() => run("exp", () => buyGuildExp(guildCode))}
        />
      </div>

      {/* 보유 포인트 + 안내 */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Eye className="w-3 h-3" />
          성장 현황은 모두 공개 · 강화는 마스터·부마스터만
        </p>
        <p className="text-[12px] text-slate-500">
          보유 <span className="font-bold text-slate-900">{totalPoints.toLocaleString()}P</span>
        </p>
      </div>
    </div>
  );
}

function GrowthRow({
  icon, iconBg, title, desc, cost, color, icon2, isStaff, busy, onClick,
}: {
  icon: React.ReactNode; iconBg: string; title: string; desc: React.ReactNode;
  cost: number; color: string; icon2: React.ReactNode;
  isStaff: boolean; busy: boolean; onClick: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3.5">
      <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      {isStaff && (
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className="h-[38px] px-4 rounded-[10px] text-white text-[13px] font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-60 transition"
          style={{ backgroundColor: color }}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : icon2}
          {cost}P
        </button>
      )}
    </div>
  );
}
