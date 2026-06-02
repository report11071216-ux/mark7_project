"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── (1) 레이드 도감 등록 ──
type NewRaidEntryInput = {
  title: string;
  image_url: string | null;
  gold_normal: number;
  gold_hard: number;
  gold_nightmare: number;
  rec_item_level: number | null;
  rec_combat_power: number | null;
  reward_materials: string;
};

export async function createRaidEntry(guildCode: string, input: NewRaidEntryInput) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isStaff = membership?.role === "master" || membership?.role === "submaster";
  if (!isStaff) {
    return { success: false, error: "마스터·부마스터만 레이드를 등록할 수 있습니다" };
  }

  if (!input.title.trim()) {
    return { success: false, error: "레이드명을 입력하세요" };
  }

  const { data: inserted, error } = await supabase
    .from("raids")
    .insert({
      guild_id: guild.id,
      created_by: user.id,
      title: input.title.trim(),
      image_url: input.image_url,
      gold_normal: input.gold_normal,
      gold_hard: input.gold_hard,
      gold_nightmare: input.gold_nightmare,
      rec_item_level: input.rec_item_level,
      rec_combat_power: input.rec_combat_power,
      reward_materials: input.reward_materials.trim(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message ?? "등록 실패" };
  }

  revalidatePath(`/guild/${code}/raids`);
  return { success: true, raidId: inserted.id };
}

// ── 레이드 도감 수정 ──
type UpdateRaidEntryInput = {
  raidId: string;
  gold_normal: number;
  gold_hard: number;
  gold_nightmare: number;
  rec_item_level: number | null;
  rec_combat_power: number | null;
  reward_materials: string;
};

export async function updateRaidEntry(guildCode: string, input: UpdateRaidEntryInput) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isStaff = membership?.role === "master" || membership?.role === "submaster";
  if (!isStaff) {
    return { success: false, error: "마스터·부마스터만 수정할 수 있습니다" };
  }

  const { error } = await supabase
    .from("raids")
    .update({
      gold_normal: input.gold_normal,
      gold_hard: input.gold_hard,
      gold_nightmare: input.gold_nightmare,
      rec_item_level: input.rec_item_level,
      rec_combat_power: input.rec_combat_power,
      reward_materials: input.reward_materials.trim(),
    })
    .eq("id", input.raidId)
    .eq("guild_id", guild.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/guild/${code}`);
  return { success: true };
}

// ── 레이드 도감 삭제 ──
export async function deleteRaidEntry(guildCode: string, raidId: string) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isStaff = membership?.role === "master" || membership?.role === "submaster";
  if (!isStaff) {
    return { success: false, error: "마스터·부마스터만 삭제할 수 있습니다" };
  }

  const { error } = await supabase
    .from("raids")
    .delete()
    .eq("id", raidId)
    .eq("guild_id", guild.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/guild/${code}/raids`);
  return { success: true };
}

// ── (2) 모달용: 레이드 상세 + 공략 조회 ──
export type RaidDetail = {
  id: string;
  title: string;
  image_url: string | null;
  gold_normal: number | null;
  gold_hard: number | null;
  gold_nightmare: number | null;
  rec_item_level: number | null;
  rec_combat_power: number | null;
  reward_materials: string | null;
};

export type RaidGuide = {
  guide_type: string;
  content: string;
  image_urls: string[];
  updated_at: string | null;
  updated_by_name: string | null;
};

export async function getRaidDetail(guildCode: string, raidId: string) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" } as const;
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" } as const;
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return { success: false, error: "길드 멤버만 볼 수 있습니다" } as const;
  }

  const { data: raid } = await supabase
    .from("raids")
    .select("id, title, image_url, gold_normal, gold_hard, gold_nightmare, rec_item_level, rec_combat_power, reward_materials")
    .eq("id", raidId)
    .eq("guild_id", guild.id)
    .maybeSingle();
  if (!raid) {
    return { success: false, error: "레이드를 찾을 수 없습니다" } as const;
  }

  const { data: guidesRaw } = await supabase
    .from("raid_guides")
    .select("guide_type, content, image_urls, updated_at, updated_by")
    .eq("guild_id", guild.id)
    .eq("raid_id", raidId);

  const editorIds = Array.from(
    new Set((guidesRaw ?? []).map((g) => g.updated_by).filter(Boolean))
  ) as string[];
  let nameMap: { [key: string]: string } = {};
  if (editorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", editorIds);
    for (const p of profs ?? []) nameMap[p.id] = p.username ?? "Unknown";
  }

  const guides: RaidGuide[] = (guidesRaw ?? []).map((g) => ({
    guide_type: g.guide_type,
    content: g.content ?? "",
    image_urls: g.image_urls ?? [],
    updated_at: g.updated_at ?? null,
    updated_by_name: g.updated_by ? nameMap[g.updated_by] ?? null : null,
  }));

  return {
    success: true,
    raid: raid as RaidDetail,
    guides,
    isStaff: membership.role === "master" || membership.role === "submaster",
  } as const;
}

// ── (3) 공략 저장 (길드원 누구나, upsert) ──
type SaveGuideInput = {
  raidId: string;
  guideType: string;
  content: string;
  imageUrls: string[];
};

export async function saveRaidGuide(guildCode: string, input: SaveGuideInput) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return { success: false, error: "길드 멤버만 공략을 쓸 수 있습니다" };
  }

  const type = input.guideType === "leader" ? "leader" : "normal";
  const urls = (input.imageUrls ?? []).filter(Boolean).slice(0, 10);

  const { error } = await supabase
    .from("raid_guides")
    .upsert(
      {
        raid_id: input.raidId,
        guild_id: guild.id,
        guide_type: type,
        content: input.content.trim(),
        image_urls: urls,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "raid_id,guild_id,guide_type" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/guild/${code}`);
  return { success: true };
}
// ── (4) 레이드 도감 순서 저장 (스태프만) ──
export async function updateRaidOrder(guildCode: string, orderedIds: string[]) {
  const supabase = await createClient();
  const code = guildCode.toUpperCase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (!guild) {
    return { success: false, error: "길드를 찾을 수 없습니다" };
  }

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isStaff = membership?.role === "master" || membership?.role === "submaster";
  if (!isStaff) {
    return { success: false, error: "마스터·부마스터만 순서를 바꿀 수 있습니다" };
  }

  // 받은 순서대로 sort_order 1, 2, 3... 부여
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("raids")
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i])
      .eq("guild_id", guild.id);
    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath(`/guild/${code}/raids`);
  revalidatePath(`/guild/${code}`);
  return { success: true };
}
