"use client";
import { useState, useRef, useTransition } from "react";
import toast from "react-hot-toast";
import { uploadHeroImage, saveHero } from "./actions";
import { ImagePlus, Loader2 } from "lucide-react";

type HeroValue = {
  active: boolean;
  image_url: string;
  title: string;
  subtitle: string;
  show_stats: boolean;
};

export default function PlazaHeroEditor({ initial }: { initial: HeroValue }) {
  const [form, setForm] = useState<HeroValue>(initial);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("이미지 파일만 가능해요.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("이미지는 5MB 이하만 가능해요.");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("image", f);
    const res = await uploadHeroImage(fd);
    setUploading(false);
    if (res.ok) {
      setForm((prev) => ({ ...prev, image_url: res.url }));
      toast.success("이미지가 업로드되었어요. 저장을 눌러 반영하세요.");
    } else {
      toast.error(res.error);
    }
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveHero(form);
      if (res.ok) {
        toast.success("저장되었어요. 광장에 반영됩니다.");
      } else {
        toast.error(res.error ?? "저장 실패");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* 미리보기 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-bold text-zinc-900 mb-3">배너 미리보기</p>
        <div
          className="relative rounded-xl overflow-hidden p-6 text-white"
          style={{
            backgroundColor: "#6d28d9",
            backgroundImage: form.image_url ? `url(${form.image_url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15))" }} />
          <div className="relative z-10">
            <p className="text-2xl font-bold mb-1">{form.title || "제목"}</p>
            <p className="text-sm text-white/90 max-w-md">{form.subtitle || "부제목"}</p>
            {form.show_stats && (
              <div className="flex gap-5 mt-4 text-sm">
                <span className="font-bold">67<span className="text-white/70 text-xs ml-0.5">개 길드</span></span>
                <span className="font-bold">176<span className="text-white/70 text-xs ml-0.5">명</span></span>
                <span className="font-bold">42<span className="text-white/70 text-xs ml-0.5">명 출석</span></span>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-400 mt-2">통계 숫자는 예시이며, 실제 광장에선 실시간 값이 표시됩니다.</p>
      </div>

      {/* 이미지 업로드 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-bold text-zinc-900 mb-3">배경 이미지</p>
        <input ref={inputRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 hover:border-violet-400 hover:text-violet-500 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-sm font-medium">업로드 중...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-7 h-7" />
              <span className="text-sm font-medium">이미지 선택 (최대 5MB)</span>
            </>
          )}
        </button>
        {form.image_url && (
          <p className="text-xs text-zinc-500 mt-2 break-all">현재 이미지: {form.image_url}</p>
        )}
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          가로로 긴 이미지를 권장해요 (예: 1600×400). 저작권 자유 이미지만 사용하세요.
        </p>
      </div>

      {/* 문구 + 옵션 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <div>
          <label className="text-sm font-bold text-zinc-900">제목</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            placeholder="길드패스"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-zinc-900">부제목 (슬로건)</label>
          <textarea
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            rows={2}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm resize-y"
            placeholder="출석 · 레이드 · 랭킹 · 포인트샵까지."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.show_stats}
            onChange={(e) => setForm({ ...form, show_stats: e.target.checked })}
          />
          실시간 통계 표시 (길드 수 · 길드원 · 오늘 출석)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          배너 노출 (체크 해제 시 광장에서 숨김)
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || uploading}
        className="w-full h-11 rounded-lg bg-violet-600 text-white text-sm font-bold disabled:opacity-60"
      >
        {isPending ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
