import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
type Member = {
  user_id: string;
  points: number;
  role: string;
  title?: string | null;
  profiles: { username: string | null; avatar_url: string | null } | null;
};
type Props = { members: Member[] };
export default function PointRankingWidget({ members }: Props) {
  const sorted = [...members].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-400" />
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
            POINT RANKING
          </p>
          <h3 className="text-sm font-bold text-white">포인트 랭킹</h3>
        </div>
      </div>
      <div className="space-y-1.5">
        {sorted.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-4">랭킹 데이터가 없어요</p>
        )}
        {sorted.map((m, i) => (
          <div key={m.user_id} className={
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors " +
            (i === 0 ? "bg-amber-500/10 border border-amber-500/20" :
             i === 1 ? "bg-zinc-400/5 border border-zinc-700/50" :
             i === 2 ? "bg-orange-500/5 border border-orange-700/30" :
             "hover:bg-zinc-800/30")
          }>
            <span className="w-5 text-center text-sm shrink-0">
              {i < 3 ? medals[i] : <span className="text-xs font-mono text-zinc-600">{i + 1}</span>}
            </span>
            {m.profiles?.avatar_url ? (
              <img src={m.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-mono text-violet-300 shrink-0">
                {m.profiles?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="flex-1 min-w-0 flex items-center gap-1.5">
              <span className="text-sm font-medium text-zinc-200 truncate">
                {m.profiles?.username ?? "Unknown"}
              </span>
              {m.title ? (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold bg-zinc-700/60 text-zinc-300">
                  {m.title}
                </span>
              ) : null}
            </span>
            <span className={
              "text-sm font-bold font-mono shrink-0 " +
              (i === 0 ? "text-amber-300" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-300" : "text-violet-300")
            }>
              {(m.points ?? 0).toLocaleString()}P
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
