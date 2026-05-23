import { Card } from "@/components/ui/card";
import { Wifi } from "lucide-react";

type Member = {
  user_id: string;
  last_seen_at: string | null;
  profiles: { username: string | null; avatar_url: string | null } | null;
};

type Props = { members: Member[] };

function isOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

function isRecent(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  return diff < 30 * 60 * 1000;
}

export default function OnlineMembersWidget({ members }: Props) {
  const online = members.filter((m) => isOnline(m.last_seen_at));
  const recent = members.filter((m) => !isOnline(m.last_seen_at) && isRecent(m.last_seen_at));

  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="w-4 h-4 text-cyan-400" />
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
            ONLINE
          </p>
          <h3 className="text-sm font-bold text-white">온라인 멤버</h3>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold font-mono">
          {online.length}명 접속중
        </span>
      </div>

      {online.length === 0 && recent.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">현재 접속중인 멤버가 없어요</p>
      ) : (
        <div className="space-y-1.5">
          {online.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <div className="relative shrink-0">
                {m.profiles?.avatar_url ? (
                  <img src={m.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-mono text-violet-300">
                    {m.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-cyan-400 ring-1 ring-zinc-900" />
              </div>
              <span className="text-sm text-white font-medium truncate">{m.profiles?.username ?? "Unknown"}</span>
              <span className="ml-auto text-[10px] font-mono text-cyan-400/70">온라인</span>
            </div>
          ))}
          {recent.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-800/30 transition-colors">
              <div className="relative shrink-0">
                {m.profiles?.avatar_url ? (
                  <img src={m.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover opacity-60" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-mono text-violet-400/50">
                    {m.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-zinc-500 ring-1 ring-zinc-900" />
              </div>
              <span className="text-sm text-zinc-400 truncate">{m.profiles?.username ?? "Unknown"}</span>
              <span className="ml-auto text-[10px] font-mono text-zinc-600">30분 내</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
