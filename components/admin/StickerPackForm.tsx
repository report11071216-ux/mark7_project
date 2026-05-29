"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createStickerPack } from "@/app/admin/stickers/actions";
import toast from "react-hot-toast";

const SLOT_COUNT = 5;

export default function StickerPackForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [stickerUrls, setStickerUrls] = useState<string[]>(Array(SLOT_COUNT).fill(""));
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const slotRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    const ext = file.name.split(".").pop() || "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("stickers").upload(path, file);
    if (error) {
      toast.error("업로드 실패: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("stickers").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingCover(true);
    const url = await uploadFile(f);
    setUploadingCover(false);
    if (url) setCoverUrl(url);
    if (coverRef.current) coverRef.current.value = "";
  }

  async function onSlot(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingIdx(idx);
    const url = await uploadFile(f);
    setUploadingIdx(null);
    if (url) {
      setStickerUrls((prev) => {
        const next = [...prev];
        next[idx] = url;
        return next;
      });
    }
    const ref = slotRefs.current[idx];
    if (ref) ref.value = "";
  }

  function clearSlot(idx: number) {
    setStickerUrls((prev) => {
      const next = [...prev];
      next[idx] = "";
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("팩 이름을 입력하세요"); return; }
    const priceNum = parseInt(price, 10);
    if (!priceNum || priceNum < 0) { toast.error("가격을 올바르게 입력하세요"); return; }
    if (!coverUrl) { toast.error("대표 이미지를 올려주세요"); return; }
    const filled = stickerUrls.filter((u) => u);
    if (filled.length !== SLOT_COUNT) {
      toast.error(`이모티콘 ${SLOT_COUNT}개를 모두 올려주세요`);
      return;
    }

    setSaving(true);
    const res = await createStickerPack({
      name: name.trim(),
      price: priceNum,
      coverUrl,
      stickerUrls: filled,
    });
    setSaving(false);

    if (res.ok) {
      toast.success("이모티콘팩이 등록됐어요!");
      setName("");
      setPrice("");
      setCoverUrl("");
      setStickerUrls(Array(SLOT_COUNT).fill(""));
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
      {/* 팩 이름 */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">팩 이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 모코코 이모티콘팩"
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
          placeholder="500"
          inputMode="numeric"
          className="w-full h-11 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>

      {/* 대표 이미지 */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">대표 이미지 (상점 썸네일)</label>
        <input ref={coverRef} type="file" accept="image/*" onChange={onCover} className="hidden" />
        {coverUrl ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
            <img src={coverUrl} alt="대표" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setCoverUrl("")}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            disabled={uploadingCover}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-violet-400 hover:text-violet-500 disabled:opacity-50"
          >
            {uploadingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImagePlus className="w-5 h-5" /><span className="text-[10px]">대표</span></>}
          </button>
        )}
      </div>

      {/* 이모티콘 5개 */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">이모티콘 5개</label>
        <div className="grid grid-cols-5 gap-2">
          {stickerUrls.map((url, idx) => (
            <div key={idx}>
              <input
                ref={(el) => { slotRefs.current[idx] = el; }}
                type="file"
                accept="image/*"
                onChange={(e) => onSlot(idx, e)}
                className="hidden"
              />
              {url ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                  <img src={url} alt={`이모티콘 ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => clearSlot(idx)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => slotRefs.current[idx]?.click()}
                  disabled={uploadingIdx === idx}
                  className="aspect-square w-full rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-violet-400 hover:text-violet-500 disabled:opacity-50"
                >
                  {uploadingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">정사각형 이미지 권장 · 각 5MB 이하</p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        이모티콘팩 등록
      </button>
    </div>
  );
}
