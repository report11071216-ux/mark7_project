import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildPostDetail from "@/components/guild/GuildPostDetail";

export const dynamic = "force-dynamic";

type Props = { params: { code: string; id: string } };

export default async function GuildPostDetailPage({ params }: Props) {
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

  const { data: post } = await supabase
    .from("posts")
    .select("id, guild_id, author_id, title, content, view_count, like_count, is_notice, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!post || post.guild_id !== guild.id) notFound();

  // 조회수 +1
  await supabase
    .from("posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", post.id);

  // 작성자 이름
  let authorName = "Unknown";
  if (post.author_id) {
    const { data: author } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", post.author_id)
      .maybeSingle();
    authorName = author?.username ?? "Unknown";
  }

  const isAuthor = post.author_id === user.id;

  return (
    <GuildPostDetail
      guildCode={guild.code}
      post={{
        id: post.id,
        title: post.title,
        content: post.content ?? "",
        view_count: (post.view_count ?? 0) + 1,
        like_count: post.like_count ?? 0,
        is_notice: post.is_notice ?? false,
        created_at: post.created_at,
        author_name: authorName,
      }}
      isAuthor={isAuthor}
    />
  );
}
