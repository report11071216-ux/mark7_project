"use client";

import { useState } from "react";
import { saveAnnouncement } from "@/app/admin/announcement/actions";
import { Megaphone, Save, Loader2, Eye } from "lucide-react";
import toast from "react-hot-toast";

export default function AnnouncementEditor({
  message,
  link,
  active,
}: {
  message: string;
  link: string;
  active: boolean;
}) {
  const [msg, setMsg] = useState(message);
  const [url, setUrl] = useState(link);
  const [isActive, setIsActive] = useState(active);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!msg.trim()) {
      toast.error("공지 내용을 입력해주세요");
      return;
    }
    setSaving(true);
    try {
      await saveAnnouncement(msg.trim(), url.trim(), isActive);
      toast.success("저장됐어요");
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 편집 카드 */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5 space-y-5">

        {/* 활성화 토글 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">배너 활성화</p>
            <p className="text-xs text-slate-500 mt-0.5">
              꺼두면 광장에 배너가 표시되지 않아요
            </p>
          </div>
          <button
            onClick={() => setIsActive((v) => !v)}
            className={
              "relative w-11 h-6 rounded-full transition-colors " +
              (isActive ? "bg-blue-600" : "bg-slate-200")
            }
          >
            <span
              className={
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform " +
                (isActive ? "translate-x-5" : "translate-x-0")
              }
            />
          </button>
        </div>

        <div className="h-px bg-slate-100" />

        {/* 공지 내용 */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            공지 내용
          </label>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="예: 길드패스 v1.2 업데이트 완료! 새 기능을 확인해보세요."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <p className="text-[11px] text-slate-400 mt-1 text-right">
            {msg.length}자
          </p>
        </div>

        {/* 링크 */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            링크 URL{" "}
            <span className="font-normal text-slate-400">(선택)</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            입력하면 배너 클릭 시 해당 주소로 이동해요
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition disabled:opacity-40"
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          저장
        </button>
      </div>

      {/* 미리보기 */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-bold text-slate-700">광장 미리보기</p>
        </div>
        {msg.trim() ? (
          <div className={
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition " +
            (isActive
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-400 line-through")
          }>
            <Megaphone className="w-4 h-4 shrink-0" />
            <span className="truncate">{msg}</span>
            {url && isActive && (
              <span className="ml-auto text-[11px] font-mono opacity-70 shrink-0">
                링크 있음
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-10 rounded-lg bg-slate-50 text-xs text-slate-400">
            공지 내용을 입력하면 미리보기가 표시돼요
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-2">
          {isActive ? "✓ 현재 광장에 표시중" : "✗ 현재 비활성화 상태"}
        </p>
      </div>
    </div>
  );
}
