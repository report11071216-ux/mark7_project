import Link from "next/link";
import { Shield, Plus, ArrowRight } from "lucide-react";
import GradeEmblem from "@/components/guild/GradeEmblem";

export type MyGuildItem = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  role: string;
  my_points: number;
  server?: string | null;
  exp?: number;
};

const ROLE_LABEL: { [key: string]: string } = {
  master: "마스터",
  submaster: "부마스터",
  member: "멤버",
};

const GUILD_LIMIT = 2;

function gradeLabelOf(exp: number): string {
  if (exp >= 12000) return "그랜드마스터";
  if (exp >= 6000) return "마스터";
  if (exp >= 3000) return "다이아몬드";
  if (exp >= 1500) return "에메랄드";
  if (exp >= 700) return "플래티넘";
  if (exp >= 300) return "골드";
  if (exp >= 100) return "실버";
  return "브론즈";
}

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

  const canAddMore = guilds.length < GUILD_LIMIT;

  return (
    <div className="space-y-2.5">
      {/* 내가 속한 길드 박스 */}
      <div className="bg-plaza-surface rounded-xl ring-1 ring-plaza-line overflow-hidden">
        <div className="px-3 py-2 border-b border-plaza-line bg-plaza-surface-2">
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
        <div className="p-1.5">
          {guilds.length === 0 ? (
            <div className="text-center py-3 px-2">
              <p className="text-[11px] text-plaza-ink-dim leading-relaxed">
                아직 속한 길드가 없어요
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {guilds.map((g) => (
                <Link
                  key={g.id}
                  href={`/guild/${g.code}`}
                  className="group block p-1.5 rounded-lg hover:bg-plaza-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {g.logo_url ? (
                      <img
                        src={g.logo_url}
                        alt={g.name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-plaza-line shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 shrink-0">
                        <GradeEmblem tierLabel={gradeLabelOf(g.exp ?? 0)} size={32} />
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
            </div>
          )}
        </div>
      </div>

      {/* 새 길드 만들기 — 그라데이션 띠 (2개 미만일 때만) */}
      {canAddMore ? (
        <Link
          href="/onboarding/create"
          className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 hover:from-violet-500 hover:to-indigo-500 transition-colors group"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 shrink-0">
            <Plus className="w-4 h-4 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-xs leading-tight">새 길드 만들기</p>
            <p className="text-white/75 text-[10px] leading-tight mt-0.5">출석 · 레이드 · 랭킹</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : null}
    </div>
  );
}
