"use server";

import { createClient } from "@/lib/supabase/server";

export type PublicProfile = {
  username: string | null;
  avatar_url: string | null;
  mark_url: string | null;
  card_url: string | null;
  main_character_name: string | null;
  character_class: string | null;
  server_name: string | null;
  item_level: number;
  combat_power: number;
  expedition_level: number;
  character_image_url: string | null;
};

export async function getPublicProfile(userId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, equipped_mark_id, equipped_card_id, main_character_name, character_class, server_name, item_level, combat_power, expedition_level, character_image_url")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: "프로필을 찾을 수 없습니다" };
  }

  // 장착한 마크 / 프로필카드 이미지 조회
  let markUrl: string | null = null;
  let cardUrl: string | null = null;

  const purchaseIds = [profile.equipped_mark_id, profile.equipped_card_id].filter(Boolean) as string[];
  if (purchaseIds.length > 0) {
    const { data: purchases } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", purchaseIds);

    const itemIds = Array.from(
      new Set((purchases ?? []).map((p) => p.item_id).filter(Boolean))
    ) as string[];

    let itemMap: { [key: string]: { image_url: string | null; frame_url: string | null } } = {};
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from("shop_items")
        .select("id, image_url, frame_url")
        .in("id", itemIds);
      for (const it of items ?? []) {
        itemMap[it.id] = { image_url: it.image_url, frame_url: it.frame_url };
      }
    }

    const purchaseMap = new Map((purchases ?? []).map((p) => [p.id, p.item_id]));

    if (profile.equipped_mark_id) {
      const itemId = purchaseMap.get(profile.equipped_mark_id);
      if (itemId) markUrl = itemMap[itemId]?.image_url ?? null;
    }
    if (profile.equipped_card_id) {
      const itemId = purchaseMap.get(profile.equipped_card_id);
      if (itemId) cardUrl = itemMap[itemId]?.frame_url ?? null;
    }
  }

  const result: PublicProfile = {
    username: profile.username,
    avatar_url: profile.avatar_url,
    mark_url: markUrl,
    card_url: cardUrl,
    main_character_name: profile.main_character_name,
    character_class: profile.character_class,
    server_name: profile.server_name,
    item_level: parseFloat(String(profile.item_level ?? 0)) || 0,
    combat_power: parseFloat(String(profile.combat_power ?? 0)) || 0,
    expedition_level: profile.expedition_level ?? 0,
    character_image_url: profile.character_image_url,
  };

  return { success: true, profile: result };
}
