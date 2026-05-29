"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Trash2, Loader2, Send } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { createComment, deleteComment } from "@/app/guild/[code]/posts/comment-actions";
import ProfileCardModal from "@/components/ProfileCardModal";
import toast from "react-hot-toast";

export type GuildComment = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_mark: string | null;
  author_color: string | null;
};
type Props = {
  guildCode: string;
  postId: string;
  currentUserId: string;
  comments: GuildComment[];
};

export default function GuildComments({ guildCode, postId, currentUserId, comments }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!text.trim()) {
      toast.error("댓글을 입력하세요");
      return;
    }
    startTransition(async () => {
      const result = await createComment(guildCode, postId, text);
      if (result.success) {
        setText("");
        router.refresh();
      } else {
        toast.error(result.error ?? "등록에 실패했어요");
      }
    });
  };

  const handleDelete = (commentId: string) => {
    setDeletingId(commentId);
    startTransition(async () => {
      const result = await deleteComment(guildCode, postId, commentId);
      setDeletingId(null);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error ?? "삭제에 실패했어요");
      }
    });
  };

  return (
    <div className="mt-4 rounded-xl bg-card/60 ring-1 ring-border overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <MessageSquare className="w-4 h-4 text-violet-300" />
        <h2 className="text-sm font-bold text-white">
          댓글 <span className="text-violet-300">{comments.length}</span>
        </h2>
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-border">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            아직 댓글이 없어요. 첫 댓글을 남겨보세요
          </p>
        ) : (
          comments.map((c) => {
            const avatar = c.author_mark ?? c.author_avatar ?? null;
            return (
              <div key={c.id} className="flex gap-3 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setProfileUserId(c.author_id)}
                  className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-violet-500/20 flex items-center justify-center hover:ring-2 hover:ring-violet-400 transition"
                >
                  {avatar ? (
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-violet-300">
                      {(c.author_name ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                   <button
                      type="button"
                      onClick={() => setProfileUserId(c.author_id)}
                      className="text-sm font-bold hover:opacity-80 transition"
                      style={{ color: c.author_color ?? "#ffffff" }}
                    >
                      {c.author_name}
                    </button>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {getRelativeTime(c.created_at)}
                    </span>
                    {c.author_id === currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="ml-auto p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-300 transition"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed mt-0.5">
                    {c.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 작성 폼 */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={2}
            maxLength={1000}
            className="flex-1 px-3 py-2 rounded-lg bg-background ring-1 ring-border text-sm text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-violet-500 outline-none resize-none leading-relaxed"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-60 transition flex items-center justify-center shrink-0"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 프로필 모달 */}
      <ProfileCardModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
