import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";

export type RankedSide = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  points: number;
};

const RANK_COLOR: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-slate-400",
  3: "text-orange-500",
};

export default function SideRanking({ guilds }: { guilds: RankedSide[] }) {
  return (
    <div className="plaza-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900">길드 랭킹</h3>
        </div>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
          Weekly Top 5
        </p>
      </div>
      <div className="p-2 space-y-0.5">
        {guilds.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[11px] text-slate-400">
              이번 주 출석 기록이<br />없어요
            </p>
          </div>
        ) : (
          guilds.map((g, i) => (
            <Link
              key={g.id}
              href={`/guild/${g.code}`}
              className="group block p-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold w-4 text-center shrink-0 ${
                    RANK_COLOR[i + 1] ?? "text-slate-400"
                  }`}
                >
                  {i + 1}
                </span>
                {g.logo_url ? (
                  <img
                    src={g.logo_url}
                    alt={g.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {g.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {g.name}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-600 shrink-0">
                  {g.points}P
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
      <div className="px-3 py-2 border-t border-slate-200">
        <Link
          href="/plaza/ranking"
          className="flex items-center justify-center gap-1 text-[10px] font-mono text-blue-600 hover:text-blue-700 uppercase tracking-wider"
        >
          전체 랭킹
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
