"use client";

import { useState } from "react";
import { RefreshCw, Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { syncLostarkCharacter } from "@/app/mypage/actions";

type Props = {
  currentName: string | null;
  syncedAt: string | null;
};

export default function CharacterSync({ currentName, syncedAt }: Props) {
  const [name, setName] = useState(currentName ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSearchClick() {
    if (!name.trim() || loading) return;
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setShowConfirm(false);
    setLoading(true);
    setResult(null);
    const res = await syncLostarkCharacter(name.trim());
    setResult(res);
    setLoading(false);
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            placeholder="대표 캐릭터명 입력"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          />
          <button
            onClick={handleSearchClick}
            disabled={!name.trim() || loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            {loading ? "조회중" : "연동"}
          </button>
        </div>

        {result && (
          <div
            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              result.success
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            {result.message}
          </div>
        )}

        {syncedAt && !result && (
          <p className="text-[11px] font-mono text-slate-400">
            마지막 동기화:{" "}
            {new Date(syncedAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">캐릭터 연동 확인</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Character Sync</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="text-blue-600 font-bold">{name}</span>
                {" "}을(를) 대표 캐릭터로 연동하면{" "}
                <span className="text-slate-900 font-bold">닉네임이 캐릭터명으로 변경</span>돼요.
                계속 진행할까요?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
              >
                연동하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
