import { createClient } from "@/lib/supabase/server";
import GuildAdminList, { type AdminGuildRow } from "@/components/admin/GuildAdminList";

export const dynamic = "force-dynamic";

export default async function AdminGuildsPage() {
  const supabase = await createClient();

  // 길드 최근 100개
  const { data: guilds } = await supabase
    .from("guilds")
    .select("id, code, name, server, member_count, max_members, total_exp, master_id, created_at, is_recruiting")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = guilds ?? [];

  // 마스터 이름 한 번에 조회
  const masterIds = Array.from(new Set(rows.map((g) => g.master_id).filter(Boolean))) as string[];
  let masterMap = new Map<string, string>();
  if (masterIds.length > 0) {
    const { data: masters } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", masterIds);
    masterMap = new Map((masters ?? []).map((m) => [m.id, m.username ?? "알 수 없음"]));
  }

  const list: AdminGuildRow[] = rows.map((g) => ({
    id: g.id,
    code: g.code,
    name: g.name,
    server: g.server ?? null,
    memberCount: g.member_count ?? 0,
    maxMembers: g.max_members ?? 0,
    totalExp: g.total_exp ?? 0,
    masterName: g.master_id ? (masterMap.get(g.master_id) ?? "알 수 없음") : "—",
    isRecruiting: g.is_recruiting === true,
    createdAt: g.created_at,
  }));

  return <GuildAdminList guilds={list} />;
}
