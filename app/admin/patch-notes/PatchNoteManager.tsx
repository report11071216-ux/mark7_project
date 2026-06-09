"use client";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { createPatchNote, updatePatchNote, deletePatchNote } from "./actions";
import { Pencil, Trash2, Plus, X } from "lucide-react";

type Note = {
  id: string;
  version: string | null;
  title: string;
  body: string;
  tag: string;
  is_published: boolean;
  created_at: string;
};

const TAGS = [
  { value: "feature", label: "신기능" },
  { value: "update", label: "업데이트" },
  { value: "fix", label: "버그수정" },
  { value: "notice", label: "공지" },
];

const emptyForm = { id: "", version: "", title: "", body: "", tag: "update", isPublished: true };

export default function PatchNoteManager({ notes }: { notes: Note[] }) {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(false);
  };

  const handleEdit = (n: Note) => {
    setForm({
      id: n.id,
      version: n.version ?? "",
      title: n.title,
      body: n.body,
      tag: n.tag,
      isPublished: n.is_published,
    });
    setEditing(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("제목과 내용을 입력하세요");
      return;
    }
    startTransition(async () => {
      const result = editing
        ? await updatePatchNote(form)
        : await createPatchNote(form);
      if (result.success) {
        toast.success(editing ? "수정되었습니다" : "등록되었습니다");
        resetForm();
      } else {
        toast.error(result.error ?? "처리 실패");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("이 패치노트를 삭제할까요? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      const result = await deletePatchNote(id);
      if (result.success) {
        toast.success("삭제되었습니다");
        if (form.id === id) resetForm();
      } else {
        toast.error(result.error ?? "삭제 실패");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 작성/수정 폼 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-zinc-900 flex items-center gap-1.5">
            {editing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editing ? "패치노트 수정" : "새 패치노트 작성"}
          </h2>
          {editing && (
            <button type="button" onClick={resetForm} className="text-zinc-400 hover:text-zinc-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              placeholder="버전 (예: v1.2, 선택)"
              className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <select
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
            >
              {TAGS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="제목"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="내용 (줄바꿈 그대로 노출됩니다)"
            rows={6}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm resize-y"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            게시 (체크 해제 시 숨김)
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full h-10 rounded-lg bg-violet-600 text-white text-sm font-bold disabled:opacity-60"
          >
            {isPending ? "처리 중..." : editing ? "수정 저장" : "등록"}
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-8">아직 작성된 패치노트가 없습니다.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {n.version && <span className="text-xs font-mono text-zinc-400">{n.version}</span>}
                    <span className="text-[11px] rounded px-1.5 py-0.5 bg-zinc-100 text-zinc-600">
                      {TAGS.find((t) => t.value === n.tag)?.label ?? n.tag}
                    </span>
                    {!n.is_published && (
                      <span className="text-[11px] rounded px-1.5 py-0.5 bg-amber-100 text-amber-700">숨김</span>
                    )}
                  </div>
                  <h3 className="font-bold text-zinc-900 truncate">{n.title}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(n)}
                    className="p-1.5 rounded text-zinc-400 hover:text-violet-600 hover:bg-violet-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
