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
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            placeholder="대표 캐릭터명 입력"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
          />
          <button
            onClick={handleSearchClick}
            disabled={!name.trim() || loading}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            {loading ? "조회 중" : "연동"}
          </button>
        </div>

        {result && (
          <div
            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              result.success
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
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
          <p className="text-[11px] font-mono text-zinc-500">
            마지막 동기화:{" "}
            {new Date(syncedAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">캐릭터 연동 확인</h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Character Sync</p>
              </div>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-4 mb-5">
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="text-amber-400 font-bold">{name}</span>
                {" "}을(를) 대표 캐릭터로 연동하면{" "}
                <span className="text-white font-bold">닉네임이 캐릭터명으로 변경</span>돼요.
                계속 진행할까요?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition"
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
