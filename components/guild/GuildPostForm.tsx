"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, PenLine, Pin, Loader2 } from "lucide-react";
import { createGuildPost } from "@/app/guild/[code]/posts/actions";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  guildName: string;
  isStaff: boolean;
};

export default function GuildPostForm({ guildCode, guildName, isStaff }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력하세요");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력하세요");
      return;
    }

    startTransition(async () => {
      const result = await createGuildPost(guildCode, {
        title: title.trim(),
        content: content.trim(),
        is_notice: isStaff ? isNotice : false,
      });
      if (result.success && result.postId) {
        toast.success("글이 등록되었어요");
        router.push(`/guild/${guildCode}/posts/${result.postId}`);
      } else {
        toast.error(result.error ?? "등록에 실패했어요");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href={`/guild/${guildCode}/posts`}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-violet-300" />
          <h1 className="text-lg font-bold text-white">글쓰기</h1>
        </div>
        <span className="text-xs text-violet-300 font-mono ml-1">{guildName}</span>
      </div>

      <div className="space-y-4">
        {/* 공지 체크 — 운영진만 */}
        {isStaff && (
          <button
            type="button"
            onClick={() => setIsNotice(!isNotice)}
            className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl ring-1 transition ${
              isNotice
                ? "bg-amber-500/15 ring-amber-500/40 text-amber-200"
                : "bg-card/60 ring-border text-muted-foreground hover:ring-amber-500/30"
            }`}
          >
            <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
              isNotice ? "bg-amber-500 text-white" : "bg-white/10"
            }`}>
              {isNotice && <Pin className="w-3 h-3" />}
            </span>
            <span className="text-sm font-bold">공지로 등록</span>
            <span className="text-[11px] ml-auto">
              {isNotice ? "게시판 상단에 고정돼요" : "체크하면 상단 고정"}
            </span>
          </button>
        )}

        {/* 제목 */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={100}
            className="w-full h-11 px-3.5 rounded-lg bg-card/60 ring-1 ring-border text-sm text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={12}
            className="w-full px-3.5 py-3 rounded-lg bg-card/60 ring-1 ring-border text-sm text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-violet-500 outline-none resize-y leading-relaxed"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <Link
            href={`/guild/${guildCode}/posts`}
            className="flex-1 h-11 rounded-lg bg-white/5 text-sm font-bold text-muted-foreground hover:bg-white/10 transition flex items-center justify-center"
          >
            취소
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 h-11 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}
