import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import RecruitingGallery, { type RecruitGuild } from "@/components/plaza/RecruitingGallery";

export const revalidate = 60;

export default async function RecruitingPage() {
  const supabase = await createClient();

  // 모집중인 길드 조회
  const { data: guildsRaw } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, server, description, member_count, max_members, total_exp, recruit_tags, recruit_discord_url, recruit_message, recruit_updated_at")
    .eq("is_recruiting", true)
    .order("recruit_updated_at", { ascending: false, nullsFirst: false });

  const guilds = guildsRaw ?? [];

  // 최근 7일 출석 있는 길드만 (죽은 길드 자동 제외)
  const guildIds = guilds.map((g) => g.id);
  let activeGuildIds = new Set<string>();
  if (guildIds.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: recentAtt } = await supabase
      .from("attendances")
      .select("guild_id")
      .in("guild_id", guildIds)
      .gte("attendance_date", sevenDaysAgo);
    for (const a of recentAtt ?? []) {
      if (a.guild_id) activeGuildIds.add(a.guild_id);
    }
  }

  // 전체 랭킹 (total_exp 순위) 계산용 — 각 길드의 순위
  const { data: allForRank } = await supabase
    .from("guilds")
    .select("id, total_exp")
    .order("total_exp", { ascending: false });
  const rankMap = new Map<string, number>();
  (allForRank ?? []).forEach((g, i) => rankMap.set(g.id, i + 1));

  const items: RecruitGuild[] = guilds
    .filter((g) => activeGuildIds.has(g.id))
    .map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      logoUrl: g.logo_url,
      server: g.server ?? null,
      description: g.description ?? "",
      memberCount: g.member_count ?? 0,
      maxMembers: g.max_members ?? 20,
      totalExp: g.total_exp ?? 0,
      rank: rankMap.get(g.id) ?? 0,
      tags: (g.recruit_tags ?? []) as string[],
      discordUrl: g.recruit_discord_url ?? "",
      recruitMessage: g.recruit_message ?? "",
    }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-3">
          <Link href="/plaza" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-violet-600 transition mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> 광장
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">RECRUITING</p>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">모집중인 길드</h1>
            </div>
            <span className="text-sm text-slate-500">
              총 <span className="font-bold text-slate-900">{items.length}</span>개
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6">
        <RecruitingGallery guilds={items} />
      </div>
    </div>
  );
}
