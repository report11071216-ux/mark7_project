import Link from "next/link";
import { Shield, Plus } from "lucide-react";
export type MyGuildItem = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  role: string;
  my_points: number;
  server?: string | null;
};
const ROLE_LABEL: { [key: string]: string } = {
  master: "마스터",
  submaster: "부마스터",
  member: "멤버",
};
const GUILD_LIMIT = 2;
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
  const canAddMore = guilds.length > 0 && guilds.length < GUILD_LIMIT;
  return (
    <div className="bg-plaza-surface rounded-xl ring-1 ring-plaza-line overflow-hidden">
      <div className="px-4 py-3 border-b border-plaza-line bg-plaza-surface-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-plaza-ink-soft" />
            <h3 className="text-xs font-bold text-plaza-ink">내가 속한 길드</h3>
          </div>
          <span className="text-[10px] font-mono text-plaza-ink-dim">
            {guilds.length}
          </span>
        </div>
      </div>
      <div className="p-2 space-y-1">
        {guilds.length === 0 ? (
          <div className="text-center py-4 px-2">
            <p className="text-[11px] text-plaza-ink-dim mb-2 leading-relaxed">
              아직 속한 길드가 없어요
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-plaza-ink-soft hover:text-plaza-ink"
            >
              <Plus className="w-3 h-3" />
              길드 찾기
            </Link>
          </div>
        ) : (
          <>
            {guilds.map((g) => (
              <Link
                key={g.id}
                href={`/guild/${g.code}`}
                className="group block p-2 rounded-lg hover:bg-plaza-surface-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {g.logo_url ? (
                    <img
                      src={g.logo_url}
                      alt={g.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-plaza-line shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-plaza-accent-soft flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-plaza-accent">
                        {g.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-xs font-bold text-plaza-ink truncate group-hover:text-plaza-accent transition-colors">
                        {g.name}
                      </p>
                      {g.server ? (
                        <span className="shrink-0 font-mono text-[9px] px-1 py-0.5 rounded bg-plaza-accent-soft text-plaza-accent">
                          [{g.server}]
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-plaza-ink-dim mt-0.5">
                      {ROLE_LABEL[g.role] ?? g.role} · {g.my_points}P
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {canAddMore ? (
              <Link
                href="/onboarding/create"
                className="block p-2 rounded-lg border border-dashed border-plaza-line hover:border-plaza-accent hover:bg-plaza-surface-2 transition-colors text-center"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-plaza-ink-dim">
                  <Plus className="w-3 h-3" />
                  새 길드 만들기
                </span>
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
