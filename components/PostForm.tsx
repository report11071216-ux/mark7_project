"use client";

import { useState } from "react";
import { createPost } from "@/app/actions/post";

type Props = {
  guildId?: string;
  guildName?: string;
};

export default function PostForm({ guildId, guildName }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);
    const result = await createPost(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
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

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
