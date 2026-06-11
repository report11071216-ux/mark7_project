"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Pin, ChevronRight, Heart } from "lucide-react";

export type PlazaPost = {
  id: string;
  title: string;
  category: string | null;
  is_notice: boolean;
  view_count: number;
  created_at: string;
  guild_name: string;
  guild_code: string;
  guild_server?: string | null;
  author_name: string;
  like_count?: number;
};

type Props = {
  posts: PlazaPost[];
};

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "free", label: "자유" },
  { value: "recruit", label: "모집" },
  { value: "question", label: "질문" },
];

const CATEGORY_LABEL: { [key: string]: string } = {
  free: "자유",
  recruit: "모집",
  question: "질문",
};

const CATEGORY_STYLE: { [key: string]: string } = {
  free: "bg-plaza-surface-2 text-plaza-ink-soft",
  recruit: "bg-plaza-accent-soft text-plaza-accent",
  question: "bg-plaza-accent-soft text-plaza-accent",
};

export default function BoardPreview({ posts }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_notice && !b.is_notice) return -1;
    if (!a.is_notice && b.is_notice) return 1;
    const la = a.like_count ?? 0;
    const lb = b.like_count ?? 0;
    if (lb !== la) return lb - la;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const top10 = sorted.slice(0, 10);

  const leftCol = top10.filter((_, i) => i % 2 === 0);
  const rightCol = top10.filter((_, i) => i % 2 === 1);

  function renderRow(post: PlazaPost, isLast: boolean) {
    return (
      <Link
        key={post.id}
        href={`/plaza/board/${post.id}`}
        className={
          "flex items-center gap-2.5 px-4 py-2.5 hover:bg-plaza-surface-2 transition group " +
          (isLast ? "" : "border-b border-plaza-line")
        }
      >
        <span className="shrink-0">
          {post.is_notice ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">
              <Pin className="w-2.5 h-2.5" />
              공지
            </span>
          ) : post.category ? (
            <span
              className={
                "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold " +
                (CATEGORY_STYLE[post.category] ?? "bg-plaza-surface-2 text-plaza-ink-soft")
              }
            >
              {CATEGORY_LABEL[post.category] ?? post.category}
            </span>
          ) : (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-plaza-surface-2 text-plaza-ink-dim">
              일반
            </span>
          )}
        </span>
        <span className="flex-1 min-w-0 truncate text-[13px] text-plaza-ink-soft group-hover:text-plaza-ink transition">
          {post.title}
        </span>
        <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-plaza-ink-dim">
          <Heart className="w-3 h-3" />
          {post.like_count ?? 0}
        </span>
      </Link>
    );
  }

  return (
    <div className="bg-plaza-surface rounded-xl ring-1 ring-plaza-line overflow-hidden">
      {/* 가벼운 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-plaza-line">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-plaza-accent" />
          <h3 className="text-[15px] font-bold text-plaza-ink">광장 게시판</h3>
        </div>
        <Link
          href="/plaza/board"
          className="text-xs font-medium text-plaza-ink-dim hover:text-plaza-ink transition flex items-center gap-0.5"
        >
          전체 글
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 px-4 py-2.5 border-b border-plaza-line bg-plaza-surface-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition " +
              (activeCategory === cat.value
                ? "bg-plaza-accent text-plaza-canvas"
                : "text-plaza-ink-dim hover:text-plaza-ink hover:bg-plaza-surface")
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2열 리스트 */}
      {top10.length === 0 ? (
        <div className="p-10 text-center text-plaza-ink-dim text-sm">
          게시글이 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="md:border-r border-plaza-line">
            {leftCol.map((p, i) => renderRow(p, i === leftCol.length - 1))}
          </div>
          <div>
            {rightCol.map((p, i) => renderRow(p, i === rightCol.length - 1))}
          </div>
        </div>
      )}
    </div>
  );
}
