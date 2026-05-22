"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { setGuardianIndex, setGuardianImage } from "@/app/admin/guardian/actions";
import { Check, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const GUARDIAN_ORDER = [
  "루멘칼리고",
  "가르가디스",
  "스콜라키아",
  "크라티오스",
  "아게오로스",
  "드렉탈라스",
  "소나벨",
  "베스칼",
];

export default function GuardianManager({
  currentIndex,
  guardianImages,
}: {
  currentIndex: number;
  guardianImages: { [key: string]: string };
}) {
  const [selected, setSelected] = useState(currentIndex);
  const [images, setImages] = useState(guardianImages);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GUARDIAN_ORDER.map((name, index) => {
          const isSelected = selected === index;
          const imageUrl = images[String(index)];
          const isUploading = uploading === index;
          const isSaving = saving === index;
          const isBusy = isUploading || isSaving;

          return (
            <div
              key={name}
              onClick={() => !isBusy && handleSelect(index)}
              className={
                "relative rounded-xl ring-2 overflow-hidden transition-all cursor-pointer " +
                (isSelected
                  ? "ring-blue-600 shadow-[0_4px_16px_rgba(37,99,235,0.2)]"
                  : "ring-slate-200 hover:ring-blue-300")
              }
            >
              {/* 이미지 영역 */}
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 relative">
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

              {/* 이름 + 업로드 */}
              <div className="p-2 bg-white">
                <p
                  className={
                    "text-[11px] font-bold mb-1.5 truncate " +
                    (isSelected ? "text-blue-600" : "text-slate-700")
                  }
                >
                  {index + 1}. {name}
                </p>
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
  );
}
