import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildShop, { type ShopItem } from "@/components/guild/shop/GuildShop";
import { type NameplateProduct } from "@/components/guild/shop/NameplateShop";
import { type MegaphoneItem } from "@/components/guild/shop/MegaphoneInventory";
export const dynamic = "force-dynamic";
type Props = { params: { code: string } };
export default async function GuildShopPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();
  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, name, code, total_points, server, member_count, max_members").eq("code", code).single(),
  ]);
  if (!user || !guild) notFound();
  const { data: membership } = await supabase
    .from("guild_members")
    .select("role, points")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();
  const [{ data: items }, { data: myPurchases }, { data: guildPurchases }, { data: megaphonePurchases }, { data: packSetting }, { data: themeRow }, { data: nameplateCards }, { data: ownedRows }] = await Promise.all([
    supabase
      .from("shop_items")
      .select("id, shop_type, category, name, description, price, image_url, duration_hours")
      .eq("is_active", true)
      .order("price", { ascending: true }),
    supabase
      .from("purchases")
      .select("item_id")
      .eq("buyer_id", user.id),
    supabase
      .from("purchases")
      .select("item_id")
      .eq("guild_id", guild.id),
    supabase
      .from("purchases")
      .select("id, item_id, item_name, item_category, activated_at, expires_at, megaphone_message")
      .eq("guild_id", guild.id)
      .eq("item_category", "확성기")
      .order("created_at", { ascending: false }),
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "card_pack")
      .maybeSingle(),
    supabase
      .from("guild_themes")
      .select("equipped_mark_id")
      .eq("guild_id", guild.id)
      .maybeSingle(),
    supabase
      .from("guild_nameplate_cards")
      .select("id, name, description, image_url, design, price")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("guild_owned_nameplates")
      .select("card_id")
      .eq("guild_id", guild.id),
  ]);
  const shopItems: ShopItem[] = (items ?? []).map((it) => ({
    id: it.id,
    shop_type: it.shop_type,
    category: it.category,
    name: it.name,
    description: it.description,
    price: it.price,
    image_url: it.image_url,
    duration_hours: it.duration_hours,
  }));
  const durationMap = new Map(
    (items ?? [])
      .filter((it) => it.category === "확성기")
      .map((it) => [it.id, it.duration_hours])
  );
  const megaphoneItems: MegaphoneItem[] = (megaphonePurchases ?? []).map((p) => ({
    id: p.id,
    item_name: p.item_name,
    duration_hours: durationMap.get(p.item_id) ?? null,
    activated_at: p.activated_at,
    expires_at: p.expires_at,
    megaphone_message: p.megaphone_message,
  }));

  const consumableItemIds = new Set(
    (items ?? []).filter((it) => it.duration_hours !== null).map((it) => it.id)
  );

  const myItemIds = new Set(
    (myPurchases ?? []).map((p) => p.item_id).filter(Boolean) as string[]
  );
  const guildItemIds = new Set(
    (guildPurchases ?? []).map((p) => p.item_id).filter(Boolean) as string[]
  );

  const ownedItemIds = Array.from(
    new Set(
      (items ?? [])
        .filter((it) => {
          if (consumableItemIds.has(it.id)) return false;
          if (it.shop_type === "guild") {
            return guildItemIds.has(it.id);
          }
          return myItemIds.has(it.id);
        })
        .map((it) => it.id)
    )
  ) as string[];

  const isStaff = membership.role === "master" || membership.role === "submaster";

  const packRaw = packSetting?.value as { price: number; active: boolean } | null;
  const cardPackPrice = packRaw?.price ?? 10;
  const cardPackActive = packRaw?.active ?? false;

  // 명함 카드 상품
  const nameplateProducts: NameplateProduct[] = (nameplateCards ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    imageUrl: c.image_url,
    design: (c.design ?? {}) as { [effect: string]: any },
    price: c.price,
  }));
  const ownedNameplateIds = Array.from(
    new Set((ownedRows ?? []).map((r) => r.card_id).filter(Boolean))
  ) as string[];

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

  return (
    <GuildShop
      guildCode={guild.code}
      guildId={guild.id}
      guildName={guild.name}
      guildServer={guild.server ?? null}
      guildPoints={guild.total_points ?? 0}
      myPoints={membership.points ?? 0}
      myRole={membership.role}
      isStaff={isStaff}
      items={shopItems}
      ownedItemIds={ownedItemIds}
      megaphoneItems={megaphoneItems}
      cardPackPrice={cardPackPrice}
      cardPackActive={cardPackActive}
      guildMarkUrl={markUrl}
      memberCount={guild.member_count ?? 0}
      maxMembers={guild.max_members ?? 50}
      nameplateProducts={nameplateProducts}
      ownedNameplateIds={ownedNameplateIds}
    />
  );
}
