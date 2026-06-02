// components/guild/MemberManager.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Shield, ShieldOff, UserMinus, Crown, Loader2, X } from "lucide-react";
import { setSubmasterRole, kickMember } from "@/app/guild/[code]/admin/member-actions";
import toast from "react-hot-toast";

export type AdminMemberRow = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: "master" | "submaster" | "member";
  characterClass: string;
};

type Props = {
  guildCode: string;
  guildId: string;
  myRole: "master" | "submaster";
  members: AdminMemberRow[];
};

type ConfirmAction =
  | { type: "promote"; member: AdminMemberRow }
  | { type: "demote"; member: AdminMemberRow }
  | { type: "kick"; member: AdminMemberRow }
  | null;

function roleLabel(role: string) {
  if (role === "master") return "마스터";
  if (role === "submaster") return "부마스터";
  return "길드원";
}

export default function MemberManager({ guildCode, guildId, myRole, members }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [isPending, startTransition] = useTransition();

  const isMaster = myRole === "master";

  // 역할 순서: 마스터 → 부마 → 멤버
  const sorted = [...members].sort((a, b) => {
    const order = { master: 0, submaster: 1, member: 2 };
    return order[a.role] - order[b.role];
  });

  const runAction = () => {
    if (!confirm) return;
    const { type, member } = confirm;
    startTransition(async () => {
      let result;
      if (type === "promote") {
        result = await setSubmasterRole(guildCode, guildId, member.userId, true);
      } else if (type === "demote") {
        result = await setSubmasterRole(guildCode, guildId, member.userId, false);
      } else {
        result = await kickMember(guildCode, guildId, member.userId);
      }

      if (result.success) {
        toast.success(
          type === "promote" ? "부마스터로 임명했어요"
          : type === "demote" ? "부마스터를 해제했어요"
          : "강퇴했어요"
        );
        setConfirm(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "처리에 실패했어요");
      }
    });
  };

  const confirmText = () => {
    if (!confirm) return { title: "", desc: "", btn: "", danger: false };
    const n = confirm.member.name;
    if (confirm.type === "promote") return { title: "부마스터 임명", desc: `'${n}'님을 부마스터로 임명할까요?`, btn: "임명", danger: false };
    if (confirm.type === "demote") return { title: "부마스터 해제", desc: `'${n}'님을 길드원으로 되돌릴까요?`, btn: "해제", danger: false };
    return { title: "멤버 강퇴", desc: `'${n}'님을 길드에서 내보낼까요? 출석·포인트 기록은 보존돼요.`, btn: "강퇴", danger: true };
  };
  const ct = confirmText();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">멤버 관리</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isMaster ? "부마스터 임명·해제, 강퇴를 할 수 있어요." : "일반 길드원을 강퇴할 수 있어요."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((m) => {
          const initial = m.name.charAt(0);

          // 권한별 버튼 노출 규칙
          const canPromote = isMaster && m.role === "member";
          const canDemote = isMaster && m.role === "submaster";
          // 강퇴: 마스터는 부마·멤버 / 부마는 멤버만. 마스터 대상은 항상 불가
          const canKick =
            m.role !== "master" &&
            (isMaster || (myRole === "submaster" && m.role === "member"));

          return (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
            >
              {/* 아바타 */}
              <div className="shrink-0">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold text-white">
                    {initial}
                  </div>
                )}
              </div>

              {/* 이름 + 역할 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-900 truncate">{m.name}</span>
                  {m.role === "master" && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700">
                      <Crown className="w-3 h-3" />마스터
                    </span>
                  )}
                  {m.role === "submaster" && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold bg-violet-100 text-violet-700">
                      부마스터
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{m.characterClass || "캐릭터 미연동"}</p>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-1.5 shrink-0">
                {canPromote && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: "promote", member: m })}
                    className="flex items-center gap-1 px-2.5 h-8 rounded-lg bg-violet-50 text-violet-600 text-xs font-bold hover:bg-violet-100 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    부마 임명
                  </button>
                )}
                {canDemote && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: "demote", member: m })}
                    className="flex items-center gap-1 px-2.5 h-8 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition"
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    부마 해제
                  </button>
                )}
                {canKick && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: "kick", member: m })}
                    className="flex items-center gap-1 px-2.5 h-8 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    강퇴
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 확인 모달 */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xs rounded-2xl bg-white border border-slate-200 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-900">{ct.title}</p>
              <button type="button" onClick={() => setConfirm(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{ct.desc}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={isPending}
                className="flex-1 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={runAction}
                disabled={isPending}
                className={`flex-1 h-10 rounded-lg text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center ${
                  ct.danger ? "bg-rose-600 hover:bg-rose-500" : "bg-violet-600 hover:bg-violet-500"
                }`}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : ct.btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
