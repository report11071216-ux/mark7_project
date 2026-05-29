"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createBackground } from "@/app/admin/backgrounds/actions";
import toast from "react-hot-toast";

export default function BackgroundForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 가능해요.");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("이미지는 5MB 이하만 가능해요.");
      return null;
    }
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("guild-backgrounds").upload(path, file);
    if (error) {
      toast.error("업로드 실패: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("guild-backgrounds").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const url = await uploadFile(f);
    setUploading(false);
    if (url) setImageUrl(url);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("배경 이름을 입력하세요"); return; }
    const priceNum = parseInt(price, 10);
    if (!priceNum || priceNum < 0) { toast.error("가격을 올바르게 입력하세요"); return; }
    if (!imageUrl) { toast.error("배경 이미지를 올려주세요"); return; }

    setSaving(true);
    const res = await createBackground({ name: name.trim(), price: priceNum, imageUrl });
    setSaving(false);

    if (res.ok) {
      toast.success("배경이 등록됐어요!");
      setName("");
      setPrice("");
      setImageUrl("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
      {/* 16:9 미리보기 / 업로드 */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">배경 이미지 (16:9 권장)</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        {imageUrl ? (
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200">
            <img src={imageUrl} alt="배경 미리보기" className="w-full h-full object-cover" />
            {/* 가독성 오버레이 미리보기 */}
            <div className="absolute inset-0 bg-slate-900/30" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <div className="bg-white/90 rounded-lg px-3 py-2 w-fit">
                <p className="text-xs font-bold text-slate-900">카드 미리보기</p>
                <p className="text-[10px] text-slate-500">실제 길드 홈에서 이렇게 보여요</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-violet-400 hover:text-violet-500 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-7 h-7" />
                <span className="text-xs">배경 이미지 업로드</span>
                <span className="text-[10px] text-slate-400">1920×1080 권장 · 5MB 이하</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">배경 이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 아브렐슈드 레이드 배경"
          maxLength={40}
          className="w-full h-11 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>

      {/* 가격 */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">가격 (포인트)</label>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="1000"
          inputMode="numeric"
          className="w-full h-11 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        배경 등록
      </button>
    </div>
  );
}
