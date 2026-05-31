import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildShop, { type ShopItem } from "@/components/guild/shop/GuildShop";
import { type MegaphoneItem } from "@/components/guild/shop/MegaphoneInventory";
export const dynamic = "force-dynamic";
type Props = { params: { code: string } };
export default async function GuildShopPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();
  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, name, code, total_points").eq("code", code).single(),
  ]);
  if (!user || !guild) notFound();
  const { data: membership } = await supabase
    .from("guild_members")
    .select("role, points")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();
  const [{ data: items }, { data: myPurchases }, { data: guildPurchases }, { data: megaphonePurchases }, { data: packSetting }] = await Promise.all([
    supabase
      .from("shop_items")
      .select("id, shop_type, category, name, description, price, image_url, duration_hours")
      .eq("is_active", true)
      .order("price", { ascending: true }),
    // 내가 산 것 (개인 상품 보유 판정용)
    supabase
      .from("purchases")
      .select("item_id")
      .eq("buyer_id", user.id),
    // 우리 길드가 산 것 (길드 상품 보유 판정용)
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

  // 소비성 상품(확성기 등 duration 있는 것)은 보유 판정에서 제외
  const consumableItemIds = new Set(
    (items ?? []).filter((it) => it.duration_hours !== null).map((it) => it.id)
  );

  // 상품별 shop_type 맵
  const itemTypeMap = new Map((items ?? []).map((it) => [it.id, it.shop_type]));

  // 내가 산 item_id (개인)
  const myItemIds = new Set(
    (myPurchases ?? []).map((p) => p.item_id).filter(Boolean) as string[]
  );
  // 길드가 산 item_id
  const guildItemIds = new Set(
    (guildPurchases ?? []).map((p) => p.item_id).filter(Boolean) as string[]
  );

  // 보유 판정: 활동샵(개인) 상품은 내 구매로만, 길드샵 상품은 길드 구매로
  const ownedItemIds = Array.from(
    new Set(
      (items ?? [])
        .filter((it) => {
          if (consumableItemIds.has(it.id)) return false; // 소비성은 항상 재구매 가능
          if (it.shop_type === "guild") {
            return guildItemIds.has(it.id);
          }
          // activity (개인)
          return myItemIds.has(it.id);
        })
        .map((it) => it.id)
    )
  ) as string[];

  const isStaff = membership.role === "master" || membership.role === "submaster";

  const packRaw = packSetting?.value as { price: number; active: boolean } | null;
  const cardPackPrice = packRaw?.price ?? 10;
  const cardPackActive = packRaw?.active ?? false;

  return (
    <GuildShop
      guildCode={guild.code}
      guildId={guild.id}
      guildName={guild.name}
      guildPoints={guild.total_points ?? 0}
      myPoints={membership.points ?? 0}
      myRole={membership.role}
      isStaff={isStaff}
      items={shopItems}
      ownedItemIds={ownedItemIds}
      megaphoneItems={megaphoneItems}
      cardPackPrice={cardPackPrice}
      cardPackActive={cardPackActive}
    />
  );
}
