import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

export type RecruitingGuild = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  member_count: number;
  max_members: number;
  description: string | null;
};

export default function RecruitingGuilds({ guilds }: { guilds: RecruitingGuild[] }) {
  return (
    <div className="plaza-card overflow-hidden">
      <div className="px-3 py-3 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900">모집중 길드</h3>
        </div>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
          Recruiting
        </p>
      </div>
      <div className="p-2 space-y-1.5">
        {guilds.length === 0 ? (
          <div className="text-center py-6 px-2">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              지금 모집중인<br />길드가 없어요
            </p>
          </div>
        ) : (
          guilds.map((g) => (
            <Link
              key={g.id}
              href={`/guild/${g.code}`}
              className="group block p-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {g.logo_url ? (
                  <img
                    src={g.logo_url}
                    alt={g.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {g.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {g.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {g.member_count}/{g.max_members}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      <div className="px-3 py-2 border-t border-slate-200">
        <Link
          href="/plaza/recruiting"
          className="flex items-center justify-center gap-1 text-[10px] font-mono text-blue-600 hover:text-blue-700 uppercase tracking-wider"
        >
          전체 보기
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
