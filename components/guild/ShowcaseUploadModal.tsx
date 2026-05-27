"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Megaphone, X, ImagePlus } from "lucide-react";
import { uploadShowcase } from "@/app/guild/[code]/showcase/actions";

type Props = {
  guildCode: string;
  alreadyToday: boolean;
};

export default function ShowcaseUploadModal({ guildCode, alreadyToday }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await uploadShowcase(guildCode, fd);
    setUploading(false);
    if (res.ok) {
      toast.success("포럼에 길드를 자랑했어요!");
      close();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-30 right-4 bottom-64 md:right-8 md:bottom-40 flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Megaphone className="w-4 h-4" />
        포럼 자랑
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">포럼으로 내보내기</h2>
              <button
                type="button"
                onClick={close}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {alreadyToday ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    오늘은 이미 길드를 자랑했어요.
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    내일 오전 6시 이후 다시 올릴 수 있어요.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={pickFile}
                    className="hidden"
                  />

                  {preview ? (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="block w-full rounded-xl overflow-hidden border border-slate-200"
                    >
                      <img src={preview} alt="미리보기" className="w-full object-contain max-h-64" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 w-full h-40 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-medium">이미지 선택</span>
                    </button>
                  )}

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    길드 홈 화면을 캡처해서 올려보세요. 광장에 길드를 자랑할 수 있어요.
                    <br />
                    하루 1장, 매일 오전 6시 초기화 · 최대 5MB
                  </p>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={close}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-bold disabled:opacity-40 hover:bg-sky-700 transition-colors"
                    >
                      {uploading ? "올리는 중..." : "포럼에 올리기"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
