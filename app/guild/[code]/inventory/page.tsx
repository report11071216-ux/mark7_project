import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildInventory, {
  type InventoryItem,
  type StickerPack,
  type BackgroundItem,
} from "@/components/guild/GuildInventory";
import { type MegaphoneItem } from "@/components/guild/shop/MegaphoneInventory";
export const dynamic = "force-dynamic";
type Props = { params: { code: string } };
export default async function GuildInventoryPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();
  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, name, code, vault_slots").eq("code", code).single(),
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
      .select("equipped_mark_id, equipped_sticker_sets, equipped_background_url")
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
    />
  );
}
