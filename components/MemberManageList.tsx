"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { kickMember, transferMaster } from "@/app/actions/members";

type Member = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  points: number;
  joined_at: string;
};

type Props = {
  guildId: string;
  guildCode: string;
  currentUserId: string;
  members: Member[];
};

export default function MemberManageList({
  guildId,
  guildCode,
  currentUserId,
  members,
}: Props) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleKick = async (member: Member) => {
    const confirmed = window.confirm(
      `정말 "${member.username}" 님을 길드에서 추방하시겠습니까?\n\n` +
        `이 작업은 즉시 적용되며, 본인이 가입 코드로 재가입해야 다시 들어올 수 있어요.`
    );
    if (!confirmed) return;

    setProcessing(member.user_id);
    const result = await kickMember({
      guildId,
      guildCode,
      targetUserId: member.user_id,
    });
    setProcessing(null);

    if (result.success) {
      toast.success(`${member.username} 님을 추방했어요.`);
      router.refresh();
    } else {
      toast.error(result.error || "추방에 실패했어요.");
    }
  };

  const handleTransfer = async (member: Member) => {
    const confirmed = window.confirm(
      `⚠️ 정말 "${member.username}" 님에게 마스터를 위임하시겠습니까?\n\n` +
        `위임 후 본인은 일반 멤버로 강등되며, 새 마스터의 동의 없이는 되돌릴 수 없어요.`
    );
    if (!confirmed) return;

    // 한 번 더 확인 — 닉네임 입력
    const typed = window.prompt(
      `확실히 위임하려면 새 마스터의 닉네임을 정확히 입력하세요: ${member.username}`
    );
    if (typed !== member.username) {
      toast.error("닉네임이 일치하지 않아 취소됐어요.");
      return;
    }

    setProcessing(member.user_id);
    const result = await transferMaster({
      guildId,
      guildCode,
      newMasterId: member.user_id,
    });
    setProcessing(null);

    if (result.success) {
      toast.success(`마스터 권한을 ${member.username} 님에게 위임했어요.`);
      router.refresh();
    } else {
      toast.error(result.error || "위임에 실패했어요.");
    }
  };

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        아직 멤버가 없어요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((m) => {
        const isCurrentUser = m.user_id === currentUserId;
        const isMaster = m.role === "master";
        const isProcessing = processing === m.user_id;

        return (
          <div
            key={m.user_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            {/* 좌측: 프로필 */}
            <div className="flex items-center gap-3">
              {m.avatar_url ? (
                <img
                  src={m.avatar_url}
                  alt={m.username}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                  👤
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {m.username}
                  {isMaster && " 👑"}
                  {isCurrentUser && (
                    <span className="ml-1 text-xs text-gray-500">(나)</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {m.points}P ·{" "}
                  {new Date(m.joined_at).toLocaleDateString("ko-KR")} 가입
                </div>
              </div>
            </div>

            {/* 우측: 액션 (본인이 아니고 마스터도 아닌 멤버만) */}
            {!isCurrentUser && !isMaster && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleTransfer(m)}
                  disabled={isProcessing}
                  className="rounded-lg border border-yellow-400 px-3 py-1.5 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-50 disabled:opacity-50"
                  title="이 멤버에게 마스터 권한 위임"
                >
                  👑 마스터 위임
                </button>
                <button
                  onClick={() => handleKick(m)}
                  disabled={isProcessing}
                  className="rounded-lg border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {isProcessing ? "처리 중..." : "🚫 추방"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
