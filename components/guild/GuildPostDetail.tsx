"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pin, Eye, Heart, Trash2, Loader2 } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { toggleGuildPostLike, deleteGuildPost } from "@/app/guild/[code]/posts/actions";
import toast from "react-hot-toast";

type Post = {
  id: string;
  title: string;
  content: string;
  view_count: number;
  like_count: number;
  is_notice: boolean;
  created_at: string;
  author_name: string;
};

type Props = {
  guildCode: string;
  post: Post;
  authorColor: string | null;
  isAuthor: boolean;
  alreadyLiked: boolean;
};

export default function GuildPostDetail({ guildCode, post, authorColor, isAuthor, alreadyLiked }: Props) {
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [liked, setLiked] = useState(alreadyLiked);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleLike = () => {
    if (isPending) return;
    // 낙관적 업데이트
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    startTransition(async () => {
      const result = await toggleGuildPostLike(guildCode, post.id);
      if (result.success) {
        setLiked(result.liked!);
        setLikeCount(result.likeCount!);
      } else {
        // 실패 시 되돌리기
        setLiked(prevLiked);
        setLikeCount(prevCount);
        toast.error(result.error ?? "실패했어요");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGuildPost(guildCode, post.id);
      if (result.success) {
        toast.success("삭제되었어요");
        router.push(`/guild/${guildCode}/posts`);
      } else {
        toast.error(result.error ?? "삭제에 실패했어요");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <Link
          href={`/guild/${guildCode}/posts`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          목록
        </Link>
        {isAuthor && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            삭제
          </button>
        )}
      </div>

      {/* 본문 카드 */}
      <article className="rounded-xl bg-card/60 ring-1 ring-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          {post.is_notice && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 mb-2">
              <Pin className="w-2.5 h-2.5" />
              공지
            </span>
          )}
          <h1 className="text-lg font-bold text-white leading-snug">{post.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-muted-foreground">
            <span style={authorColor ? { color: authorColor } : undefined} className={authorColor ? "font-bold" : ""}>{post.author_name}</span>
            <span>{getRelativeTime(post.created_at)}</span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {post.view_count}
            </span>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* 좋아요 */}
        <div className="px-5 py-4 border-t border-border flex justify-center">
          <button
            type="button"
            onClick={handleLike}
            disabled={isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition disabled:opacity-70 ${
              liked
                ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                : "bg-card ring-1 ring-border text-muted-foreground hover:text-rose-300 hover:ring-rose-500/30"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-rose-400 text-rose-400" : ""}`} />
            좋아요 {likeCount}
          </button>
        </div>
      </article>

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-xs rounded-2xl bg-card ring-1 ring-border p-5">
            <p className="text-sm font-bold text-white mb-1">글을 삭제할까요?</p>
            <p className="text-xs text-muted-foreground mb-4">삭제한 글은 되돌릴 수 없어요</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-10 rounded-lg bg-white/5 text-sm font-bold text-muted-foreground hover:bg-white/10 transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 h-10 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-500 disabled:opacity-60 transition flex items-center justify-center"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
