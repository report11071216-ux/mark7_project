"use client";

import { Trophy, UsersRound, TrendingUp, CalendarCheck, History, Eye } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

export type PointLog = {
  id: string;
  log_type: string;
  amount: number;
  exp_gained: number;
  actor_name: string | null;
  memo: string | null;
  created_at: string;
};

type Props = { logs: PointLog[] };

const TYPE_META: { [key: string]: { icon: any; bg: string; color: string; label: string } } = {
  attendance:      { icon: CalendarCheck, bg: "#FAEEDA", color: "#854F0B", label: "출석 적립" },
  ranking_reward:  { icon: Trophy,        bg: "#E1F5EE", color: "#0F6E56", label: "주간 랭킹 보상" },
  buy_member:      { icon: UsersRound,    bg: "#EEEDFE", color: "#534AB7", label: "인원 확장" },
  buy_vault:       { icon: UsersRound,    bg: "#EEEDFE", color: "#534AB7", label: "보관함 확장" },
  buy_exp:         { icon: TrendingUp,    bg: "#E6F1FB", color: "#185FA5", label: "경험치 구매" },
};

function meta(type: string) {
  return TYPE_META[type] ?? { icon: History, bg: "#F1F5F9", color: "#64748b", label: "활동" };
}

export default function GuildPointFeed({ logs }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <History className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-bold text-slate-900">포인트 활동 내역</span>
        <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3" /> 모두에게 공개
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">아직 활동 내역이 없어요</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((log) => {
            const m = meta(log.log_type);
            const Icon = m.icon;
            const isGain = log.amount >= 0;
            return (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg }}>
                  <Icon className="w-[18px] h-[18px]" style={{ color: m.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-900 truncate">
                    {m.label}
                    {log.actor_name && <span className="text-slate-400"> · {log.actor_name}</span>}
                    {!log.actor_name && log.log_type === "ranking_reward" && <span className="text-slate-400"> · 전체 길드원</span>}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {getRelativeTime(log.created_at)}
                    {log.exp_gained > 0 && ` · +${log.exp_gained} XP`}
                    {log.memo && ` · ${log.memo}`}
                  </p>
                </div>
                <span
                  className="text-sm font-bold font-mono shrink-0"
                  style={{ color: isGain ? "#0F6E56" : "#A32D2D" }}
                >
                  {isGain ? "+" : ""}{log.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
