import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import RankingBoard, { type RankedGuild } from "@/components/plaza/RankingBoard";

export const revalidate = 120;

export default async function PlazaRankingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 전체 랭킹 (길드 경험치순, 10위까지)
  const { data: rows } = await supabase
    .from("guilds")
    .select("id, code, name, member_count, total_exp, server, is_recruiting")
    .order("total_exp", { ascending: false })
    .limit(10);

  const guildRows = rows ?? [];
  const guildIds = guildRows.map((g) => g.id);

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

  const list: RankedGuild[] = guildRows.map((g) => {
    const cardId = equippedCardMap.get(g.id);
    const cardData = cardId ? cardDataMap.get(cardId) : null;
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      markUrl: markUrlMap.get(g.id) ?? null,
      memberCount: g.member_count ?? 0,
      exp: g.total_exp ?? 0,
      server: g.server ?? null,
      isRecruiting: g.is_recruiting === true,
      cardImageUrl: cardData?.imageUrl ?? null,
      cardDesign: cardData?.design ?? null,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/plaza" className="inline-flex items-center gap-1.5 text-sm text-plaza-ink-dim hover:text-plaza-ink transition mb-6">
        <ArrowLeft className="w-4 h-4" />
        광장으로
      </Link>
      <div className="mb-8">
        <p className="text-[11px] font-mono text-plaza-accent uppercase tracking-[0.2em] mb-1">GUILD RANKING</p>
        <h1 className="text-2xl font-bold text-plaza-ink">길드 랭킹</h1>
        <p className="text-xs text-plaza-ink-dim mt-1.5">길드 경험치 기준 전체 순위예요</p>
      </div>
      <RankingBoard guilds={list} isLoggedIn={!!user} />
    </div>
  );
}
