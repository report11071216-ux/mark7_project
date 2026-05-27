"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Pin, ChevronRight, Eye } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

export type PlazaPost = {
  id: string;
  title: string;
  category: string | null;
  is_notice: boolean;
  view_count: number;
  created_at: string;
  guild_name: string;
  guild_code: string;
  author_name: string;
};

type Props = {
  posts: PlazaPost[];
};

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "자유", label: "자유" },
  { value: "길드모집", label: "모집" },
  { value: "질문", label: "질문" },
];

const CATEGORY_STYLE: { [key: string]: string } = {
  자유: "bg-slate-100 text-slate-600",
  길드모집: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  질문: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
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
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const top6 = sorted.slice(0, 6);

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden h-full flex flex-col">
      {/* 남색 제목띠 */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-white" />
          <h3 className="text-base font-bold text-white">광장 게시판</h3>
        </div>
        <Link
          href="/plaza/board"
          className="text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-0.5"
        >
          전체 글
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition ${
              activeCategory === cat.value
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 게시판 헤더 행 */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-5 py-2 border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
        <span>구분</span>
        <span>제목</span>
        <span>작성</span>
      </div>

      <div className="divide-y divide-slate-100 flex-1">
        {top6.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            게시글이 없습니다
          </div>
        ) : (
          top6.map((post) => (
            <Link
              key={post.id}
              href={`/plaza/board/${post.id}`}
              className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-5 py-3 transition hover:bg-slate-50 group"
            >
              <span className="shrink-0">
                {post.is_notice ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">
                    <Pin className="w-3 h-3" />
                    공지
                  </span>
                ) : post.category ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      CATEGORY_STYLE[post.category] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {post.category}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-400">
                    일반
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] text-slate-900 truncate group-hover:text-slate-600 transition font-medium">
                  {post.title}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <span className="text-slate-500 truncate">{post.guild_name}</span>
                  <span>·</span>
                  <span className="truncate">{post.author_name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {post.view_count}
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400 shrink-0 text-right">
                {getRelativeTime(post.created_at)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
