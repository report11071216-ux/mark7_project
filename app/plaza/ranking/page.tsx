// app/plaza/ranking/page.tsx
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
      .select("id, code, name, logo_url, member_count, total_exp, server")
      .order("total_exp", { ascending: false })
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

  const guildRows = totalResult.data ?? [];
  const guildIds = guildRows.map((g) => g.id);

  // 1) 각 길드가 장착한 마크 id 가져오기 (guild_themes.equipped_mark_id)
  const markIdByGuildId: { [key: string]: string } = {};
  if (guildIds.length > 0) {
    const { data: themes } = await supabase
      .from("guild_themes")
      .select("guild_id, equipped_mark_id")
      .in("guild_id", guildIds);
    (themes ?? []).forEach((t) => {
      if (t.equipped_mark_id) markIdByGuildId[t.guild_id] = t.equipped_mark_id;
    });
  }

  // 2) 그 마크들의 실제 이미지 url 가져오기 (shop_items.image_url)
  const markUrlById: { [key: string]: string } = {};
  const markIds = Array.from(new Set(Object.values(markIdByGuildId)));
  if (markIds.length > 0) {
    const { data: items } = await supabase
      .from("shop_items")
      .select("id, image_url")
      .in("id", markIds);
    (items ?? []).forEach((it) => {
      if (it.image_url) markUrlById[it.id] = it.image_url;
    });
  }

  // 길드 id → 표시할 마크 이미지 (장착 마크 우선, 없으면 logo_url)
  function resolveMark(guildId: string, fallbackLogo: string | null): string | null {
    const markId = markIdByGuildId[guildId];
    if (markId && markUrlById[markId]) return markUrlById[markId];
    return fallbackLogo ?? null;
  }

  // code → 서버/경험치/인원/마크 메타 (주간·월간 탭에서 재사용)
  const metaByCode: { [key: string]: { server: string | null; exp: number; member_count: number; mark: string | null } } = {};
  guildRows.forEach((g) => {
    metaByCode[g.code] = {
      server: g.server ?? null,
      exp: g.total_exp ?? 0,
      member_count: g.member_count ?? 0,
      mark: resolveMark(g.id, g.logo_url),
    };
  });

  const totalList: RankedGuild[] = guildRows.map((g) => ({
    id: g.id,
    code: g.code,
    name: g.name,
    logo_url: resolveMark(g.id, g.logo_url),
    member_count: g.member_count ?? 0,
    master_name: null,
    points: g.total_exp ?? 0,
    server: g.server ?? null,
    exp: g.total_exp ?? 0,
  }));

  const weeklyList: RankedGuild[] = (weeklyResult.data ?? []).map((g) => {
    const meta = metaByCode[g.code];
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      logo_url: meta ? meta.mark : g.logo_url,
      member_count: meta ? meta.member_count : null,
      master_name: null,
      points: g.weekly_points ?? 0,
      server: meta ? meta.server : null,
      exp: meta ? meta.exp : 0,
    };
  });

  const monthlyList: RankedGuild[] = (monthlyResult.data ?? []).map((g) => {
    const meta = metaByCode[g.code];
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      logo_url: meta ? meta.mark : g.logo_url,
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
