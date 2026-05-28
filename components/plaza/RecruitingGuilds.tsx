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
  server?: string | null;
};
export default function RecruitingGuilds({ guilds }: { guilds: RecruitingGuild[] }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden">
      {/* 남색 제목띠 */}
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-800">
        <Users className="w-5 h-5 text-white" />
        <h3 className="text-base font-bold text-white">모집중 길드</h3>
      </div>
      <div className="p-2.5 space-y-1.5">
        {guilds.length === 0 ? (
          <div className="text-center py-8 px-2">
            <p className="text-sm text-slate-400 leading-relaxed">
              지금 모집중인<br />길드가 없어요
            </p>
          </div>
        ) : (
          guilds.map((g) => (
            <Link
              key={g.id}
              href={`/guild/${g.code}`}
              className="group block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {g.logo_url ? (
                  <img
                    src={g.logo_url}
                    alt={g.name}
                    className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {g.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-slate-600 transition-colors">
                      {g.name}
                    </p>
                    {g.server ? (
                      <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-100">
                        [{g.server}]
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {g.member_count}/{g.max_members}명
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      <div className="px-3 py-2.5 border-t border-slate-200">
        <Link
          href="/plaza/recruiting"
          className="flex items-center justify-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800"
        >
          전체 보기
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
