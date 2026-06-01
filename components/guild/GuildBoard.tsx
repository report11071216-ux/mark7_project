"use client";

import { useState } from "react";
import Link from "next/link";
import { Pin, Eye, Heart, PenLine, MessageSquare, Images } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { getCategoryMeta, isGalleryCategory } from "@/lib/guild-board";

export type GuildPost = {
  id: string;
  title: string;
  is_notice: boolean;
  category: string;
  view_count: number;
  like_count: number;
  created_at: string;
  author_name: string;
  thumbnail: string | null;
  image_count: number;
};

type Props = {
  guildCode: string;
  guildName: string;
  posts: GuildPost[];
  isStaff: boolean;
};

const FILTER_TABS = [
  { key: "all", label: "전체" },
  { key: "notice", label: "공지" },
  { key: "free", label: "자유" },
  { key: "flex", label: "비틱" },
  { key: "custom", label: "커스터마이징" },
  { key: "tip", label: "팁" },
];

export default function GuildBoard({ guildCode, posts }: Props) {
  const [filter, setFilter] = useState("all");

  let visible: GuildPost[];
  if (filter === "all") {
    const notices = posts.filter((p) => p.is_notice);
    const normal = posts.filter((p) => !p.is_notice);
    visible = notices.concat(normal);
  } else {
    visible = posts.filter((p) => (p.category ?? "free") === filter);
  }

  // 갤러리 모드: 비틱/커스터마이징 단일 필터일 때만 그리드
  const galleryMode = filter === "flex" || filter === "custom";

  function tabActiveClass(key: string) {
    if (key === "all") return "bg-violet-600 text-white";
    return getCategoryMeta(key).activeClass;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GUILD BOARD</p>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">길드 게시판</h1>
            </div>
          </div>
          <Link
            href={`/guild/${guildCode}/posts/new`}
            className="flex items-center gap-1.5 px-4 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition shrink-0"
          >
            <PenLine className="w-4 h-4" />
            글쓰기
          </Link>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTER_TABS.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-bold transition ${
                  active
                    ? tabActiveClass(t.key)
                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {posts.length === 0 ? (
          <EmptyState text="아직 작성된 글이 없어요" sub="첫 글을 작성해보세요" />
        ) : visible.length === 0 ? (
          <EmptyState text="이 분류에 글이 없어요" />
        ) : galleryMode ? (
          /* ── 갤러리 그리드 ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visible.map((p) => (
              <GalleryCard key={p.id} guildCode={guildCode} post={p} />
            ))}
          </div>
        ) : (
          /* ── 리스트 ── */
          <div className="space-y-2">
            {visible.map((p) => (
              <ListRow key={p.id} guildCode={guildCode} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-sm text-slate-600">{text}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function ListRow({ guildCode, post }: { guildCode: string; post: GuildPost }) {
  const meta = getCategoryMeta(post.category);
  const isN = post.is_notice;
  return (
    <Link
      href={`/guild/${guildCode}/posts/${post.id}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
        isN
          ? "bg-amber-50 border-amber-200 hover:border-amber-300"
          : "bg-white border-slate-200 hover:border-violet-300"
      }`}
    >
      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${meta.badgeClass}`}>
        {isN && <Pin className="w-2.5 h-2.5" />}
        {meta.label}
      </span>
      <p className={`flex-1 text-sm truncate ${isN ? "font-bold text-slate-900" : "text-slate-800"}`}>
        {post.title}
      </p>
      {post.image_count > 0 && (
        <span className="flex items-center gap-0.5 text-[11px] font-mono text-slate-400 shrink-0">
          <Images className="w-3 h-3" />
          {post.image_count}
        </span>
      )}
      <PostMeta post={post} />
    </Link>
  );
}

function GalleryCard({ guildCode, post }: { guildCode: string; post: GuildPost }) {
  const meta = getCategoryMeta(post.category);
  return (
    <Link
      href={`/guild/${guildCode}/posts/${post.id}`}
      className="rounded-xl bg-white border border-slate-200 overflow-hidden hover:border-violet-300 hover:shadow-sm transition group"
    >
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
        )}
        {post.image_count > 1 && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/55 text-white text-[10px] font-bold">
            <Images className="w-3 h-3" />
            {post.image_count}
          </span>
        )}
        <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.badgeClass}`}>
          {meta.label}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-slate-900 truncate">{post.title}</p>
        <div className="flex items-center gap-2.5 mt-1.5 text-[11px] font-mono text-slate-400">
          <span className="truncate">{post.author_name}</span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Heart className="w-3 h-3" />
            {post.like_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostMeta({ post }: { post: GuildPost }) {
  return (
    <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-400">
      <span className="hidden sm:inline">{post.author_name}</span>
      <span className="flex items-center gap-0.5">
        <Eye className="w-3 h-3" />
        {post.view_count}
      </span>
      <span className="flex items-center gap-0.5">
        <Heart className="w-3 h-3" />
        {post.like_count}
      </span>
      <span>{getRelativeTime(post.created_at)}</span>
    </div>
  );
}
