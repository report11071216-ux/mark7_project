"use client";

import { useState } from "react";
import { UserPlus, Check, X, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { approveJoinRequest, rejectJoinRequest } from "@/app/guild/[code]/admin/join-request-actions";

export type JoinRequest = {
  id: string;
  userName: string;
  avatarUrl: string | null;
  message: string;
  createdAt: string;
};

export default function JoinRequestManager({
  guildCode,
  requests,
}: {
  guildCode: string;
  requests: JoinRequest[];
}) {
  const [list, setList] = useState(requests);
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setProcessing(id);
    const res = await approveJoinRequest(guildCode, id);
    setProcessing(null);
    if (res.success) {
      toast.success("가입을 승인했어요");
      setList((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.error(res.error ?? "승인에 실패했어요");
    }
  }

  async function handleReject(id: string) {
    setProcessing(id);
    const res = await rejectJoinRequest(guildCode, id);
    setProcessing(null);
    if (res.success) {
      toast.success("신청을 거절했어요");
      setList((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.error(res.error ?? "거절에 실패했어요");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5 text-cyan-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">가입 신청</h2>
          <p className="text-sm text-slate-500 mt-0.5">대기중인 신청을 승인하거나 거절하세요.</p>
        </div>
        {list.length > 0 ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600">
            {list.length}건 대기
          </span>
        ) : null}
      </div>

      {list.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">대기중인 가입 신청이 없어요</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {r.avatarUrl ? (
                  <img src={r.avatarUrl} alt={r.userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-500">{r.userName[0]?.toUpperCase() ?? "?"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{r.userName}</p>
                {r.message ? (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                ) : (
                  <p className="text-xs text-slate-300 mt-0.5">메시지 없음</p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApprove(r.id)}
                  disabled={processing === r.id}
                  className="w-9 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50"
                  title="승인"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(r.id)}
                  disabled={processing === r.id}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-400 flex items-center justify-center disabled:opacity-50"
                  title="거절"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
