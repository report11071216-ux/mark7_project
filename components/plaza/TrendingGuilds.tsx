import { createClient } from "@/lib/supabase/server";
import { Flame } from "lucide-react";
import TrendingGuildsMarquee, { type TrendingItem } from "@/components/plaza/TrendingGuildsMarquee";

function tierOf(exp: number) {
  if (exp >= 12000) return { label: "그랜드마스터", color: "#dc2626" };
  if (exp >= 6000) return { label: "마스터", color: "#9333ea" };
  if (exp >= 3000) return { label: "다이아몬드", color: "#0891b2" };
  if (exp >= 1500) return { label: "에메랄드", color: "#059669" };
  if (exp >= 700) return { label: "플래티넘", color: "#7c3aed" };
  if (exp >= 300) return { label: "골드", color: "#ca8a04" };
  if (exp >= 100) return { label: "실버", color: "#64748b" };
  return { label: "브론즈", color: "#b45309" };
}

export default async function TrendingGuilds() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 최근 7일 활동량 집계 (RLS 우회 RPC)
  const { data: activityRows } = await supabase.rpc("trending_guild_activity", {
    days_back: 7,
  });

  let activityCount = new Map<string, number>();
  for (const r of (activityRows ?? []) as any[]) {
    const gid = r.guild_id as string | null;
    if (!gid) continue;
    activityCount.set(gid, Number(r.activity_count) || 0);
  }

  const activeIds = Array.from(activityCount.keys());
  if (activeIds.length === 0) return null;

  // 모집중 길드 + 테마(장착 카드/마크) 병렬
  const [guildResult, themeResult] = await Promise.all([
    supabase
      .from("guilds")
      .select("id, code, name, logo_url, server, description, member_count, max_members, total_exp, is_recruiting, recruit_tags, recruit_message, recruit_discord_url")
      .in("id", activeIds)
      .eq("is_recruiting", true),
    supabase
      .from("guild_themes")
      .select("guild_id, equipped_guild_card_id, equipped_mark_id")
      .in("guild_id", activeIds),
  ]);

  const guildRows = guildResult.data ?? [];
  if (guildRows.length === 0) return null;

  // 장착 카드 + 마크 매핑
  let equippedCardMap = new Map<string, string>();
  let markPurchaseMap = new Map<string, string>();
  for (const t of themeResult.data ?? []) {
    const gid = (t as any).guild_id as string;
    const cardId = (t as any).equipped_guild_card_id as string | null;
    if (cardId) equippedCardMap.set(gid, cardId);
    const mp = (t as any).equipped_mark_id as string | null;
    if (mp) markPurchaseMap.set(gid, mp);
  }

  // 장착 카드 디자인/이미지 조회
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
  let markUrlByGuild = new Map<string, string | null>();
  const purchaseIds = Array.from(new Set(Array.from(markPurchaseMap.values())));
  if (purchaseIds.length > 0) {
    const { data: purchases } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", purchaseIds);

    const itemIds = Array.from(
      new Set((purchases ?? []).map((p) => p.item_id).filter(Boolean))
    ) as string[];

    let itemImg = new Map<string, string | null>();
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from("shop_items")
        .select("id, image_url")
        .in("id", itemIds);
      itemImg = new Map((items ?? []).map((it) => [it.id, it.image_url]));
    }

    const purchaseToItem = new Map(
      (purchases ?? []).map((p) => [p.id, p.item_id])
    );
    for (const entry of Array.from(markPurchaseMap.entries())) {
      const gid = entry[0];
      const pid = entry[1];
      const itemId = purchaseToItem.get(pid);
      if (itemId) markUrlByGuild.set(gid, itemImg.get(itemId) ?? null);
    }
  }

  // 정렬: 활동량순 → 경험치순 (평등하게)
  const sorted = guildRows
    .slice()
    .sort((a, b) => {
      const aa = activityCount.get(a.id) ?? 0;
      const ab = activityCount.get(b.id) ?? 0;
      if (ab !== aa) return ab - aa;
      return (b.total_exp ?? 0) - (a.total_exp ?? 0);
    })
    .slice(0, 10);

  if (sorted.length === 0) return null;

  const items: TrendingItem[] = sorted.map((g) => {
    const tier = tierOf(g.total_exp ?? 0);
    const cardId = equippedCardMap.get(g.id);
    const cardData = cardId ? cardDataMap.get(cardId) : null;
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      server: g.server ?? null,
      grade: "custom",
      markUrl: markUrlByGuild.get(g.id) ?? g.logo_url,
      tierLabel: tier.label,
      tierColor: tier.color,
      memberCount: g.member_count ?? 0,
      maxMembers: g.max_members ?? 50,
      description: g.description ?? "",
      tags: (g.recruit_tags ?? []) as string[],
      recruitMessage: g.recruit_message ?? "",
      discordUrl: g.recruit_discord_url ?? "",
      design: cardData?.design ?? null,
      imageUrl: cardData?.imageUrl ?? null,
    };
  });

  return (
    <section>
     <div className="flex items-center gap-2 mb-3">
  <Flame className="w-4 h-4 text-orange-500" />
  <h2 className="text-base font-bold text-plaza-ink">지금 뜨는 길드</h2>
  <div className="flex-1 h-px bg-plaza-line ml-2" />
</div>
      <TrendingGuildsMarquee items={items} isLoggedIn={!!user} />
    </section>
  );
}
