import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

type Member = {
  user_id: string;
  points: number;
  joined_at: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
};

type Props = { members: Member[] };

export default function RecentMembersWidget({ members }: Props) {
  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-violet-400" />
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
            RECENT MEMBERS
          </p>
          <h3 className="text-sm font-bold text-white">최근 가입 멤버</h3>
        </div>
      </div>
      <div className="space-y-2">
        {members.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-4">멤버가 없어요</p>
        )}
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
            <div className="flex items-center gap-3">
              {m.profiles?.avatar_url ? (
                <img src={m.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-mono text-violet-300">
                  {m.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white">{m.profiles?.username ?? "Unknown"}</p>
                <p className="text-xs text-zinc-500 font-mono">{getRelativeTime(m.joined_at)}</p>
              </div>
            </div>
            <p className="text-sm font-mono text-violet-300">{m.points ?? 0}P</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
