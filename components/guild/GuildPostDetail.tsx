"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pin, Eye, Heart, Trash2, Loader2, X } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/guild-board";
import { toggleGuildPostLike, deleteGuildPost } from "@/app/guild/[code]/posts/actions";
import toast from "react-hot-toast";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  view_count: number;
  like_count: number;
  is_notice: boolean;
  created_at: string;
  author_name: string;
  images: string[];
};

type Props = {
  guildCode: string;
  post: Post;
  authorColor: string | null;
  isAuthor: boolean;
  alreadyLiked: boolean;
};

export default function GuildPostDetail({ guildCode, post, authorColor, isAuthor, alreadyLiked }: Props) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [liked, setLiked] = useState(alreadyLiked);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const meta = getCategoryMeta(post.category);

  const handleLike = () => {
    if (isPending) return;
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
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <Link
          href={`/guild/${guildCode}/posts`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          목록
        </Link>
        {isAuthor && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            삭제
          </button>
        )}
      </div>

      {/* 본문 카드 */}
      <article className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mb-2 ${meta.badgeClass}`}>
            {post.is_notice && <Pin className="w-2.5 h-2.5" />}
            {meta.label}
          </span>
          <h1 className="text-lg font-bold text-slate-900 leading-snug">{post.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
            <span style={authorColor ? { color: authorColor } : undefined} className={authorColor ? "font-bold" : ""}>
              {post.author_name}
            </span>
            <span>{getRelativeTime(post.created_at)}</span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {post.view_count}
            </span>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-5 py-5">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* 이미지 갤러리 */}
        {post.images.length > 0 && (
          <div className="px-5 pb-5 space-y-2">
            {post.images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightbox(url)}
                className="block w-full rounded-xl overflow-hidden border border-slate-200 hover:border-violet-300 transition"
              >
                <img src={url} alt={`이미지 ${i + 1}`} className="w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* 좋아요 */}
        <div className="px-5 py-4 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={handleLike}
            disabled={isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition disabled:opacity-70 ${
              liked
                ? "bg-rose-50 text-rose-500 ring-1 ring-rose-200"
                : "bg-white ring-1 ring-slate-200 text-slate-500 hover:text-rose-500 hover:ring-rose-200"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-rose-400 text-rose-400" : ""}`} />
            좋아요 {likeCount}
          </button>
        </div>
      </article>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xs rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-sm font-bold text-slate-900 mb-1">글을 삭제할까요?</p>
            <p className="text-xs text-slate-500 mb-4">삭제한 글은 되돌릴 수 없어요</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-10 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
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
