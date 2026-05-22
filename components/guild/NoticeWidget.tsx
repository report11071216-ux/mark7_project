import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  created_at: string;
  is_notice: boolean;
  author: { username: string | null } | null;
};

type Props = { posts: Post[]; guildCode: string };

export default function NoticeWidget({ posts, guildCode }: Props) {
  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-400" />
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
              NOTICE
            </p>
            <h3 className="text-sm font-bold text-white">공지사항</h3>
          </div>
        </div>
        <Link
          href={`/guild/${guildCode}/posts`}
          className="text-[10px] font-mono text-zinc-500 hover:text-violet-300 transition-colors uppercase"
        >
          전체 보기 →
        </Link>
      </div>
      <div className="space-y-1">
        {posts.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-4">공지가 없어요</p>
        )}
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/guild/${guildCode}/posts/${p.id}`}
            className="flex items-start gap-2 px-2 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
          >
            {p.is_notice && (
              <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 font-mono">
                공지
              </span>
            )}
            <p className="flex-1 text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
              {p.title}
            </p>
            <p className="shrink-0 text-[10px] font-mono text-zinc-600">
              {getRelativeTime(p.created_at)}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
