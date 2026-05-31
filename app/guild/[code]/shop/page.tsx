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
  const [{ data: items }, { data: purchases }, { data: megaphonePurchases }, { data: packSetting }] = await Promise.all([
    supabase
      .from("shop_items")
      .select("id, shop_type, category, name, description, price, image_url, duration_hours")
      .eq("is_active", true)
      .order("price", { ascending: true }),
    supabase
      .from("purchases")
      .select("item_id")
      .or(`buyer_id.eq.${user.id},guild_id.eq.${guild.id}`),
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
  const consumableItemIds = new Set(
    (items ?? []).filter((it) => it.duration_hours !== null).map((it) => it.id)
  );
  const ownedItemIds = Array.from(
    new Set(
      (purchases ?? [])
        .map((p) => p.item_id)
        .filter((id) => id && !consumableItemIds.has(id))
    )
  ) as string[];
  const isStaff = membership.role === "master" || membership.role === "submaster";

  // 11연 뽑기권 패키지 설정
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
