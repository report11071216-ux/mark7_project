// app/plaza/ranking/page.tsx
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PlazaTabs from "@/components/plaza/PlazaTabs";
import type { RankedGuild } from "@/components/plaza/PodiumTop3";

export const revalidate = 120;

export default async function PlazaRankingPage() {
  const supabase = await createClient();

  // 1) 랭킹 기본 데이터
  const [totalResult, weeklyResult, monthlyResult] = await Promise.all([
    supabase
      .from("guilds")
      .select("id, code, name, member_count, total_exp, server")
      .order("total_exp", { ascending: false })
      .limit(100),
    supabase
      .from("weekly_guild_ranking")
      .select("id, code, name, weekly_points")
      .order("weekly_points", { ascending: false })
      .limit(100),
    supabase
      .from("monthly_guild_ranking")
      .select("id, code, name, monthly_points")
      .order("monthly_points", { ascending: false })
      .limit(100),
  ]);

  const totalRows = totalResult.data ?? [];
  const weeklyRows = weeklyResult.data ?? [];
  const monthlyRows = monthlyResult.data ?? [];

  // 2) 등장하는 모든 길드 id 모으기 → guilds_display에서 표시용 마크 한 번에 조회
  //    (광장 메인과 동일하게 display_logo_url = 장착 마크 우선)
  const allGuildIds = Array.from(
    new Set(
      [...totalRows, ...weeklyRows, ...monthlyRows]
        .map((g) => g.id)
        .filter(Boolean)
    )
  ) as string[];

  let logoMap = new Map<string, string | null>();
  if (allGuildIds.length > 0) {
    const { data: displayRows } = await supabase
      .from("guilds_display")
      .select("id, display_logo_url")
      .in("id", allGuildIds);
    for (const g of displayRows ?? []) {
      logoMap.set(g.id, g.display_logo_url);
    }
  }

  // 3) 전체 탭 메타 (서버/경험치/인원) — 주간·월간 탭에서 재사용
  const metaByCode: { [key: string]: { server: string | null; exp: number; member_count: number } } = {};
  totalRows.forEach((g) => {
    metaByCode[g.code] = {
      server: g.server ?? null,
      exp: g.total_exp ?? 0,
      member_count: g.member_count ?? 0,
    };
  });

  const totalList: RankedGuild[] = totalRows.map((g) => ({
    id: g.id,
    code: g.code,
    name: g.name,
    logo_url: logoMap.get(g.id) ?? null,
    member_count: g.member_count ?? 0,
    master_name: null,
    points: g.total_exp ?? 0,
    server: g.server ?? null,
    exp: g.total_exp ?? 0,
  }));

  const weeklyList: RankedGuild[] = weeklyRows.map((g) => {
    const meta = metaByCode[g.code];
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      logo_url: logoMap.get(g.id) ?? null,
      member_count: meta ? meta.member_count : null,
      master_name: null,
      points: g.weekly_points ?? 0,
      server: meta ? meta.server : null,
      exp: meta ? meta.exp : 0,
    };
  });

  const monthlyList: RankedGuild[] = monthlyRows.map((g) => {
    const meta = metaByCode[g.code];
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      logo_url: logoMap.get(g.id) ?? null,
      member_count: meta ? meta.member_count : null,
      master_name: null,
      points: g.monthly_points ?? 0,
      server: meta ? meta.server : null,
      exp: meta ? meta.exp : 0,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/plaza" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-6">
        <ArrowLeft className="w-4 h-4" />
        광장으로
      </Link>
      <div className="mb-8">
        <p className="text-[11px] font-mono text-violet-600 uppercase tracking-[0.2em] mb-1">GUILD RANKING</p>
        <h1 className="text-2xl font-bold text-slate-900">길드 랭킹</h1>
      </div>
      <PlazaTabs totalList={totalList} weeklyList={weeklyList} monthlyList={monthlyList} />
    </div>
  );
}
