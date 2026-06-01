import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildPostDetail from "@/components/guild/GuildPostDetail";
import GuildComments, { type GuildComment } from "@/components/guild/GuildComments";
import { getNicknameColors } from "@/lib/nickname-color";

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
    .select("id, guild_id, author_id, title, content, category, view_count, like_count, is_notice, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!post || post.guild_id !== guild.id) notFound();

  // 조회수 +1
  await supabase
    .from("posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", post.id);

  // 작성자 이름 + 내가 좋아요 눌렀는지 + 댓글 + 이미지
  const [authorResult, likeResult, commentsResult, imagesResult] = await Promise.all([
    post.author_id
      ? supabase.from("profiles").select("username").eq("id", post.author_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("comments")
      .select("id, content, created_at, author_id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("post_images")
      .select("url, sort_order")
      .eq("post_id", post.id)
      .order("sort_order", { ascending: true }),
  ]);

  const authorName = authorResult.data?.username ?? "Unknown";
  const alreadyLiked = !!likeResult.data;
  const isAuthor = post.author_id === user.id;
  const images = (imagesResult.data ?? []).map((img) => img.url);

  const rawComments = commentsResult.data ?? [];

  // 댓글 작성자 정보 (마크 포함)
  const commentAuthorIds = Array.from(
    new Set(rawComments.map((c) => c.author_id).filter(Boolean))
  ) as string[];

  let commentAuthorMap: {
    [key: string]: { username: string | null; avatar_url: string | null; mark_url: string | null };
  } = {};

  if (commentAuthorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, equipped_mark_id")
      .in("id", commentAuthorIds);

    const markPurchaseIds = Array.from(
      new Set((authors ?? []).map((a) => a.equipped_mark_id).filter(Boolean))
    ) as string[];

    let markUrlByPurchase: { [key: string]: string | null } = {};
    if (markPurchaseIds.length > 0) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id, item_id")
        .in("id", markPurchaseIds);

      const itemIds = Array.from(
        new Set((purchases ?? []).map((p) => p.item_id).filter(Boolean))
      ) as string[];

      let itemImageMap: { [key: string]: string | null } = {};
      if (itemIds.length > 0) {
        const { data: items } = await supabase
          .from("shop_items")
          .select("id, image_url")
          .in("id", itemIds);
        for (const it of items ?? []) {
          itemImageMap[it.id] = it.image_url;
        }
      }

      for (const pr of purchases ?? []) {
        if (pr.item_id) markUrlByPurchase[pr.id] = itemImageMap[pr.item_id] ?? null;
      }
    }

    for (const a of authors ?? []) {
      commentAuthorMap[a.id] = {
        username: a.username,
        avatar_url: a.avatar_url,
        mark_url: a.equipped_mark_id ? markUrlByPurchase[a.equipped_mark_id] ?? null : null,
      };
    }
  }

  // ── 닉네임 색: 글 작성자 + 댓글 작성자 ──
  const colorUserIds: string[] = [];
  if (post.author_id) colorUserIds.push(post.author_id);
  for (const c of rawComments) {
    if (c.author_id) colorUserIds.push(c.author_id);
  }
  const nicknameColors = await getNicknameColors(colorUserIds);
  const authorColor = post.author_id ? nicknameColors[post.author_id] ?? null : null;

  const comments: GuildComment[] = rawComments.map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    author_id: c.author_id,
    author_name: commentAuthorMap[c.author_id]?.username ?? "Unknown",
    author_avatar: commentAuthorMap[c.author_id]?.avatar_url ?? null,
    author_mark: commentAuthorMap[c.author_id]?.mark_url ?? null,
    author_color: c.author_id ? nicknameColors[c.author_id] ?? null : null,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <GuildPostDetail
        guildCode={guild.code}
        post={{
          id: post.id,
          title: post.title,
          content: post.content ?? "",
          category: post.category ?? "free",
          view_count: (post.view_count ?? 0) + 1,
          like_count: post.like_count ?? 0,
          is_notice: post.is_notice ?? false,
          created_at: post.created_at,
          author_name: authorName,
          images,
        }}
        authorColor={authorColor}
        isAuthor={isAuthor}
        alreadyLiked={alreadyLiked}
      />
      <div className="max-w-2xl mx-auto px-4 md:px-6 pb-24 md:pb-6">
        <GuildComments
          guildCode={guild.code}
          postId={post.id}
          currentUserId={user.id}
          comments={comments}
        />
      </div>
    </div>
  );
}
