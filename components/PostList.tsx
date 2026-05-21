// components/PostList.tsx 교체
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils/time";

type Props = {
  guildId?: string | null;
  category?: string;
  limit?: number;
};

export default async function PostList({
  guildId = null,
  category,
  limit = 20,
}: Props) {
  const supabase = await createClient(); // ← await 추가

  let query = supabase
    .from("posts")
    .select(
      `
      id, title, content, view_count, like_count, is_notice, category, created_at,
      profiles (username, avatar_url),
      comments (id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (guildId === null) {
    query = query.is("guild_id", null);
    if (category) {
      query = query.eq("category", category);
    }
  } else {
    query = query.eq("guild_id", guildId);
  }

  const { data: posts } = await query;

  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow">
        <div className="mb-3 text-5xl">📝</div>
        <p className="text-gray-600">
          아직 게시글이 없어요. 첫 글을 작성해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow">
      {posts.map((post: any) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="block p-4 transition hover:bg-gray-50"
        >
          <div className="flex items-start gap-3">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.username}
                className="h-10 w-10 flex-shrink-0 rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                👤
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {post.is_notice && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    공지
                  </span>
                )}
                {!guildId && post.category === "recruit" && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                    🏰 길드모집
                  </span>
                )}
                <h3 className="truncate font-semibold text-gray-900">
                  {post.title}
                </h3>
              </div>
              <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">
                {post.content}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span className="font-medium text-gray-700">
                  {post.profiles?.username || "익명"}
                </span>
                <span>{timeAgo(post.created_at)}</span>
                <span>👁 {post.view_count}</span>
                <span>💬 {post.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
