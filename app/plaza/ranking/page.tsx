import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PlazaTabs from "@/components/plaza/PlazaTabs";
import type { RankedGuild } from "@/components/plaza/PodiumTop3";

export const revalidate = 120;

export default async function PlazaRankingPage() {
  const supabase = await createClient();

  const [totalResult, weeklyResult, monthlyResult] = await Promise.all([
    supabase
      .from("guilds")
      .select("id, code, name, logo_url, member_count, total_points")
      .order("total_points", { ascending: false })
      .limit(100),
    supabase
      .from("weekly_guild_ranking")
      .select("id, code, name, logo_url, weekly_points")
      .order("weekly_points", { ascending: false })
      .limit(100),
    supabase
      .from("monthly_guild_ranking")
      .select("id, code, name, logo_url, monthly_points")
      .order("monthly_points", { ascending: false })
      .limit(100),
  ]);

  const totalList: RankedGuild[] = (totalResult.data ?? []).map((g) => ({
    id: g.id, code: g.code, name: g.name, logo_url: g.logo_url,
    member_count: g.member_count ?? 0, master_name: null,
    points: g.total_points ?? 0,
  }));

  const weeklyList: RankedGuild[] = (weeklyResult.data ?? []).map((g) => ({
    id: g.id, code: g.code, name: g.name, logo_url: g.logo_url,
    member_count: null, master_name: null,
    points: g.weekly_points ?? 0,
  }));

  const monthlyList: RankedGuild[] = (monthlyResult.data ?? []).map((g) => ({
    id: g.id, code: g.code, name: g.name, logo_url: g.logo_url,
    member_count: null, master_name: null,
    points: g.monthly_points ?? 0,
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        href="/plaza"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        광장으로
      </Link>

      <div className="mb-8">
        <p className="text-[11px] font-mono text-blue-600 uppercase tracking-[0.2em] mb-1">
          GUILD RANKING
        </p>
        <h1 className="text-2xl font-bold text-slate-900">길드 랭킹</h1>
      </div>

      <PlazaTabs
        totalList={totalList}
        weeklyList={weeklyList}
        monthlyList={monthlyList}
      />
    </div>
  );
}
