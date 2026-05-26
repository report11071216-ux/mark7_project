import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildBoard, { type GuildPost } from "@/components/guild/GuildBoard";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function GuildPostsPage({ params }: Props) {
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

  const { data: rawPosts } = await supabase
    .from("posts")
    .select("id, title, is_notice, view_count, like_count, created_at, author_id")
    .eq("guild_id", guild.id)
    .order("is_notice", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = rawPosts ?? [];

  const authorIds = Array.from(
    new Set(posts.map((p) => p.author_id).filter(Boolean))
  ) as string[];

  let authorMap: { [key: string]: string } = {};
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", authorIds);
    for (const a of authors ?? []) {
      authorMap[a.id] = a.username ?? "Unknown";
    }
  }

  const guildPosts: GuildPost[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    is_notice: p.is_notice ?? false,
    view_count: p.view_count ?? 0,
    like_count: p.like_count ?? 0,
    created_at: p.created_at,
    author_name: p.author_id ? authorMap[p.author_id] ?? "Unknown" : "Unknown",
  }));

  const isStaff = membership.role === "master" || membership.role === "submaster";

  return (
    <GuildBoard
      guildCode={guild.code}
      guildName={guild.name}
      posts={guildPosts}
      isStaff={isStaff}
    />
  );
}
