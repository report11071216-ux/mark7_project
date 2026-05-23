import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildShop, { type ShopItem } from "@/components/guild/shop/GuildShop";

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

  const [{ data: items }, { data: purchases }] = await Promise.all([
    supabase
      .from("shop_items")
      .select("id, shop_type, category, name, description, price, image_url, duration_hours")
      .eq("is_active", true)
      .order("price", { ascending: true }),
    supabase
      .from("purchases")
      .select("item_id")
      .or(`buyer_id.eq.${user.id},guild_id.eq.${guild.id}`),
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

  const ownedItemIds = Array.from(
    new Set((purchases ?? []).map((p) => p.item_id).filter(Boolean))
  ) as string[];

  const isStaff = membership.role === "master" || membership.role === "submaster";

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
    />
  );
}
