import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClassRole } from "@/lib/lostark-classes";
import MembersList, { type MemberRow } from "@/components/guild/MembersList";
import { getNicknameColors } from "@/lib/nickname-color";
export const dynamic = "force-dynamic";

function startOfMonthISO(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return first.toISOString().split("T")[0];
}

export default async function MembersPage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const upperCode = params.code.toUpperCase();

  const { data: guild } = await supabase
    .from("guilds")
    .select("id, code, name")
    .eq("code", upperCode)
    .maybeSingle();
  if (!guild) notFound();

  const [{ data: themeRow }, { data: memberRows }] = await Promise.all([
    supabase
      .from("guild_themes")
      .select("primary_color, background_color")
      .eq("guild_id", guild.id)
      .maybeSingle(),
    supabase
      .from("guild_members")
      .select("user_id, role, points, joined_at, title")
      .eq("guild_id", guild.id),
  ]);

  const primaryColor = themeRow?.primary_color ?? "#7c3aed";
  const backgroundColor = themeRow?.background_color ?? "#09090b";

  const members = (memberRows ?? []) as any[];
  const userIds = members.map((m) => m.user_id);

  // 현재 유저의 길드 내 역할 (직위 설정 권한 판단용)
  const myRole = (members.find((m) => m.user_id === user.id)?.role as string) ?? "member";

  // 프로필 (대표 캐릭터 + 코스메틱)
  let profileRows: any[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, main_character_name, character_class, item_level, equipped_mark_id, equipped_card_id")
      .in("id", userIds);
    profileRows = data || [];
  }
  const profileMap: { [key: string]: any } = {};
  for (const p of profileRows) profileMap[p.id] = p;

  // 코스메틱 — 마크/카드 이미지
  const purchaseIds = Array.from(
    new Set(profileRows.flatMap((p) => [p.equipped_mark_id, p.equipped_card_id]).filter(Boolean))
  ) as string[];
  const markByPurchase: { [key: string]: string | null } = {};
  const frameByPurchase: { [key: string]: string | null } = {};
  if (purchaseIds.length > 0) {
    const { data: purchases } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", purchaseIds);
    const itemIds = Array.from(
      new Set((purchases || []).map((p) => p.item_id).filter(Boolean))
    ) as string[];
    const itemMap: { [key: string]: { image_url: string | null; frame_url: string | null } } = {};
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from("shop_items")
        .select("id, image_url, frame_url")
        .in("id", itemIds);
      for (const it of items || []) {
        itemMap[it.id] = { image_url: it.image_url, frame_url: it.frame_url };
      }
    }
    for (const pu of purchases || []) {
      if (!pu.item_id) continue;
      const it = itemMap[pu.item_id];
      if (!it) continue;
      markByPurchase[pu.id] = it.image_url;
      frameByPurchase[pu.id] = it.frame_url;
    }
  }

  // 누적 출석 횟수 (user별 카운트)
  const attendanceCount: { [key: string]: number } = {};
  if (userIds.length > 0) {
    const { data: atts } = await supabase
      .from("attendances")
      .select("user_id")
      .eq("guild_id", guild.id)
      .in("user_id", userIds);
    for (const a of atts || []) {
      attendanceCount[a.user_id] = (attendanceCount[a.user_id] || 0) + 1;
    }
  }

  // 완료된 레이드 참여 횟수 (user별)
  const raidCount: { [key: string]: number } = {};
  const { data: completedSchedules } = await supabase
    .from("raid_schedules")
    .select("id")
    .eq("guild_id", guild.id)
    .eq("completed", true);
  const completedIds = (completedSchedules || []).map((s) => s.id);
  if (completedIds.length > 0) {
    const { data: parts } = await supabase
      .from("raid_participants")
      .select("user_id")
      .in("schedule_id", completedIds);
    for (const p of parts || []) {
      raidCount[p.user_id] = (raidCount[p.user_id] || 0) + 1;
    }
  }

  // 멤버별 닉네임 색 (장착 카드 등급)
  const nicknameColors = await getNicknameColors(userIds);
  function markOf(uid: string): string {
    const pr = profileMap[uid];
    if (!pr) return "";
    if (pr.equipped_mark_id && markByPurchase[pr.equipped_mark_id]) {
      return markByPurchase[pr.equipped_mark_id] as string;
    }
    return pr.avatar_url || "";
  }
  function cardBgOf(uid: string): string {
    const pr = profileMap[uid];
    if (!pr) return "";
    if (pr.equipped_card_id && frameByPurchase[pr.equipped_card_id]) {
      return frameByPurchase[pr.equipped_card_id] as string;
    }
    return "";
  }

  const rows: MemberRow[] = members.map((m) => {
    const pr = profileMap[m.user_id];
    const cls = pr?.character_class ? String(pr.character_class) : "";
    const name = pr?.main_character_name || pr?.username || "길드원";
    const ilvl = pr?.item_level == null ? null : Number(pr.item_level);
    return {
      userId: m.user_id,
      name,
      characterClass: cls,
      role: cls ? getClassRole(cls) : null,
      itemLevel: Number.isFinite(ilvl as number) ? (ilvl as number) : null,
      guildRole: (m.role as string) || "member",
      title: (m.title as string) || null,
      points: Number(m.points) || 0,
      joinedAt: (m.joined_at as string) || "",
      attendanceCount: attendanceCount[m.user_id] || 0,
      raidCount: raidCount[m.user_id] || 0,
      markUrl: markOf(m.user_id),
      cardBgUrl: cardBgOf(m.user_id),
      nicknameColor: nicknameColors[m.user_id] ?? null,
    };
  });
  return (
    <MembersList
      guildCode={guild.code}
      guildId={guild.id}
      myRole={myRole}
      guildName={guild.name}
      memberCount={rows.length}
      members={rows}
      primaryColor={primaryColor}
      backgroundColor={backgroundColor}
    />
  );
}
