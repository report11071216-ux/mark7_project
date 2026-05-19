import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import CommentSection from "@/components/CommentSection";
import PostDeleteButton from "@/components/PostDeleteButton";
import { incrementViewCount } from "@/app/actions/post";
import { timeAgo } from "@/lib/utils/time";

type Props = {
  params: { id: string };
};

export default async function PostDetailPage({ params }: Props) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles (id, username, avatar_url),
      guilds (id, name, code)
    `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  await incrementViewCount(params.id);

  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      id, content, created_at, author_id,
      profiles (username, avatar_url)
    `
    )
    .eq("post_id", params.id)
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthor = user?.id === post.author_id;

  const categoryLabel: Record<string, string> = {
    free: "💬 자유",
    recruit: "🏰 길드 모집",
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="mb-6 rounded-2xl bg-white p-8 shadow">
          {/* 위치 표시 */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">
              광장
            </Link>
            {post.guilds && (
              <>
                <span className="text-gray-400">/</span>
                <Link
                  href={`/g/${post.guilds.code}`}
                  className="text-blue-600 hover:underline"
                >
                  {post.guilds.name}
                </Link>
              </>
            )}
            {!post.guilds && post.category && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">
                  {categoryLabel[post.category] || post.category}
                </span>
              </>
            )}
          </div>

          <div className="mb-4 flex items-center gap-2">
            {post.is_notice && (
              <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                공지
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
          </div>

          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              {post.profiles.avatar_url ? (
                <img
                  src={post.profiles.avatar_url}
                  alt={post.profiles.username}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                  👤
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {post.profiles.username}
                </div>
                <div className="text-xs text-gray-500">
                  {timeAgo(post.created_at)} · 👁 {post.view_count}
                </div>
              </div>
            </div>

            {isAuthor && <PostDeleteButton postId={post.id} />}
          </div>

          <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
            {post.content}
          </div>
        </article>

        <CommentSection
          postId={post.id}
          comments={(comments as any) || []}
          currentUserId={user?.id || null}
        />

        <div className="mt-6 text-center">
          <Link
            href={post.guilds ? `/g/${post.guilds.code}` : "/"}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 목록으로
          </Link>
        </div>
      </main>
    </>
  );
}
