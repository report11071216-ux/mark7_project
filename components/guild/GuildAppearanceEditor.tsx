"use client";

import { useState, useRef, useTransition } from "react";
import { saveGuildAppearance, uploadGuildBanner } from "@/app/guild/[code]/admin/actions";
import { Palette, Save, Loader2, Check, ArrowLeft, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const ACCENT_PRESETS = [
  { label: "바이올렛", value: "#7c3aed" },
  { label: "블루", value: "#2563eb" },
  { label: "에메랄드", value: "#059669" },
  { label: "로즈", value: "#e11d48" },
  { label: "앰버", value: "#d97706" },
  { label: "사이안", value: "#0891b2" },
];

type Props = {
  guildId: string;
  guildCode: string;
  initialPrimary: string;
  initialBg: string;
  initialWelcome: string;
  initialBanner: string;
};

export default function GuildAppearanceEditor({
  guildId, guildCode, initialPrimary, initialBg, initialWelcome, initialBanner,
}: Props) {
  const [primary, setPrimary] = useState(initialPrimary);
  const [welcome, setWelcome] = useState(initialWelcome);
  const [banner, setBanner] = useState(initialBanner);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // 배경은 라이트 고정. 기존 값이 라이트 계열이면 유지, 아니면 기본 라이트로.
  const bgToSave =
    initialBg && (initialBg.toLowerCase() === "#ffffff" || initialBg.toLowerCase() === "#f8fafc")
      ? initialBg
      : "#f8fafc";

  function handleSave() {
    startTransition(async () => {
      try {
        await saveGuildAppearance(guildId, guildCode, {
          primary_color: primary,
          background_color: bgToSave,
          welcome_message: welcome,
          banner_url: banner,
        });
        toast.success("저장됐어요");
      } catch {
        toast.error("저장에 실패했어요");
      }
    });
  }

  async function pickBanner(e: React.ChangeEvent<HTMLInputElement>) {
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
    const res = await uploadGuildBanner(guildId, fd);
    setUploading(false);
    if (res.ok) {
      setBanner(res.url);
      toast.success("배너를 올렸어요. 저장을 눌러 적용하세요.");
    } else {
      toast.error(res.error);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href={`/guild/${guildCode}`}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">GUILD ADMIN</p>
            <h1 className="text-base font-bold text-slate-900">길드 관리자 패널</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* 미리보기 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">PREVIEW</p>
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <div className="h-1.5" style={{ backgroundColor: primary }} />
            <div className="p-5 flex items-center gap-4 bg-white">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: primary + "1f" }}>
                <Palette className="w-5 h-5" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">길드 페이지 미리보기</p>
                <p className="text-xs mt-0.5 font-mono" style={{ color: primary }}>{primary}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 포인트 컬러 프리셋 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">ACCENT COLOR</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {ACCENT_PRESETS.map((p) => {
              const isSelected = primary.toLowerCase() === p.value.toLowerCase();
              return (
                <button
                  key={p.label}
                  onClick={() => setPrimary(p.value)}
                  className="text-center group"
                >
                  <div
                    className={
                      "relative h-11 rounded-lg transition-all " +
                      (isSelected ? "ring-2 ring-offset-2 ring-slate-900" : "ring-1 ring-slate-200 group-hover:ring-slate-400")
                    }
                    style={{ backgroundColor: p.value }}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" style={{ color: p.value }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">{p.label}</p>
                </button>
              );
            })}
          </div>

          {/* 직접 입력 */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-500 block mb-2">직접 입력</label>
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-slate-200 shrink-0">
                <div className="w-full h-full" style={{ backgroundColor: primary }} />
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <input
                type="text"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* 환영 메시지 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">WELCOME MESSAGE</p>
          <textarea
            value={welcome}
            onChange={(e) => setWelcome(e.target.value)}
            placeholder="신규 멤버에게 보여줄 환영 메시지"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
          />
          <p className="text-[11px] text-slate-400 mt-1 text-right">{welcome.length}자</p>
        </div>

        {/* 배너 업로드 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">BANNER IMAGE</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickBanner}
            className="hidden"
          />
          {banner ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
              <img src={banner} alt="배너 미리보기" className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-bold hover:bg-slate-100"
                >
                  {uploading ? "올리는 중..." : "변경"}
                </button>
                <button
                  type="button"
                  onClick={() => setBanner("")}
                  className="px-3 py-1.5 rounded-lg bg-white text-rose-600 text-xs font-bold hover:bg-rose-50 inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> 제거
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-7 h-7" />
                  <span className="text-sm font-medium">이미지 선택</span>
                </>
              )}
            </button>
          )}
          <p className="text-[11px] text-slate-400 mt-2">길드 홈 상단 배너 · 권장 가로 길게 · 최대 5MB</p>
        </div>

        {/* 저장 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending || uploading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition disabled:opacity-40"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
