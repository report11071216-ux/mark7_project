import Link from "next/link";
import { Pin, Eye, Heart, PenLine, MessageSquare } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

export type GuildPost = {
  id: string;
  title: string;
  is_notice: boolean;
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

export default function GuildBoard({ guildCode, guildName, posts, isStaff }: Props) {
  const notices = posts.filter((p) => p.is_notice);
  const normalPosts = posts.filter((p) => !p.is_notice);
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 mb-6">
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

        {posts.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">아직 작성된 글이 없어요</p>
            <p className="text-xs text-slate-400 mt-1">첫 글을 작성해보세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 공지 */}
            {notices.map((p) => (
              <Link
                key={p.id}
                href={`/guild/${guildCode}/posts/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-300 transition"
              >
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 shrink-0">
                  <Pin className="w-2.5 h-2.5" />
                  공지
                </span>
                <p className="flex-1 text-sm font-bold text-slate-900 truncate">{p.title}</p>
                <PostMeta post={p} />
              </Link>
            ))}
            {/* 일반 글 */}
            {normalPosts.map((p) => (
              <Link
                key={p.id}
                href={`/guild/${guildCode}/posts/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-violet-300 transition"
              >
                <p className="flex-1 text-sm text-slate-800 truncate">{p.title}</p>
                <PostMeta post={p} />
              </Link>
            ))}
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
