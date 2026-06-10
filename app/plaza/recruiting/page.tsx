import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import RecruitingGallery, { type RecruitGuild } from "@/components/plaza/RecruitingGallery";

export const revalidate = 60;

export default async function RecruitingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 모집중인 길드
  const { data: guildsRaw } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, server, description, member_count, max_members, total_exp, recruit_tags, recruit_discord_url, recruit_message")
    .eq("is_recruiting", true);

  const guilds = guildsRaw ?? [];
  const guildIds = guilds.map((g) => g.id);

  // 최근 7일 활동량 (RLS 우회 RPC) — 정렬 + 활성 필터 둘 다 사용
  let activityCount = new Map<string, number>();
  if (guildIds.length > 0) {
    const { data: activityRows } = await supabase.rpc("trending_guild_activity", {
      days_back: 7,
    });
    for (const r of (activityRows ?? []) as any[]) {
      if (r.guild_id) activityCount.set(r.guild_id as string, Number(r.activity_count) || 0);
    }
  }

  // 테마: 장착 카드 + 마크
  let equippedCardMap = new Map<string, string>();
  let markPurchaseMap = new Map<string, string>();
  if (guildIds.length > 0) {
    const { data: themes } = await supabase
      .from("guild_themes")
      .select("guild_id, equipped_guild_card_id, equipped_mark_id")
      .in("guild_id", guildIds);
    for (const t of themes ?? []) {
      const cardId = (t as any).equipped_guild_card_id as string | null;
      if (cardId) equippedCardMap.set((t as any).guild_id, cardId);
      const mp = (t as any).equipped_mark_id as string | null;
      if (mp) markPurchaseMap.set((t as any).guild_id, mp);
    }
  }

  // 장착 카드 design + image
  let cardDataMap = new Map<string, { design: any; imageUrl: string | null }>();
  const cardIds = Array.from(new Set(Array.from(equippedCardMap.values())));
  if (cardIds.length > 0) {
    const { data: npCards } = await supabase
      .from("guild_nameplate_cards")
      .select("id, design, image_url")
      .in("id", cardIds);
    for (const c of npCards ?? []) {
      cardDataMap.set(c.id, { design: c.design ?? {}, imageUrl: c.image_url });
    }
  }

  // 마크 이미지: purchases → shop_items.image_url
  let markUrlMap = new Map<string, string | null>();
  const purchaseIds = Array.from(new Set(Array.from(markPurchaseMap.values())));
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
    for (const entry of Array.from(markPurchaseMap.entries())) {
      const gid = entry[0];
      const itemId = purchaseToItem.get(entry[1]);
      if (itemId) markUrlMap.set(gid, itemImageMap.get(itemId) ?? null);
    }
  }

  // 전체 랭킹 (total_exp 순위)
  const { data: allForRank } = await supabase
    .from("guilds")
    .select("id, total_exp")
    .order("total_exp", { ascending: false });
  const rankMap = new Map<string, number>();
  (allForRank ?? []).forEach((g, i) => rankMap.set(g.id, i + 1));

  // 최근 7일 활동 있는 길드만 + 활동순 정렬
  const items: RecruitGuild[] = guilds
    .filter((g) => activityCount.has(g.id))
    .map((g) => {
      const cardId = equippedCardMap.get(g.id);
      const cardData = cardId ? cardDataMap.get(cardId) : null;
      return {
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
        cardImageUrl: cardData?.imageUrl ?? null,
        cardDesign: cardData?.design ?? null,
        _activity: activityCount.get(g.id) ?? 0,
      } as RecruitGuild & { _activity: number };
    })
    .sort((a: any, b: any) => {
      if (b._activity !== a._activity) return b._activity - a._activity;
      return b.totalExp - a.totalExp;
    });

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
