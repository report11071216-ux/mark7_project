import { createClient } from "@/lib/supabase/server";
import { Users, Shield, FileText, UserPlus, Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    guildCountResult,
    memberCountResult,
    userCountResult,
    postCountResult,
    recruitingCountResult,
    newUserCountResult,
  ] = await Promise.all([
    supabase.from("guilds").select("*", { count: "exact", head: true }),
    supabase.from("guild_members").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("guilds")
      .select("*", { count: "exact", head: true })
      .eq("is_recruiting", true),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
  ]);

  const stats = [
    {
      label: "전체 길드",
      value: guildCountResult.count ?? 0,
      icon: Shield,
      hint: `모집중 ${recruitingCountResult.count ?? 0}개`,
    },
    {
      label: "전체 회원",
      value: userCountResult.count ?? 0,
      icon: Users,
      hint: `최근 7일 +${newUserCountResult.count ?? 0}`,
    },
    {
      label: "길드 가입 건수",
      value: memberCountResult.count ?? 0,
      icon: UserPlus,
      hint: "guild_members 행 수",
    },
    {
      label: "전체 게시글",
      value: postCountResult.count ?? 0,
      icon: FileText,
      hint: "광장 + 길드 게시판",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl bg-white ring-1 ring-slate-200 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 font-mono">
                {s.value.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{s.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">안내</h2>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          가디언 토벌 관리, 플랫폼 설정, 공지 배너는 다음 페이즈에서 순차적으로
          추가됩니다. 지금은 대시보드 통계만 활성화되어 있어요.
        </p>
      </div>
    </div>
  );
}
