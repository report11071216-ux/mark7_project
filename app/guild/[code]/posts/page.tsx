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
    .select("id, title, is_notice, category, view_count, like_count, created_at, author_id")
    .eq("guild_id", guild.id)
    .order("is_notice", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = rawPosts ?? [];
  const postIds = posts.map((p) => p.id);

  // 작성자 이름
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

  // 이미지: 글별 대표 썸네일 + 개수
  let thumbMap: { [key: string]: string } = {};
  let countMap: { [key: string]: number } = {};
  if (postIds.length > 0) {
    const { data: images } = await supabase
      .from("post_images")
      .select("post_id, url, sort_order")
      .in("post_id", postIds)
      .order("sort_order", { ascending: true });

    for (const img of images ?? []) {
      countMap[img.post_id] = (countMap[img.post_id] ?? 0) + 1;
      if (!thumbMap[img.post_id]) thumbMap[img.post_id] = img.url; // 첫 장(sort_order 최소)
    }
  }

  const guildPosts: GuildPost[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    is_notice: p.is_notice ?? false,
    category: p.category ?? "free",
    view_count: p.view_count ?? 0,
    like_count: p.like_count ?? 0,
    created_at: p.created_at,
    author_name: p.author_id ? authorMap[p.author_id] ?? "Unknown" : "Unknown",
    thumbnail: thumbMap[p.id] ?? null,
    image_count: countMap[p.id] ?? 0,
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
