"use client";

import { useState, useTransition } from "react";
import { saveGuildAppearance } from "./actions";
import { Palette, Save, Loader2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";

const PRESET_COLORS = [
  { label: "바이올렛", primary: "#7c3aed", bg: "#09090b" },
  { label: "블루", primary: "#2563eb", bg: "#0f172a" },
  { label: "에메랄드", primary: "#059669", bg: "#0a0f0d" },
  { label: "로즈", primary: "#e11d48", bg: "#0f0a0b" },
  { label: "앰버", primary: "#d97706", bg: "#0f0d09" },
  { label: "사이안", primary: "#0891b2", bg: "#080f14" },
  { label: "라이트", primary: "#2563eb", bg: "#f8fafc" },
  { label: "그린카페", primary: "#16a34a", bg: "#ffffff" },
];

type Props = {
  guildId: string;
  guildCode: string;
  initialPrimary: string;
  initialBg: string;
  initialWelcome: string;
  initialBanner: string;
};

function AdminPanelInner({ guildId, guildCode, initialPrimary, initialBg, initialWelcome, initialBanner }: Props) {
  const [primary, setPrimary] = useState(initialPrimary);
  const [bg, setBg] = useState(initialBg);
  const [welcome, setWelcome] = useState(initialWelcome);
  const [banner, setBanner] = useState(initialBanner);
  const [isPending, startTransition] = useTransition();

  function applyPreset(p: typeof PRESET_COLORS[0]) {
    setPrimary(p.primary);
    setBg(p.bg);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveGuildAppearance(guildId, guildCode, {
          primary_color: primary,
          background_color: bg,
          welcome_message: welcome,
          banner_url: banner,
        });
        toast.success("저장됐어요");
      } catch {
        toast.error("저장에 실패했어요");
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* 헤더 */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href={`/guild/${guildCode}`}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              GUILD ADMIN
            </p>
            <h1 className="text-base font-bold text-white">길드 관리자 패널</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* 미리보기 */}
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">PREVIEW</p>
          <div
            className="rounded-xl overflow-hidden ring-1 ring-zinc-700"
            style={{ backgroundColor: bg }}
          >
            <div
              className="h-2"
              style={{ backgroundColor: primary }}
            />
            <div className="p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: primary + "33" }}
              >
                <Palette className="w-6 h-6" style={{ color: primary }} />
              </div>
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: bg === "#ffffff" || bg === "#f8fafc" ? "#111" : "#fff" }}
                >
                  길드명 미리보기
                </p>
                <p className="text-xs mt-0.5" style={{ color: primary }}>
                  {primary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 프리셋 */}
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">COLOR PRESETS</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((p) => {
              const isSelected = primary === p.primary && bg === p.bg;
              return (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={
                    "relative p-3 rounded-xl border-2 transition-all hover:scale-[1.02] " +
                    (isSelected ? "border-white/30" : "border-transparent hover:border-white/10")
                  }
                  style={{ backgroundColor: p.bg === "#ffffff" || p.bg === "#f8fafc" ? "#f8fafc" : p.bg }}
                >
                  <div
                    className="w-full h-1.5 rounded-full mb-2"
                    style={{ backgroundColor: p.primary }}
                  />
                  <p
                    className="text-[10px] font-bold"
                    style={{ color: p.bg === "#ffffff" || p.bg === "#f8fafc" ? "#111" : "#fff" }}
                  >
                    {p.label}
                  </p>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 컬러 직접 지정 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">CUSTOM COLORS</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">포인트 컬러</label>
              <div className="flex items-center gap-2">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-zinc-700 shrink-0">
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
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">배경 컬러</label>
              <div className="flex items-center gap-2">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-zinc-700 shrink-0">
                  <div className="w-full h-full" style={{ backgroundColor: bg }} />
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <input
                  type="text"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 환영 메시지 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">WELCOME MESSAGE</p>
          <textarea
            value={welcome}
            onChange={(e) => setWelcome(e.target.value)}
            placeholder="길드 환영 메시지를 입력해주세요"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
          />
          <p className="text-[11px] text-zinc-600 mt-1 text-right">{welcome.length}자</p>
        </div>

        {/* 배너 URL */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">BANNER URL</p>
          <input
            type="url"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <p className="text-[11px] text-zinc-600 mt-1">길드 홈 상단 배너 이미지 URL</p>
        </div>

        {/* 저장 */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition disabled:opacity-40"
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          저장
        </button>
      </div>
    </div>
  );
}

export default function GuildAdminPage() {
  const params = useParams();
  const code = (params.code as string ?? "").toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <GuildAdminLoader code={code} />
    </div>
  );
}

function GuildAdminLoader({ code }: { code: string }) {
  return (
    <div className="text-zinc-500 text-sm">
      페이지를 불러오는 중...
    </div>
  );
}
