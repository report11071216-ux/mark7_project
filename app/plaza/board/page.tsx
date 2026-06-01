import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageSquare, Pin, Eye, PenSquare, ChevronRight } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

export const revalidate = 60;

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "자유", label: "자유" },
  { value: "길드모집", label: "길드 모집" },
  { value: "질문", label: "질문" },
];

const CATEGORY_STYLE: { [key: string]: string } = {
  자유: "bg-slate-100 text-slate-600",
  길드모집: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  질문: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

const PAGE_SIZE = 20;

type Props = {
  searchParams: { category?: string; page?: string };
};

export default async function BoardPage({ searchParams }: Props) {
  const supabase = await createClient();
  const category = searchParams.category ?? "all";
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [userResult, postsResult] = await Promise.all([
    supabase.auth.getUser(),
    (() => {
      let q = supabase
        .from("posts")
        .select(
          "id, title, category, is_notice, view_count, created_at, author_id, guild_id",
          { count: "exact" }
        )
        .is("guild_id", null)
        .order("is_notice", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (category !== "all") q = q.eq("category", category);
      return q;
    })(),
  ]);

  const user = userResult.data.user;
  const posts = postsResult.data ?? [];
  const totalCount = postsResult.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const authorIds = Array.from(new Set(posts.map((p) => p.author_id).filter(Boolean)));
  const guildIds = Array.from(new Set(posts.map((p) => p.guild_id).filter(Boolean)));
  const [authorsResult, guildsResult] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("profiles").select("id, username").in("id", authorIds)
      : Promise.resolve({ data: [] }),
    guildIds.length > 0
      ? supabase.from("guilds").select("id, name").in("id", guildIds)
      : Promise.resolve({ data: [] }),
  ]);

  const authorMap = new Map((authorsResult.data ?? []).map((a) => [a.id, a.username]));
  const guildMap = new Map((guildsResult.data ?? []).map((g) => [g.id, g.name]));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/plaza/board?${qs}` : "/plaza/board";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <Link href="/plaza" className="text-slate-400 hover:text-blue-600 transition">
                광장
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-700 font-bold">게시판</span>
              </div>
            </div>
            {user && (
              <Link
                href="/plaza/board/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                <PenSquare className="w-3.5 h-3.5" />
                글 작성
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={cat.value === "all" ? "/plaza/board" : `/plaza/board?category=${cat.value}`}
              className={`flex-1 text-center px-3 py-2 rounded-lg text-xs font-bold transition ${
                category === cat.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="plaza-card overflow-hidden">
          {posts.length === 0 ? (
            <div className="py-20 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">아직 게시글이 없어요</p>
              {user && (
                <Link
                  href="/plaza/board/new"
                  className="inline-block mt-3 text-xs font-bold text-blue-600 hover:underline"
                >
                  첫 글 작성하기 →
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/plaza/board/${post.id}`}
                  className="block px-5 py-4 hover:bg-blue-50 transition group"
                >
                  <div className="flex items-start gap-2 mb-1.5">
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
                    <p className="text-sm font-medium text-slate-900 truncate flex-1 group-hover:text-blue-700 transition">
                      {post.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    {guildMap.get(post.guild_id) && (
                      <>
                        <span className="text-blue-500 truncate">{guildMap.get(post.guild_id)}</span>
                        <span>·</span>
                      </>
                    )}
                    <span className="truncate">{authorMap.get(post.author_id) ?? "알 수 없음"}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />
                      {post.view_count ?? 0}
                    </span>
                    <span className="ml-auto shrink-0">{getRelativeTime(post.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono font-bold transition ${
                  p === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}

        {!user && (
          <p className="text-center text-xs text-slate-400 font-mono">
            <Link href="/login" className="text-blue-600 font-bold hover:underline">로그인</Link>
            하면 글을 작성할 수 있어요
          </p>
        )}
      </div>
    </div>
  );
}
