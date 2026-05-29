import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildChatRoom, { type ChatMessage, type ChatMember } from "@/components/guild/GuildChatRoom";
export const dynamic = "force-dynamic";
type Props = { params: { code: string } };
export default async function GuildChatPage({ params }: Props) {
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
  const [{ data: rawMembers }, { data: rawMessages }, { data: themeRow }] = await Promise.all([
    supabase
      .from("guild_members")
      .select("user_id, profiles(username, avatar_url, equipped_mark_id)")
      .eq("guild_id", guild.id),
    supabase
      .from("guild_messages")
      .select("id, user_id, content, created_at, message_type, sticker_url")
      .eq("guild_id", guild.id)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("guild_themes")
      .select("equipped_sticker_sets")
      .eq("guild_id", guild.id)
      .maybeSingle(),
  ]);
  const membersRaw = (rawMembers ?? []) as any[];
  const equippedPurchaseIds: string[] = [];
  for (const m of membersRaw) {
    if (m.profiles?.equipped_mark_id) {
      equippedPurchaseIds.push(m.profiles.equipped_mark_id);
    }
  }
  let markUrlByPurchase: { [key: string]: string | null } = {};
  if (equippedPurchaseIds.length > 0) {
    const uniqueIds = Array.from(new Set(equippedPurchaseIds));
    const { data: purchaseRows } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", uniqueIds);
    const itemIds = Array.from(
      new Set((purchaseRows ?? []).map((p) => p.item_id).filter(Boolean))
    ) as string[];
    let itemImageMap: { [key: string]: string | null } = {};
    if (itemIds.length > 0) {
      const { data: itemRows } = await supabase
        .from("shop_items")
        .select("id, image_url")
        .in("id", itemIds);
      for (const it of itemRows ?? []) {
        itemImageMap[it.id] = it.image_url;
      }
    }
    for (const pr of purchaseRows ?? []) {
      if (!pr.item_id) continue;
      markUrlByPurchase[pr.id] = itemImageMap[pr.item_id] ?? null;
    }
  }
  const markUrlOf = (markId: string | null | undefined): string | null => {
    if (!markId) return null;
    return markUrlByPurchase[markId] ?? null;
  };
  const members: ChatMember[] = membersRaw.map((m) => ({
    user_id: m.user_id,
    username: m.profiles?.username ?? "익명",
    avatar_url: m.profiles?.avatar_url ?? null,
    mark_url: markUrlOf(m.profiles?.equipped_mark_id),
  }));
  const messages: ChatMessage[] = (rawMessages ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    message_type: (m as any).message_type ?? "text",
    sticker_url: (m as any).sticker_url ?? null,
  }));

  // ── 장착된 이모티콘팩의 이모티콘 목록 (피커용) ──
  const equippedSets: string[] = Array.isArray(themeRow?.equipped_sticker_sets)
    ? (themeRow!.equipped_sticker_sets as string[]) : [];
  let availableStickers: string[] = [];
  if (equippedSets.length > 0) {
    const { data: stickerRows } = await supabase
      .from("stickers")
      .select("image_url, sort_order, shop_item_id")
      .in("shop_item_id", equippedSets)
      .order("sort_order", { ascending: true });
    availableStickers = (stickerRows ?? []).map((s) => s.image_url);
  }

  return (
    <GuildChatRoom
      guildId={guild.id}
      guildCode={guild.code}
      guildName={guild.name}
      currentUserId={user.id}
      members={members}
      initialMessages={messages}
      availableStickers={availableStickers}
    />
  );
}
