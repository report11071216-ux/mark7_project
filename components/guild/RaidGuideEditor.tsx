"use client";

import { useState, useTransition, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ImagePlus, X, Loader2, Check } from "lucide-react";
import { saveRaidGuide } from "@/app/guild/[code]/raids/actions";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  raidId: string;
  guideType: "leader" | "normal";
  initialContent: string;
  initialImages: string[];
  onSaved: () => void;
  onCancel: () => void;
};

const MAX_IMAGES = 10;

export default function RaidGuideEditor({
  guildCode, raidId, guideType, initialContent, initialImages, onSaved, onCancel,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function getClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      toast.error(`이미지는 최대 ${MAX_IMAGES}장까지예요`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const supabase = getClient();
    const newUrls: string[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 올릴 수 있어요");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 은 5MB를 넘어요`);
        continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `guides/${guildCode}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("raid-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`업로드 실패: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("raid-images").getPublicUrl(path);
      if (data?.publicUrl) newUrls.push(data.publicUrl);
    }

    setImageUrls((prev) => prev.concat(newUrls));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSave = () => {
    if (!content.trim() && imageUrls.length === 0) {
      toast.error("내용이나 이미지를 추가하세요");
      return;
    }
    if (uploading) {
      toast.error("이미지 업로드가 끝날 때까지 기다려주세요");
      return;
    }
    startTransition(async () => {
      const result = await saveRaidGuide(guildCode, {
        raidId,
        guideType,
        content: content.trim(),
        imageUrls,
      });
      if (result.success) {
        toast.success("공략이 저장되었어요");
        onSaved();
      } else {
        toast.error(result.error ?? "저장에 실패했어요");
      }
    });
  };

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={guideType === "leader" ? "공대장용 공략 (트라이 순서, 포지션 지정, 컷타임 등)" : "일반용 공략 (패턴 설명, 주의할 점 등)"}
        rows={6}
        className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-y leading-relaxed"
      />

      {/* 이미지 */}
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1.5">
          이미지 <span className="text-slate-400 font-normal">({imageUrls.length}/{MAX_IMAGES})</span>
        </p>
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {imageUrls.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                <img src={url} alt={`이미지 ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {imageUrls.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-16 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-500 transition flex flex-col items-center justify-center gap-1 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[11px] font-bold">업로드 중...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4" />
                <span className="text-[11px] font-bold">이미지 추가</span>
              </>
            )}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-10 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || uploading}
          className="flex-1 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          저장
        </button>
      </div>
    </div>
  );
}
