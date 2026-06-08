import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import {
  ChevronLeft, Crown, Shield, Users, Swords, CalendarDays,
  CheckCircle2, Activity, Coins,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Member = {
  userId: string;
  name: string;
  avatar: string | null;
  role: "master" | "submaster" | "member";
  points: number;
  characterClass: string | null;
  itemLevel: number | null;
  joinedAt: string;
};
type Raid = { title: string; imageUrl: string | null };
type Schedule = { difficulty: string | null; date: string | null; time: string | null; completed: boolean };
type Detail = {
  success: boolean;
  error?: string;
  guild?: {
    id: string; code: string; name: string; server: string | null;
    description: string | null; memberCount: number; maxMembers: number;
    isRecruiting: boolean; totalPoints: number; totalExp: number;
    createdAt: string; masterId: string;
  };
  members?: Member[];
  raids?: Raid[];
  schedules?: Schedule[];
  theme?: { primary?: string; background?: string; welcome?: string };
  attendance?: { last7: number; total: number };
};

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}
function roleLabel(role: string): string {
  if (role === "master") return "마스터";
  if (role === "submaster") return "부마스터";
  return "길드원";
}

export default async function AdminGuildDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) redirect("/");

  const { data, error } = await supabase.rpc("admin_guild_detail", { p_code: code });
  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/guilds" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />목록으로
        </Link>
        <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 p-5 text-sm text-rose-700">
          조회 실패: {error.message}
        </div>
      </div>
    );
  }

  const detail = (data ?? {}) as Detail;
  if (!detail.success || !detail.guild) {
    if (detail.error) {
      return (
        <div className="space-y-4">
          <Link href="/admin/guilds" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />목록으로
          </Link>
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-5 text-sm text-amber-700">
            {detail.error}
          </div>
        </div>
      );
    }
    notFound();
  }

  const g = detail.guild;
  const members = detail.members ?? [];
  const raids = detail.raids ?? [];
  const schedules = detail.schedules ?? [];
  const theme = detail.theme ?? {};
  const att = detail.attendance ?? { last7: 0, total: 0 };

  const upcoming = schedules.filter((s) => !s.completed).length;
  const done = schedules.filter((s) => s.completed).length;

  return (
    <div className="space-y-6">
      {/* 상단 네비 */}
      <div className="flex items-center justify-between">
        <Link href="/admin/guilds" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />길드 목록
        </Link>
        <Link
          href={`/guild/${g.code}`}
          className="text-xs text-slate-400 hover:text-slate-600 font-mono"
        >
          실제 페이지 열기 →
        </Link>
      </div>

      {/* 길드 헤더 */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ background: theme.primary || "#7c3aed" }}
          >
            {(g.name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">{g.name}</h1>
              <span className="text-xs font-mono text-slate-400">{g.code}</span>
              {g.isRecruiting && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">모집중</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {g.server ? `${g.server} · ` : ""}생성 {fmtDate(g.createdAt)}
            </p>
            {g.description && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{g.description}</p>
            )}
          </div>
        </div>

        {/* 요약 지표 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1"><Users className="w-3 h-3" />멤버</div>
            <p className="text-sm font-bold text-slate-900">{g.memberCount} / {g.maxMembers}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1"><Coins className="w-3 h-3" />길드 포인트</div>
            <p className="text-sm font-bold text-slate-900">{(g.totalPoints ?? 0).toLocaleString()}P</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1"><Activity className="w-3 h-3" />출석 (7일)</div>
            <p className="text-sm font-bold text-slate-900">{att.last7}건</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1"><CheckCircle2 className="w-3 h-3" />출석 누적</div>
            <p className="text-sm font-bold text-slate-900">{att.total}건</p>
          </div>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-violet-600" />
          <h2 className="text-sm font-bold text-slate-900">멤버 ({members.length})</h2>
        </div>
        <div className="space-y-1">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
              {m.avatar ? (
                <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                  {(m.name ?? "?").charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-900 truncate">{m.name}</span>
                  {m.role === "master" && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                  {m.role === "submaster" && <Shield className="w-3 h-3 text-violet-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {roleLabel(m.role)}{m.characterClass ? ` · ${m.characterClass}` : ""}{m.itemLevel ? ` · ${m.itemLevel}` : ""}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 shrink-0">{(m.points ?? 0).toLocaleString()}P</span>
            </div>
          ))}
        </div>
      </div>

      {/* 레이드 도감 + 일정 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Swords className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900">레이드 도감 ({raids.length})</h2>
          </div>
          {raids.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">등록된 레이드가 없어요</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {raids.map((r, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                  {r.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900">레이드 일정</h2>
            <span className="text-[11px] text-slate-400">예정 {upcoming} · 완료 {done}</span>
          </div>
          {schedules.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">등록된 일정이 없어요</p>
          ) : (
            <div className="space-y-1">
              {schedules.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-slate-50">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.completed ? "bg-slate-300" : "bg-blue-500"}`} />
                  <span className="text-slate-600 flex-1 truncate">
                    {fmtDate(s.date)}{s.time ? ` ${s.time}` : ""}{s.difficulty ? ` · ${s.difficulty}` : ""}
                  </span>
                  {s.completed && <span className="text-[10px] text-slate-400 shrink-0">완료</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
