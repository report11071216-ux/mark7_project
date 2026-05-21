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
  질문: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
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
  const top5 = sorted.slice(0, 5);

  return (
    <div className="plaza-card overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">광장 게시판</h3>
          </div>
          <Link
            href="/plaza/board"
            className="text-[11px] font-mono text-blue-600 hover:text-blue-700 transition flex items-center gap-0.5"
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
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100 flex-1">
        {top5.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            게시글이 없습니다
          </div>
        ) : (
          top5.map((post) => (
            <Link
              key={post.id}
              href={`/plaza/board/${post.id}`}
              className="block px-4 py-3 transition hover:bg-blue-50 group"
            >
              <div className="flex items-start gap-2 mb-1">
                {post.is_notice && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                    <Pin className="w-2.5 h-2.5" />
                    공지
                  </span>
                )}
                {post.category && !post.is_notice && (
                  <span
                    className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      CATEGORY_STYLE[post.category] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {post.category}
                  </span>
                )}
                <p className="text-sm text-slate-900 truncate flex-1 group-hover:text-blue-700 transition">
                  {post.title}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="text-blue-500 truncate">{post.guild_name}</span>
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
