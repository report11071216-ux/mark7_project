// components/plaza/BoardPreview.tsx
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

const CATEGORY_STYLE: Record<string, string> = {
  자유: "bg-zinc-700/40 text-zinc-300",
  길드모집: "bg-cyan-500/15 text-cyan-300",
  질문: "bg-violet-500/15 text-violet-300",
};

export default function BoardPreview({ posts }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? posts
      : posts.filter((p) => p.category === activeCategory);
  // 공지 먼저, 그 다음 최신순
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_notice && !b.is_notice) return -1;
    if (!a.is_notice && b.is_notice) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const top5 = sorted.slice(0, 5);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl backdrop-blur overflow-hidden h-full flex flex-col">
      {/* 헤더 + 카테고리 탭 */}
      <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">광장 게시판</h3>
          </div>
          <Link
            href="/plaza/board"
            className="text-[11px] font-mono text-violet-400 hover:text-violet-300 transition flex items-center gap-0.5"
          >
            전체 글
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                activeCategory === cat.value
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 글 리스트 */}
      <div className="divide-y divide-zinc-800/60 flex-1">
        {top5.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            게시글이 없습니다
          </div>
        ) : (
          top5.map((post) => (
            <Link
              key={post.id}
              href={`/plaza/board/${post.id}`}
              className="block px-4 py-3 transition hover:bg-zinc-800/30 group"
            >
              <div className="flex items-start gap-2 mb-1">
                {post.is_notice && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    <Pin className="w-2.5 h-2.5" />
                    공지
                  </span>
                )}
                {post.category && !post.is_notice && (
                  <span
                    className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      CATEGORY_STYLE[post.category] ?? "bg-zinc-700/40 text-zinc-300"
                    }`}
                  >
                    {post.category}
                  </span>
                )}
                <p className="text-sm text-white truncate flex-1 group-hover:text-violet-200 transition">
                  {post.title}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                <span className="text-violet-400/80 truncate">{post.guild_name}</span>
                <span>·</span>
                <span className="truncate">{post.author_name}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {post.view_count}
                </span>
                <span className="ml-auto shrink-0">{getRelativeTime(post.created_at)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
