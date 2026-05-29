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
  free: "bg-slate-100 text-slate-600",
  recruit: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  question: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
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
          "flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition group " +
          (isLast ? "" : "border-b border-slate-100")
        }
      >
        <span className="shrink-0">
          {post.is_notice ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
              <Pin className="w-2.5 h-2.5" />
              공지
            </span>
          ) : post.category ? (
            <span
              className={
                "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold " +
                (CATEGORY_STYLE[post.category] ?? "bg-slate-100 text-slate-600")
              }
            >
              {CATEGORY_LABEL[post.category] ?? post.category}
            </span>
          ) : (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
              일반
            </span>
          )}
        </span>
        <span className="flex-1 min-w-0 truncate text-[13px] text-slate-800 group-hover:text-slate-600 transition">
          {post.title}
        </span>
        <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-slate-400">
          <Heart className="w-3 h-3" />
          {post.like_count ?? 0}
        </span>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden">
      {/* 가벼운 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-500" />
          <h3 className="text-[15px] font-bold text-slate-900">광장 게시판</h3>
        </div>
        <Link
          href="/plaza/board"
          className="text-xs font-medium text-slate-400 hover:text-slate-700 transition flex items-center gap-0.5"
        >
          전체 글
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition " +
              (activeCategory === cat.value
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200")
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2열 리스트 */}
      {top10.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">
          게시글이 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="md:border-r border-slate-100">
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
