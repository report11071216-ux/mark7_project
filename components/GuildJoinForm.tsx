"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function GuildJoinForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length !== 6) {
      setError("코드는 6자리여야 합니다.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 1. 코드로 길드 찾기
    const { data: guild, error: findError } = await supabase
      .from("guilds")
      .select("id, name, code, max_members, member_count, is_recruiting")
      .eq("code", cleanCode)
      .maybeSingle();

    if (findError || !guild) {
      setError("해당 코드의 길드를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    // 2. 모집 중인지 확인
    if (!guild.is_recruiting) {
      setError("이 길드는 현재 모집을 받지 않고 있습니다.");
      setLoading(false);
      return;
    }

    // 3. 인원 초과 확인
    if (guild.member_count >= guild.max_members) {
      setError("길드 인원이 가득 찼습니다.");
      setLoading(false);
      return;
    }

    // 4. 이미 가입했는지 확인
    const { data: existing } = await supabase
      .from("guild_members")
      .select("id")
      .eq("guild_id", guild.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      setError("이미 가입된 길드입니다.");
      setLoading(false);
      return;
    }

    // 5. 멤버로 추가
    const { error: joinError } = await supabase
      .from("guild_members")
      .insert({
        guild_id: guild.id,
        user_id: userId,
        role: "member",
      });

    if (joinError) {
      setError("가입 중 오류: " + joinError.message);
      setLoading(false);
      return;
    }

    // 성공!
    alert(`"${guild.name}" 길드에 가입했습니다!`);
    router.push(`/g/${guild.code}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          길드 입장 코드 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-2xl tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="ABCDEF"
        />
        <p className="mt-1 text-xs text-gray-500">
          길드 마스터에게 받은 6자리 코드를 입력하세요
        </p>
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
        {loading ? "확인 중..." : "길드 입장"}
      </button>
    </form>
  );
}
