"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  setGuardianIndex,
  setGuardianImage,
  setGuardianWeaknesses,
} from "@/app/admin/guardian/actions";
import { Check, Upload, Loader2, Tag, X, Plus, Save } from "lucide-react";
import toast from "react-hot-toast";

const GUARDIAN_ORDER = [
  "루멘칼리고", "가르가디스", "스콜라키아", "크라티오스",
  "아게오로스", "드렉탈라스", "소나벨", "베스칼",
];

const PRESET_COLORS = [
  "#f97316", "#ef4444", "#60a5fa", "#facc15",
  "#84cc16", "#a855f7", "#14b8a6", "#ec4899",
];

const PRESET_NAMES = ["화속성", "수속성", "뇌속성", "토속성", "빛속성", "암속성"];

type Weakness = { name: string; color: string };
type WeaknessMap = { [key: string]: Weakness[] };

export default function GuardianManager({
  currentIndex,
  guardianImages,
  guardianWeaknesses,
}: {
  currentIndex: number;
  guardianImages: { [key: string]: string };
  guardianWeaknesses: WeaknessMap;
}) {
  const [selected, setSelected] = useState(currentIndex);
  const [images, setImages] = useState(guardianImages);
  const [weaknesses, setWeaknesses] = useState<WeaknessMap>(guardianWeaknesses);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [wName, setWName] = useState("");
  const [wColor, setWColor] = useState(PRESET_COLORS[0]);
  const [wSaving, setWSaving] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  function getWs(index: number): Weakness[] {
    return weaknesses[String(index)] ?? [];
  }

  async function handleSelect(index: number) {
    if (saving !== null) return;
    setSaving(index);
    try {
      await setGuardianIndex(index);
      setSelected(index);
      toast.success(`${GUARDIAN_ORDER[index]}로 변경됐어요`);
    } catch {
      toast.error("변경에 실패했어요");
    } finally {
      setSaving(null);
    }
  }

  async function handleUpload(index: number, file: File) {
    setUploading(index);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `guardians/${index}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("platform-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("platform-assets")
        .getPublicUrl(path);
      const url = `${urlData.publicUrl}?v=${Date.now()}`;
      await setGuardianImage(index, url);
      setImages((prev) => ({ ...prev, [String(index)]: url }));
      toast.success("이미지가 업로드됐어요");
    } catch {
      toast.error("업로드에 실패했어요");
    } finally {
      setUploading(null);
    }
  }

  function addWeakness(index: number) {
    if (!wName.trim()) return;
    const current = getWs(index);
    if (current.some((w) => w.name === wName.trim())) return;
    setWeaknesses((prev) => ({
      ...prev,
      [String(index)]: [...current, { name: wName.trim(), color: wColor }],
    }));
    setWName("");
  }

  function removeWeakness(index: number, wIdx: number) {
    setWeaknesses((prev) => ({
      ...prev,
      [String(index)]: getWs(index).filter((_, i) => i !== wIdx),
    }));
  }

  async function saveWeaknesses(index: number) {
    setWSaving(true);
    try {
      await setGuardianWeaknesses(index, getWs(index));
      toast.success("취약속성이 저장됐어요");
      setEditingIdx(null);
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setWSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 가디언 그리드 */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GUARDIAN_ORDER.map((name, index) => {
            const isSelected = selected === index;
            const imageUrl = images[String(index)];
            const isUploading = uploading === index;
            const isSaving = saving === index;
            const isBusy = isUploading || isSaving;
            const ws = getWs(index);

            return (
              <div
                key={name}
                className={
                  "rounded-xl ring-2 overflow-hidden transition-all " +
                  (isSelected
                    ? "ring-blue-600 shadow-[0_4px_16px_rgba(37,99,235,0.2)]"
                    : "ring-slate-200")
                }
              >
                {/* 이미지 — 클릭 시 가디언 변경 */}
                <div
                  onClick={() => !isBusy && handleSelect(index)}
                  className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 relative cursor-pointer hover:brightness-95 transition"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-[10px] font-mono text-slate-400">No Image</p>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {isBusy && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>

                {/* 카드 하단 */}
                <div className="p-2 bg-white space-y-1.5">
                  <p className={
                    "text-[11px] font-bold truncate " +
                    (isSelected ? "text-blue-600" : "text-slate-700")
                  }>
                    {index + 1}. {name}
                  </p>

                  {/* 취약속성 뱃지 */}
                  <div className="flex flex-wrap gap-1 min-h-[18px]">
                    {ws.length > 0
                      ? ws.map((w, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                            style={{ backgroundColor: w.color }}
                          >
                            {w.name}
                          </span>
                        ))
                      : <span className="text-[9px] text-slate-400">속성 없음</span>
                    }
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRefs.current[index]?.click();
                    }}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-1 w-full px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-600 transition-colors disabled:opacity-40"
                  >
                    <Upload className="w-3 h-3" />
                    이미지
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingIdx(editingIdx === index ? null : index);
                      setWName("");
                      setWColor(PRESET_COLORS[0]);
                    }}
                    className={
                      "flex items-center justify-center gap-1 w-full px-2 py-1 rounded-lg text-[10px] font-medium transition-colors " +
                      (editingIdx === index
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600")
                    }
                  >
                    <Tag className="w-3 h-3" />
                    속성 편집
                  </button>

                  <input
                    ref={(el) => { fileRefs.current[index] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(index, file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 취약속성 편집 패널 */}
      {editingIdx !== null && (
        <div className="rounded-xl bg-white ring-2 ring-blue-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono text-blue-600 uppercase tracking-wider mb-0.5">
                취약속성 편집
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                {GUARDIAN_ORDER[editingIdx]}
              </h3>
            </div>
            <button
              onClick={() => setEditingIdx(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 현재 속성 */}
          <div className="mb-5">
            <p className="text-[11px] font-medium text-slate-500 mb-2">현재 속성</p>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {getWs(editingIdx).length > 0
                ? getWs(editingIdx).map((w, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: w.color }}
                    >
                      {w.name}
                      <button
                        onClick={() => removeWeakness(editingIdx, i)}
                        className="hover:opacity-70 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                : <span className="text-xs text-slate-400">등록된 속성이 없어요</span>
              }
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-medium text-slate-500">속성 추가</p>

            {/* 빠른 선택 */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_NAMES.map((n) => (
                <button
                  key={n}
                  onClick={() => setWName(n)}
                  className={
                    "px-3 py-1 rounded-lg text-xs font-medium border transition " +
                    (wName === n
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50")
                  }
                >
                  {n}
                </button>
              ))}
            </div>

            {/* 직접 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={wName}
                onChange={(e) => setWName(e.target.value)}
                placeholder="속성명 직접 입력"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyDown={(e) => { if (e.key === "Enter") addWeakness(editingIdx); }}
              />
              <button
                onClick={() => addWeakness(editingIdx)}
                disabled={!wName.trim()}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 색상 팔레트 */}
            <div>
              <p className="text-[11px] font-medium text-slate-500 mb-2">색상 선택</p>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setWColor(c)}
                    className={
                      "w-7 h-7 rounded-full border-[3px] transition-transform " +
                      (wColor === c
                        ? "border-slate-800 scale-110"
                        : "border-transparent hover:scale-105")
                    }
                    style={{ backgroundColor: c }}
                  />
                ))}
                {/* 커스텀 컬러 피커 */}
                <div className="relative w-7 h-7">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 via-blue-400 to-green-400 border-2 border-dashed border-slate-300 flex items-center justify-center pointer-events-none">
                    <Plus className="w-3 h-3 text-white drop-shadow" />
                  </div>
                  <input
                    type="color"
                    value={wColor}
                    onChange={(e) => setWColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-5 h-5 rounded-full ring-1 ring-slate-200"
                  style={{ backgroundColor: wColor }}
                />
                <span className="text-[11px] font-mono text-slate-500">{wColor}</span>
              </div>
            </div>

            <button
              onClick={() => saveWeaknesses(editingIdx)}
              disabled={wSaving}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold transition disabled:opacity-40"
            >
              {wSaving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />
              }
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
