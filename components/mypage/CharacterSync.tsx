"use client";

import { useState } from "react";
import { RefreshCw, Search, CheckCircle, XCircle } from "lucide-react";
import { syncLostarkCharacter } from "@/app/mypage/actions";

type Props = {
  currentName: string | null;
  syncedAt: string | null;
};

export default function CharacterSync({ currentName, syncedAt }: Props) {
  const [name, setName] = useState(currentName ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSync() {
    if (!name.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const res = await syncLostarkCharacter(name.trim());
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSync()}
          placeholder="대표 캐릭터명 입력"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
        />
        <button
          onClick={handleSync}
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
  );
}
