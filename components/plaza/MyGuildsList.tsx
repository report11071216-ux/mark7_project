import Link from "next/link";
import { Shield, Plus } from "lucide-react";
export type MyGuildItem = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  role: string;
  my_points: number;
};
const ROLE_LABEL: { [key: string]: string } = {
  master: "마스터",
  submaster: "부마스터",
  member: "멤버",
};
export default function MyGuildsList({
  isLoggedIn,
  guilds,
}: {
  isLoggedIn: boolean;
  guilds: MyGuildItem[];
}) {
  if (!isLoggedIn) {
    return null;
  }
  return (
    <div className="plaza-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900">내가 속한 길드</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {guilds.length}
          </span>
        </div>
      </div>
      <div className="p-2 space-y-1">
        {guilds.length === 0 ? (
          <div className="text-center py-4 px-2">
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              아직 속한 길드가 없어요
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900"
            >
              <Plus className="w-3 h-3" />
              길드 찾기
            </Link>
          </div>
        ) : (
          guilds.map((g) => (
            <Link
              key={g.id}
              href={`/guild/${g.code}`}
              className="group block p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {g.logo_url ? (
                  <img
                    src={g.logo_url}
                    alt={g.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {g.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-slate-600 transition-colors">
                    {g.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {ROLE_LABEL[g.role] ?? g.role} · {g.my_points}P
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
