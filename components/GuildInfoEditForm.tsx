"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateGuildInfo } from "@/app/actions/guild";

type Props = {
  guildId: string;
  guildCode: string;
  currentMemberCount: number;
  initial: {
    name: string;
    description: string | null;
    max_members: number;
    is_recruiting: boolean;
  };
};

export default function GuildInfoEditForm({
  guildId,
  guildCode,
  currentMemberCount,
  initial,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description || "");
  const [maxMembers, setMaxMembers] = useState(initial.max_members);
  const [isRecruiting, setIsRecruiting] = useState(initial.is_recruiting);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateGuildInfo({
      guildId,
      guildCode,
      name,
      description,
      maxMembers,
      isRecruiting,
    });

    setSaving(false);

    if (result.success) {
      toast.success("길드 정보가 저장됐어요!");
      router.refresh();
    } else {
      toast.error(result.error || "저장에 실패했어요.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 길드 이름 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          길드 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={30}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
          placeholder="2~30자"
        />
        <p className="mt-1 text-xs text-gray-500">
          {name.length}/30자 · 다른 길드와 중복 불가
        </p>
      </div>

      {/* 길드 소개 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          길드 소개 <span className="text-xs text-gray-500">(최대 1000자)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
          placeholder="우리 길드 소개..."
        />
        <p className="mt-1 text-right text-xs text-gray-500">
          {description.length}/1000
        </p>
      </div>

      {/* 최대 인원 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          최대 인원
        </label>
        <input
          type="number"
          value={maxMembers}
          onChange={(e) => setMaxMembers(parseInt(e.target.value) || 1)}
          min={currentMemberCount}
          max={500}
          className="w-32 rounded-lg border border-gray-300 px-4 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          현재 멤버: {currentMemberCount}명 · 최소 {currentMemberCount}, 최대 500
        </p>
      </div>

      {/* 모집 여부 */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isRecruiting}
            onChange={(e) => setIsRecruiting(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            ✅ 새 멤버 모집 중
          </span>
        </label>
        <p className="mt-1 pl-8 text-xs text-gray-500">
          체크 해제 시 새 멤버가 코드로 가입할 수 없습니다.
        </p>
      </div>

      {/* 저장 버튼 */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
      >
        {saving ? "저장 중..." : "💾 저장하기"}
      </button>
    </form>
  );
}
