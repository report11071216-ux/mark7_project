"use client";

import { useState } from "react";
import Link from "next/link";
import { Pin, Eye, Heart, PenLine, MessageSquare } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/guild-board";

export type GuildPost = {
  id: string;
  title: string;
  is_notice: boolean;
  category: string;
  view_count: number;
  like_count: number;
  created_at: string;
  author_name: string;
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
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">아직 작성된 글이 없어요</p>
            <p className="text-xs text-slate-400 mt-1">첫 글을 작성해보세요</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">이 분류에 글이 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((p) => {
              const meta = getCategoryMeta(p.category);
              const isN = p.is_notice;
              return (
                <Link
                  key={p.id}
                  href={`/guild/${guildCode}/posts/${p.id}`}
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
                    {p.title}
                  </p>
                  <PostMeta post={p} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
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
