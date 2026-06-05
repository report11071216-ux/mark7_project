"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, Users, CheckCircle, XCircle } from "lucide-react";
import {
  addSubAccount,
  removeSubAccount,
  listSubAccounts,
  type SubAccount,
} from "@/app/mypage/actions";

export default function SubAccountManager() {
  const [subs, setSubs] = useState<SubAccount[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingKey, setRemovingKey] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    let alive = true;
    listSubAccounts()
      .then((data) => {
        if (alive) setSubs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setSubs([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function handleAdd() {
    if (!name.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const res = await addSubAccount(name.trim());
    setResult(res);
    setLoading(false);
    if (res.success) {
      setName("");
      window.location.reload();
    }
  }

  async function handleRemove(key: string) {
    if (removingKey) return;
    setRemovingKey(key);
    setResult(null);
    const res = await removeSubAccount(key);
    setResult(res);
    setRemovingKey("");
    if (res.success) {
      window.location.reload();
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-blue-600" />
        <h4 className="text-xs font-bold text-slate-700">부계정 원정대 추가</h4>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
        다른 계정의 대표 캐릭터명을 입력하면 그 원정대 캐릭터도 레이드 신청에 쓸 수 있어요. (최대 3개)
      </p>

      {subs.length > 0 ? (
        <div className="mb-3 space-y-1.5">
          {subs.map((s) => (
            <div
              key={s.accountKey}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">{s.accountKey}</p>
                <p className="text-[11px] text-slate-400">캐릭터 {s.charCount}개</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(s.accountKey)}
                disabled={removingKey === s.accountKey}
                className="flex shrink-0 items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-40"
              >
                {removingKey === s.accountKey ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="부계정 대표 캐릭터명"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={handleAdd}
          disabled={!name.trim() || loading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {loading ? "추가중" : "추가"}
        </button>
      </div>

      {result ? (
        <div
          className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            result.success
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          {result.message}
        </div>
      ) : null}
    </div>
  );
}
