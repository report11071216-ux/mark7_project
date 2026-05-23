import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildInventory, { type InventoryItem } from "@/components/guild/GuildInventory";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function GuildInventoryPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();

  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, name, code").eq("code", code).single(),
  ]);

  if (!user || !guild) notFound();

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, item_name, item_category, price_paid, created_at, expires_at, activated_at, megaphone_message")
    .eq("guild_id", guild.id)
    .eq("shop_type", "guild")
    .order("created_at", { ascending: false });

  const items: InventoryItem[] = (purchases ?? []).map((p) => ({
    id: p.id,
    item_name: p.item_name,
    item_category: p.item_category,
    price_paid: p.price_paid,
    created_at: p.created_at,
    expires_at: p.expires_at,
    activated_at: p.activated_at,
    megaphone_message: p.megaphone_message,
  }));

  const isStaff = membership.role === "master" || membership.role === "submaster";

  return (
    <GuildInventory
      guildName={guild.name}
      items={items}
      isStaff={isStaff}
    />
  );
}
