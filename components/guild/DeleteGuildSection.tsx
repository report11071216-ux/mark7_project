"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteGuild } from "@/app/actions/guild-actions";

type Props = {
  guildId: string;
  guildCode: string;
  guildName: string;
};

export default function DeleteGuildSection({ guildId, guildCode, guildName }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const codeMatches =
    confirmCode.trim().toUpperCase() === (guildCode ?? "").toUpperCase();

  function closeModal() {
    if (submitting) return;
    setOpen(false);
    setConfirmCode("");
    setError("");
  }

  async function handleDelete() {
    if (!codeMatches || submitting) return;
    setError("");
    setSubmitting(true);
    const result = await deleteGuild(guildId, confirmCode);
    if (result && result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-8">
      <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">DANGER ZONE</p>
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <h2 className="text-base font-bold text-rose-700">위험 영역</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">길드 삭제</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              이 작업은 되돌릴 수 없어요. 모든 멤버, 게시글, 출석 기록, 레이드
              일정, 길드 자랑 이미지가 영구히 삭제됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
          >
            <Trash2 className="w-4 h-4" />
            길드 삭제
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-rose-700">길드 영구 삭제</h3>
            </div>
            <p className="text-sm text-slate-700 mb-2">
              <span className="font-bold text-slate-900">"{guildName}"</span> 길드를
              정말 삭제할까요?
            </p>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              모든 멤버·게시글·출석·레이드·자랑 이미지가 한 번에 사라집니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <label className="block text-xs text-slate-500 mb-1.5">
              확인을 위해 길드 코드{" "}
              <span className="font-mono font-bold text-slate-900">{guildCode}</span>{" "}
              를 입력하세요
            </label>
            <input
              type="text"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              disabled={submitting}
              placeholder={guildCode}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
            />

            {error ? (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!codeMatches || submitting}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "삭제 중..." : "영구 삭제"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
