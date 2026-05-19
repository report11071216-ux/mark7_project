"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createComment, deleteComment } from "@/app/actions/post";
import { timeAgo } from "@/lib/utils/time";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

type Props = {
  postId: string;
  comments: Comment[];
  currentUserId: string | null;
};

export default function CommentSection({
  postId,
  comments,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("post_id", postId);
    formData.append("content", content);

    const result = await createComment(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setContent("");
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("정말 삭제할까요?")) return;
    await deleteComment(commentId, postId);
    router.refresh();
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-bold text-gray-900">
        💬 댓글 ({comments.length})
      </h3>

      {/* 댓글 작성 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={500}
            required
            placeholder="댓글을 입력하세요..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "작성 중..." : "댓글 작성"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600">
          댓글을 작성하려면 로그인하세요
        </p>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            아직 댓글이 없어요. 첫 댓글을 작성해보세요!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3 border-t border-gray-100 pt-4">
              {c.profiles.avatar_url ? (
                <img
                  src={c.profiles.avatar_url}
                  alt={c.profiles.username}
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm">
                  👤
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {c.profiles.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {timeAgo(c.created_at)}
                  </span>
                  {currentUserId === c.author_id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto text-xs text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
