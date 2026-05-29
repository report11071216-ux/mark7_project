import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Eye, Pin, Trash2 } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import CommentForm from "./CommentForm";
import PostLikeButton from "./PostLikeButton";
import { deletePost } from "../actions";

type Props = {
  params: { id: string };
};

const CATEGORY_STYLE: { [key: string]: string } = {
  free: "bg-slate-100 text-slate-600",
  recruit: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  question: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

const CATEGORY_LABEL: { [key: string]: string } = {
  free: "자유",
  recruit: "모집",
  question: "질문",
};

export default async function BoardDetailPage({ params }: Props) {
  const supabase = await createClient();

  const [postResult, userResult] = await Promise.all([
    supabase
      .from("posts")
      .select("*, profiles(id, username, avatar_url), guilds(id, name, code)")
      .eq("id", params.id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const post = postResult.data;
  if (!post) notFound();

  const user = userResult.data.user;

  const [commentsResult, likeCountResult, myLikeResult] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, author_id, profiles(username, avatar_url)")
      .eq("post_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("post_likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", params.id),
    user
      ? supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", params.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("posts")
      .update({ view_count: (post.view_count ?? 0) + 1 })
      .eq("id", params.id),
  ]);

  const comments = commentsResult.data ?? [];
  const likeCount = likeCountResult.count ?? 0;
  const myLiked = !!myLikeResult.data;
  const isAuthor = user?.id === post.author_id;
  const profiles = post.profiles as any;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <Link href="/plaza" className="text-slate-400 hover:text-blue-600 transition">광장</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/plaza/board" className="text-slate-400 hover:text-blue-600 transition">게시판</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-700 truncate max-w-[200px]">{post.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* 본문 */}
        <div className="plaza-card p-6">
          <div className="flex items-center gap-2 mb-3">
            {post.is_notice && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                <Pin className="w-2.5 h-2.5" />
                공지
              </span>
            )}
            {post.category && (
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  CATEGORY_STYLE[post.category] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {CATEGORY_LABEL[post.category] ?? post.category}
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-4">{post.title}</h1>

          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {profiles?.avatar_url ? (
                <img
                  src={profiles.avatar_url}
                  alt={profiles.username ?? ""}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {(profiles?.username ?? "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {profiles?.username ?? "알 수 없음"}
                </p>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  {getRelativeTime(post.created_at)}
                  <span>·</span>
                  <Eye className="w-3 h-3" />
                  {post.view_count ?? 0}
                </p>
              </div>
            </div>
            {isAuthor && (
              <form action={deletePost.bind(null, post.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  삭제
                </button>
              </form>
            )}
          </div>

          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* 좋아요 */}
          <div className="flex justify-center pt-6 mt-6 border-t border-slate-100">
            <PostLikeButton
              postId={params.id}
              initialLiked={myLiked}
              initialCount={likeCount}
              isLoggedIn={!!user}
            />
          </div>
        </div>

        {/* 댓글 */}
        <div className="plaza-card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            <p className="text-xs font-bold text-slate-700">
              댓글{" "}
              <span className="text-blue-600 font-mono">{comments.length}</span>
            </p>
          </div>
          {comments.length > 0 && (
            <div className="divide-y divide-slate-100">
              {(comments as any[]).map((c) => {
                const cp = c.profiles as any;
                return (
                  <div key={c.id} className="px-5 py-4 flex gap-3">
                    {cp?.avatar_url ? (
                      <img
                        src={cp.avatar_url}
                        alt={cp.username ?? ""}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white">
                          {(cp?.username ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {cp?.username ?? "알 수 없음"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {getRelativeTime(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <CommentForm postId={params.id} isLoggedIn={!!user} />
        </div>

        <div className="text-center">
          <Link
            href="/plaza/board"
            className="text-xs font-mono text-slate-400 hover:text-blue-600 transition"
          >
            ← 목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
