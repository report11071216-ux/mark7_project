import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildInventory, {
  type InventoryItem,
  type StickerPack,
  type BackgroundItem,
  type GuildCardEntry,
  type MyCard,
} from "@/components/guild/GuildInventory";
import { type OwnedNameplate } from "@/components/guild/NameplateVault";
import { type MegaphoneItem } from "@/components/guild/shop/MegaphoneInventory";
export const dynamic = "force-dynamic";
type Props = { params: { code: string } };
export default async function GuildInventoryPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();
  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, name, code, vault_slots, server, member_count, max_members").eq("code", code).single(),
  ]);
  if (!user || !guild) notFound();
  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();
  const [{ data: purchases }, { data: themeRow }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id, item_id, item_name, item_category, price_paid, created_at, expires_at, activated_at, megaphone_message")
      .eq("guild_id", guild.id)
      .eq("shop_type", "guild")
      .order("created_at", { ascending: false }),
    supabase
      .from("guild_themes")
      .select("equipped_mark_id, equipped_sticker_sets, equipped_background_url, equipped_guild_card_id")
      .eq("guild_id", guild.id)
      .maybeSingle(),
  ]);
  const rawPurchases = purchases ?? [];
  const itemIds = Array.from(
    new Set(rawPurchases.map((p) => p.item_id).filter(Boolean))
  ) as string[];
  let imageMap: { [key: string]: string | null } = {};
  if (itemIds.length > 0) {
    const { data: shopItemsData } = await supabase
      .from("shop_items")
      .select("id, image_url")
      .in("id", itemIds);
    for (const it of shopItemsData ?? []) {
      imageMap[it.id] = it.image_url;
    }
  }
  const items: InventoryItem[] = rawPurchases.map((p) => ({
    id: p.id,
    item_name: p.item_name,
    item_category: p.item_category,
    price_paid: p.price_paid,
    created_at: p.created_at,
    expires_at: p.expires_at,
    activated_at: p.activated_at,
    megaphone_message: p.megaphone_message,
    image_url: p.item_id ? imageMap[p.item_id] ?? null : null,
  }));

  const megaphoneItems: MegaphoneItem[] = rawPurchases
    .filter((p) => p.item_category === "확성기")
    .map((p) => ({
      id: p.id,
      item_name: p.item_name,
      duration_hours: null,
      activated_at: p.activated_at,
      expires_at: p.expires_at,
      megaphone_message: p.megaphone_message,
    }));

  // 배경 아이템 (구매한 길드배경)
  const equippedBg = themeRow?.equipped_background_url ?? null;
  const backgroundItems: BackgroundItem[] = [];
  const seenBg = new Set<string>();
  for (const p of rawPurchases) {
    if (p.item_category !== "길드배경") continue;
    const url = p.item_id ? imageMap[p.item_id] ?? null : null;
    if (!url || seenBg.has(url)) continue;
    seenBg.add(url);
    backgroundItems.push({
      purchase_id: p.id,
      name: p.item_name,
      image_url: url,
      equipped: equippedBg === url,
    });
  }

  const equippedSets: string[] = Array.isArray(themeRow?.equipped_sticker_sets)
    ? (themeRow!.equipped_sticker_sets as string[]) : [];
  const packPurchases = rawPurchases.filter((p) => p.item_category === "이모티콘팩");
  const packItemIds = Array.from(
    new Set(packPurchases.map((p) => p.item_id).filter(Boolean))
  ) as string[];
  let stickerPacks: StickerPack[] = [];
  if (packItemIds.length > 0) {
    const { data: stickerRows } = await supabase
      .from("stickers")
      .select("shop_item_id, image_url, sort_order")
      .in("shop_item_id", packItemIds)
      .order("sort_order", { ascending: true });
    const byPack: { [key: string]: string[] } = {};
    for (const s of stickerRows ?? []) {
      if (!byPack[s.shop_item_id]) byPack[s.shop_item_id] = [];
      byPack[s.shop_item_id].push(s.image_url);
    }
    const seen = new Set<string>();
    for (const p of packPurchases) {
      if (!p.item_id || seen.has(p.item_id)) continue;
      seen.add(p.item_id);
      stickerPacks.push({
        shop_item_id: p.item_id,
        name: p.item_name,
        cover_url: imageMap[p.item_id] ?? null,
        stickers: byPack[p.item_id] ?? [],
        equipped: equippedSets.includes(p.item_id),
      });
    }
  }

  // ── 카드 보관함 데이터 (출석 카드 도감) ──
  const [{ data: activeCards }, { data: gCards }, { data: donations }, { data: myCardRows }] =
    await Promise.all([
      supabase.from("attendance_cards").select("id, grade, name, image_url").eq("is_active", true),
      supabase.from("guild_cards").select("card_id, count").eq("guild_id", guild.id),
      supabase.from("guild_card_donations").select("card_id, qty, user_id").eq("guild_id", guild.id),
      supabase.from("user_cards").select("card_id, count").eq("user_id", user.id),
    ]);

  const gCountMap: { [cardId: string]: number } = {};
  for (const g of gCards ?? []) gCountMap[g.card_id] = g.count ?? 0;

  const donorAgg: { [cardId: string]: { [userId: string]: number } } = {};
  for (const d of donations ?? []) {
    if (!donorAgg[d.card_id]) donorAgg[d.card_id] = {};
    donorAgg[d.card_id][d.user_id] = (donorAgg[d.card_id][d.user_id] ?? 0) + (d.qty ?? 0);
  }

  const donorIds = Array.from(
    new Set((donations ?? []).map((d) => d.user_id).filter(Boolean))
  ) as string[];
  const nameMap: { [userId: string]: string } = {};
  if (donorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", donorIds);
    for (const p of profs ?? []) nameMap[p.id] = p.username ?? "이름없음";
  }

  const cards: GuildCardEntry[] = (activeCards ?? []).map((c) => {
    const agg = donorAgg[c.id] ?? {};
    const donors = Object.keys(agg)
      .map((uid) => ({ name: nameMap[uid] ?? "알 수 없음", qty: agg[uid] }))
      .sort((a, b) => b.qty - a.qty);
    return {
      cardId: c.id,
      name: c.name,
      grade: c.grade,
      imageUrl: c.image_url,
      guildCount: gCountMap[c.id] ?? 0,
      donors,
    };
  });

  const myIds = Array.from(
    new Set((myCardRows ?? []).map((r) => r.card_id).filter(Boolean))
  ) as string[];
  const metaMap: { [cardId: string]: { grade: string; name: string; image_url: string | null } } = {};
  if (myIds.length > 0) {
    const { data: metas } = await supabase
      .from("attendance_cards")
      .select("id, grade, name, image_url")
      .in("id", myIds);
    for (const m of metas ?? []) {
      metaMap[m.id] = { grade: m.grade, name: m.name, image_url: m.image_url };
    }
  }
  const myCards: MyCard[] = (myCardRows ?? [])
    .filter((r) => (r.count ?? 0) > 0)
    .map((r) => {
      const m = metaMap[r.card_id];
      return {
        cardId: r.card_id,
        name: m?.name ?? "카드",
        grade: m?.grade ?? "common",
        imageUrl: m?.image_url ?? null,
        count: r.count ?? 0,
      };
    });

  // ── 명함 카드 (보유 + 장착) ──
  const equippedNameplateId = (themeRow as any)?.equipped_guild_card_id ?? null;
  const { data: ownedRows } = await supabase
    .from("guild_owned_nameplates")
    .select("card_id, purchased_at")
    .eq("guild_id", guild.id)
    .order("purchased_at", { ascending: false });

  const ownedCardIds = Array.from(
    new Set((ownedRows ?? []).map((r) => r.card_id).filter(Boolean))
  ) as string[];

  let ownedNameplates: OwnedNameplate[] = [];
  if (ownedCardIds.length > 0) {
    const { data: npCards } = await supabase
      .from("guild_nameplate_cards")
      .select("id, name, image_url, design")
      .in("id", ownedCardIds);
    const npMap = new Map((npCards ?? []).map((c) => [c.id, c]));
    // 구매 최신순 유지
    for (const r of ownedRows ?? []) {
      const c = npMap.get(r.card_id);
      if (!c) continue;
      ownedNameplates.push({
        cardId: c.id,
        name: c.name,
        imageUrl: c.image_url,
        design: (c.design ?? {}) as { [effect: string]: any },
      });
    }
  }

  // 길드 마크 이미지 URL (equipped_mark_id → purchases → shop_items.image_url)
  let markUrl: string | null = null;
  const equippedMarkPurchaseId = themeRow?.equipped_mark_id ?? null;
  if (equippedMarkPurchaseId) {
    const { data: markPurchase } = await supabase
      .from("purchases")
      .select("item_id")
      .eq("id", equippedMarkPurchaseId)
      .maybeSingle();
    if (markPurchase?.item_id) {
      const { data: markItem } = await supabase
        .from("shop_items")
        .select("image_url")
        .eq("id", markPurchase.item_id)
        .maybeSingle();
      markUrl = markItem?.image_url ?? null;
    }
  }

  // ── 보관함 점유 칸 수: 길드샵 코스메틱 (확성기 제외) ──
  const usedSlots = rawPurchases.filter((p) => p.item_category !== "확성기").length;
  const vaultSlots = guild.vault_slots ?? 0;

  const isStaff = membership.role === "master" || membership.role === "submaster";
  return (
    <GuildInventory
      guildCode={guild.code}
      guildId={guild.id}
      guildName={guild.name}
      items={items}
      isStaff={isStaff}
      equippedMarkId={themeRow?.equipped_mark_id ?? null}
      stickerPacks={stickerPacks}
      megaphoneItems={megaphoneItems}
      backgroundItems={backgroundItems}
      usedSlots={usedSlots}
      vaultSlots={vaultSlots}
      cards={cards}
      myCards={myCards}
      guildServer={guild.server ?? null}
      guildMarkUrl={markUrl}
      memberCount={guild.member_count ?? 0}
      maxMembers={guild.max_members ?? 50}
      ownedNameplates={ownedNameplates}
      equippedNameplateId={equippedNameplateId}
    />
  );
}
