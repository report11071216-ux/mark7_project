import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getAttendanceDate, calculateStreak } from "@/lib/attendance";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import { normalizeLayout } from "@/lib/guild-layout-config";
import { getShowcaseResetBoundary } from "@/lib/showcase";
import GuildHomeLayout from "@/components/guild/GuildHomeLayout";

type Props = { params: { code: string } };

export default async function GuildHomePage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();

  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("guilds")
      .select("id, name, code, description, total_points, member_count, max_members, logo_url, is_recruiting, server")
      .eq("code", code)
      .single(),
  ]);

  if (!user || !guild) notFound();

  const showcaseBoundary = getShowcaseResetBoundary();

  const [
    { data: myAttendances },
    { data: allMembers },
    { data: posts },
    { data: rawRaids },
    { data: themeRow },
    { data: myMembership },
    indexResult,
    imagesResult,
    weaknessesResult,
    { data: showcaseToday },
  ] = await Promise.all([
    supabase.from("attendances").select("attendance_date").eq("guild_id", guild.id).eq("user_id", user.id).order("attendance_date", { ascending: false }).limit(60),
    supabase.from("guild_members").select("user_id, points, role, joined_at, profiles(username, avatar_url, last_seen_at, equipped_mark_id, equipped_card_id)").eq("guild_id", guild.id).order("joined_at", { ascending: false }),
    supabase.from("posts").select("id, title, created_at, is_notice, author:profiles(username)").eq("guild_id", guild.id).order("is_notice", { ascending: false }).order("created_at", { ascending: false }).limit(5),
    supabase.from("raids").select("id, title, image_url, gold_normal, gold_hard, gold_nightmare").eq("guild_id", guild.id).order("created_at", { ascending: false }).limit(12),
    supabase.from("guild_themes").select("layout_config, welcome_message, primary_color, background_color, banner_url").eq("guild_id", guild.id).maybeSingle(),
    supabase.from("guild_members").select("role").eq("guild_id", guild.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_settings").select("value").eq("key", "current_guardian_index").maybeSingle(),
    supabase.from("platform_settings").select("value").eq("key", "guardian_images").maybeSingle(),
    supabase.from("platform_settings").select("value").eq("key", "guardian_weaknesses").maybeSingle(),
    supabase.from("guild_showcases").select("id").eq("guild_id", guild.id).gte("created_at", showcaseBoundary).limit(1),
  ]);

  const attendanceDates = (myAttendances ?? []).map((a) => a.attendance_date);
  const today = getAttendanceDate();
  const alreadyAttended = attendanceDates.includes(today);
  const streak = calculateStreak(attendanceDates);
  const totalAttendances = attendanceDates.length;

  const members = (allMembers ?? []) as any[];
  const isStaff = ["master", "submaster"].includes(myMembership?.role ?? "");
  const showcaseUploadedToday = (showcaseToday ?? []).length > 0;

  // ── 멤버들의 장착 마크/프로필카드 이미지 조회 ──
  const equippedPurchaseIds: string[] = [];
  for (const m of members) {
    const p = m.profiles;
    if (p?.equipped_mark_id) equippedPurchaseIds.push(p.equipped_mark_id);
    if (p?.equipped_card_id) equippedPurchaseIds.push(p.equipped_card_id);
  }

  let markUrlByPurchase: { [key: string]: string | null } = {};
  let frameUrlByPurchase: { [key: string]: string | null } = {};
  if (equippedPurchaseIds.length > 0) {
    const uniqueIds = Array.from(new Set(equippedPurchaseIds));
    const { data: purchaseRows } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", uniqueIds);

    const itemIds = Array.from(
      new Set((purchaseRows ?? []).map((p) => p.item_id).filter(Boolean))
    ) as string[];

    let itemMap: { [key: string]: { image_url: string | null; frame_url: string | null } } = {};
    if (itemIds.length > 0) {
      const { data: itemRows } = await supabase
        .from("shop_items")
        .select("id, image_url, frame_url")
        .in("id", itemIds);
      for (const it of itemRows ?? []) {
        itemMap[it.id] = { image_url: it.image_url, frame_url: it.frame_url };
      }
    }

    for (const pr of purchaseRows ?? []) {
      if (!pr.item_id) continue;
      const it = itemMap[pr.item_id];
      markUrlByPurchase[pr.id] = it?.image_url ?? null;
      frameUrlByPurchase[pr.id] = it?.frame_url ?? null;
    }
  }

  const markUrlOf = (p: any): string | null => {
    if (!p?.equipped_mark_id) return null;
    return markUrlByPurchase[p.equipped_mark_id] ?? null;
  };
  const cardUrlOf = (p: any): string | null => {
    if (!p?.equipped_card_id) return null;
    return frameUrlByPurchase[p.equipped_card_id] ?? null;
  };

  const columns = normalizeLayout(themeRow?.layout_config);

  const primaryColor = themeRow?.primary_color ?? "#7c3aed";
  const backgroundColor = themeRow?.background_color ?? "#09090b";
  const bannerUrl = themeRow?.banner_url ?? null;

  const guardianIndex = Number(indexResult.data?.value ?? 0);
  const guardianImages = (imagesResult.data?.value ?? {}) as { [key: string]: string };
  const guardianWeaknessesAll = (weaknessesResult.data?.value ?? {}) as { [key: string]: { name: string; color: string }[] };
  const guardianImageUrl = guardianImages[String(guardianIndex)] ?? null;
  const weaknesses = Array.isArray(guardianWeaknessesAll[String(guardianIndex)])
    ? guardianWeaknessesAll[String(guardianIndex)]
    : [];

  const recentMembers = members.slice(0, 7).map((m) => ({
    user_id: m.user_id, points: m.points ?? 0,
    joined_at: m.joined_at,
    profiles: m.profiles
      ? {
          username: m.profiles.username ?? null,
          avatar_url: m.profiles.avatar_url ?? null,
          mark_url: markUrlOf(m.profiles),
          card_url: cardUrlOf(m.profiles),
        }
      : null,
  }));

  const rankingMembers = [...members]
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .map((m) => ({
      user_id: m.user_id, points: m.points ?? 0, role: m.role,
      profiles: m.profiles
        ? {
            username: m.profiles.username ?? null,
            avatar_url: m.profiles.avatar_url ?? null,
            mark_url: markUrlOf(m.profiles),
            card_url: cardUrlOf(m.profiles),
          }
        : null,
    }));

  const onlineMembers = members.map((m) => ({
    user_id: m.user_id,
    last_seen_at: m.profiles?.last_seen_at ?? null,
    profiles: m.profiles
      ? {
          username: m.profiles.username ?? null,
          avatar_url: m.profiles.avatar_url ?? null,
          mark_url: markUrlOf(m.profiles),
          card_url: cardUrlOf(m.profiles),
        }
      : null,
  }));

  const noticePosts = (posts ?? []).map((p: any) => ({
    id: p.id, title: p.title, created_at: p.created_at,
    is_notice: p.is_notice ?? false,
    author: p.author ? { username: p.author.username ?? null } : null,
  }));

  const raids = (rawRaids ?? []).map((r) => ({
    id: r.id, title: r.title, image_url: r.image_url,
    gold_normal: r.gold_normal ?? 0,
    gold_hard: r.gold_hard ?? 0,
    gold_nightmare: r.gold_nightmare ?? 0,
  }));

  const layoutData: GuildLayoutData = {
    guild: {
      id: guild.id, name: guild.name, code: guild.code,
      description: guild.description ?? null,
      total_points: guild.total_points ?? 0,
      member_count: guild.member_count ?? 0,
      max_members: (guild as any).max_members ?? 50,
      logo_url: (guild as any).logo_url ?? null,
      is_recruiting: (guild as any).is_recruiting ?? false,
      server: (guild as any).server ?? null,
    },
    attendanceDates, alreadyAttended, streak, totalAttendances,
    recentMembers, rankingMembers, onlineMembers, noticePosts,
    raidList: [],
    raids,
    welcomeMessage: themeRow?.welcome_message ?? null,
    guardianIndex, guardianImageUrl, weaknesses,
    primaryColor,
    backgroundColor,
    bannerUrl,
  };

  return (
    <div className="min-h-screen">
      <GuildHomeLayout
        data={layoutData}
        guildCode={guild.code}
        columns={columns}
        isStaff={isStaff}
        showcaseUploadedToday={showcaseUploadedToday}
      />
    </div>
  );
}
