import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildGrowthPanel from "@/components/guild/GuildGrowthPanel";
import GuildPointFeed, { type PointLog } from "@/components/guild/GuildPointFeed";
import { Sprout } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function GuildGrowthPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();

  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("guilds")
      .select("id, code, name, total_points, total_exp, max_members, vault_slots")
      .eq("code", code)
      .maybeSingle(),
  ]);

  if (!user || !guild) notFound();

  // 길드원 검증
  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) notFound();

  const isStaff = member.role === "master" || member.role === "submaster";

  // 전체 랭킹 순위: 나보다 total_exp 높은 길드 수 + 1
  const { count: higherCount } = await supabase
    .from("guilds")
    .select("id", { count: "exact", head: true })
    .gt("total_exp", guild.total_exp ?? 0);
  const rank = (higherCount ?? 0) + 1;

  // 포인트 로그 (최근 50개)
  const { data: rawLogs } = await supabase
    .from("guild_point_logs")
    .select("id, log_type, amount, exp_gained, actor_name, memo, created_at")
    .eq("guild_id", guild.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const logs: PointLog[] = (rawLogs ?? []).map((l) => ({
    id: l.id,
    log_type: l.log_type,
    amount: l.amount,
    exp_gained: l.exp_gained ?? 0,
    actor_name: l.actor_name,
    memo: l.memo,
    created_at: l.created_at,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6 space-y-5">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GUILD GROWTH</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">길드 성장</h1>
          </div>
        </div>

        {/* 성장 패널 (등급 + 강화) */}
        <GuildGrowthPanel
          guildCode={guild.code}
          totalPoints={guild.total_points ?? 0}
          totalExp={guild.total_exp ?? 0}
          maxMembers={guild.max_members ?? 20}
          vaultSlots={guild.vault_slots ?? 0}
          rank={rank}
          isStaff={isStaff}
        />

        {/* 포인트 활동 피드 */}
        <GuildPointFeed logs={logs} />
      </div>
    </div>
  );
}
