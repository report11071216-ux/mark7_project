"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateGuildCode } from "@/lib/utils/guildCode";

export default function GuildCreateForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (name.trim().length < 2) {
      setError("길드 이름은 2글자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 코드 중복 방지: 중복되면 다시 생성 (최대 5번)
    let code = "";
    let attempts = 0;
    while (attempts < 5) {
      code = generateGuildCode();
      const { data } = await supabase
        .from("guilds")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!data) break;
      attempts++;
    }

    // 길드 생성
    const { data: guild, error: insertError } = await supabase
      .from("guilds")
      .insert({
        name: name.trim(),
        code,
        description: description.trim() || null,
        master_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        setError("이미 사용 중인 길드 이름입니다.");
      } else {
        setError("길드 생성 중 오류: " + insertError.message);
      }
      setLoading(false);
      return;
    }

    // 성공 → 길드 페이지로 이동 (아직 안 만들었으니 일단 메인으로)
    alert(`길드 생성 완료! 입장 코드: ${code}`);
    router.push("/my-guilds");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          길드 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="우리 길드 이름"
        />
        <p className="mt-1 text-xs text-gray-500">
          2~30자, 다른 길드와 중복될 수 없습니다
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          길드 소개
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="우리 길드는 어떤 곳인가요?"
        />
        <p className="mt-1 text-xs text-gray-500">선택사항, 500자 이내</p>
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
        {loading ? "생성 중..." : "길드 만들기"}
      </button>

      <p className="text-center text-xs text-gray-500">
        생성 후 6자리 입장 코드가 발급됩니다
      </p>
    </form>
  );
}
