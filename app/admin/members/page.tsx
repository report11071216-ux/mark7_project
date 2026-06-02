import { createClient } from "@/lib/supabase/server";
import MemberAdminList, { type AdminMemberRow } from "@/components/admin/MemberAdminList";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const supabase = await createClient();

  // 회원 최근 200명
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, last_seen_at, is_platform_admin, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = profiles ?? [];
  const userIds = rows.map((p) => p.id);

  // 이 회원들의 길드 멤버십 + 길드명
  let guildsByUser = new Map<string, { name: string; role: string }[]>();
  if (userIds.length > 0) {
    const { data: memberships } = await supabase
      .from("guild_members")
      .select("user_id, role, guilds(name)")
      .in("user_id", userIds);

    for (const m of (memberships ?? []) as any[]) {
      const g = Array.isArray(m.guilds) ? m.guilds[0] : m.guilds;
      if (!g) continue;
      const list = guildsByUser.get(m.user_id) ?? [];
      list.push({ name: g.name, role: m.role });
      guildsByUser.set(m.user_id, list);
    }
  }

  const list: AdminMemberRow[] = rows.map((p) => ({
    id: p.id,
    name: p.username ?? "이름 없음",
    avatarUrl: p.avatar_url ?? null,
    lastSeenAt: p.last_seen_at ?? null,
    isPlatformAdmin: p.is_platform_admin === true,
    createdAt: p.created_at,
    guilds: guildsByUser.get(p.id) ?? [],
  }));

  return <MemberAdminList members={list} />;
}
