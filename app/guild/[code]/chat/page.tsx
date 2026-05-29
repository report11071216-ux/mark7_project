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

  const [{ data: rawMembers }, { data: rawMessages }] = await Promise.all([
    supabase
      .from("guild_members")
      .select("user_id, profiles(username, avatar_url, equipped_mark_id)")
      .eq("guild_id", guild.id),
    supabase
      .from("guild_messages")
      .select("id, user_id, content, created_at")
      .eq("guild_id", guild.id)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  const membersRaw = (rawMembers ?? []) as any[];

  // ── 장착한 개인 마크 이미지 조회 (길드 홈과 동일 로직) ──
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
  }));

  return (
    <GuildChatRoom
      guildId={guild.id}
      guildCode={guild.code}
      guildName={guild.name}
      currentUserId={user.id}
      members={members}
      initialMessages={messages}
    />
  );
}
