import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import RecruitingGallery, { type RecruitGuild } from "@/components/plaza/RecruitingGallery";

export const revalidate = 60;

export default async function RecruitingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 모집중인 길드 조회
  const { data: guildsRaw } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, server, description, member_count, max_members, total_exp, recruit_tags, recruit_discord_url, recruit_message, recruit_updated_at")
    .eq("is_recruiting", true)
    .order("recruit_updated_at", { ascending: false, nullsFirst: false });

  const guilds = guildsRaw ?? [];
  const guildIds = guilds.map((g) => g.id);

  // 최근 7일 출석 있는 길드만 (죽은 길드 자동 제외)
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

  // 장착 마크 조회: guild_themes.equipped_mark_id → purchases.item_id → shop_items.image_url
  let markUrlMap = new Map<string, string | null>();
  if (guildIds.length > 0) {
    const { data: themes } = await supabase
      .from("guild_themes")
      .select("guild_id, equipped_mark_id")
      .in("guild_id", guildIds);

    const purchaseIds = (themes ?? [])
      .map((t) => t.equipped_mark_id)
      .filter(Boolean) as string[];

    if (purchaseIds.length > 0) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id, item_id")
        .in("id", purchaseIds);

      const itemIds = Array.from(
        new Set((purchases ?? []).map((p) => p.item_id).filter(Boolean))
      ) as string[];

      let itemImageMap = new Map<string, string | null>();
      if (itemIds.length > 0) {
        const { data: items } = await supabase
          .from("shop_items")
          .select("id, image_url")
          .in("id", itemIds);
        itemImageMap = new Map((items ?? []).map((it) => [it.id, it.image_url]));
      }

      const purchaseToItem = new Map((purchases ?? []).map((p) => [p.id, p.item_id]));
      for (const t of themes ?? []) {
        if (!t.equipped_mark_id) continue;
        const itemId = purchaseToItem.get(t.equipped_mark_id);
        if (itemId) markUrlMap.set(t.guild_id, itemImageMap.get(itemId) ?? null);
      }
    }
  }

  // 전체 랭킹 (total_exp 순위)
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
      logoUrl: markUrlMap.get(g.id) ?? g.logo_url,
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
        <RecruitingGallery guilds={items} isLoggedIn={!!user} />
      </div>
    </div>
  );
}
