"use client";

import { useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { createComment } from "../actions";

type Props = {
  postId: string;
  isLoggedIn: boolean;
};

export default function CommentForm({ postId, isLoggedIn }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 text-center">
        <p className="text-xs text-slate-400">
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            로그인
          </Link>
          하면 댓글을 작성할 수 있어요
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!content.trim() || loading) return;
    setLoading(true);
    await createComment(postId, content);
    setContent("");
    setLoading(false);
  }

  return (
    <div className="px-5 py-4 border-t border-slate-100">
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          rows={2}
          className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shrink-0 self-end py-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
