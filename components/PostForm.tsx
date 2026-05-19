"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createPost } from "@/app/actions/post";

type Props = {
  guildId?: string;
  guildName?: string;
};

export default function PostForm({ guildId, guildName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("free");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const result = await createPost(formData);

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    if (result?.success && result.postId) {
      toast.success("글이 작성되었습니다!");
      router.push(`/posts/${result.postId}`);
      router.refresh();
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {guildId && (
        <>
          <input type="hidden" name="guild_id" value={guildId} />
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            📍 <strong>{guildName}</strong> 길드 게시판에 작성합니다
          </div>
        </>
      )}

      {/* 광장 글일 때만 카테고리 선택 */}
      {!guildId && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCategory("free")}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                category === "free"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              💬 자유
            </button>
            <button
              type="button"
              onClick={() => setCategory("recruit")}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                category === "recruit"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              🏰 길드 모집
            </button>
          </div>
          <input type="hidden" name="category" value={category} />
          {category === "recruit" && (
            <p className="mt-2 text-xs text-blue-600">
              💡 길드 모집 카테고리에는 길드 코드를 함께 적어주세요
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          maxLength={100}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="제목을 입력하세요"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="content"
          rows={10}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="내용을 입력하세요"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "작성 중..." : "글 작성"}
      </button>
    </form>
  );
}
