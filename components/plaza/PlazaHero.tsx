import Link from "next/link";
import { Sparkles, Shield, Megaphone, ChevronRight } from "lucide-react";
import { getPatchTagMeta } from "@/lib/patch-note-tags";
import { formatNumber } from "@/lib/utils";

type HeroSetting = {
  active?: boolean;
  image_url?: string;
  title?: string;
  subtitle?: string;
  show_stats?: boolean;
};

type LatestPatch = {
  title: string;
  tag: string;
} | null;

type Props = {
  setting: HeroSetting | null;
  guildCount: number;
  memberCount: number;
  todayAttendance: number;
  latestPatch: LatestPatch;
  isLoggedIn: boolean;
};

export default function PlazaHero({
  setting,
  guildCount,
  memberCount,
  todayAttendance,
  latestPatch,
  isLoggedIn,
}: Props) {
  const active = setting?.active ?? true;
  if (!active) return null;

  const imageUrl = setting?.image_url ?? "";
  const title = setting?.title || "길드패스";
  const subtitle = setting?.subtitle || "출석 · 레이드 · 랭킹 · 포인트샵까지. 우리 길드의 모든 활동을 한 페이지에서.";
  const showStats = setting?.show_stats ?? true;

  const patchMeta = latestPatch ? getPatchTagMeta(latestPatch.tag) : null;

  return (
    <div className="mb-5">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={
          imageUrl
            ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundColor: "#6d28d9" }
        }
      >
        {/* 가독성 오버레이 */}
        <div
          className="absolute inset-0"
          style={{
            background: imageUrl
              ? "linear-gradient(90deg, rgba(30,10,60,0.82) 0%, rgba(30,10,60,0.45) 60%, rgba(30,10,60,0.25) 100%)"
              : "linear-gradient(90deg, rgba(0,0,0,0.18), rgba(0,0,0,0))",
          }}
        />

        {/* 장식 (이미지 없을 때만) */}
        {!imageUrl && (
          <>
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/[0.06]" />
            <Shield className="absolute right-10 top-1/2 -translate-y-1/2 w-28 h-28 text-white/[0.08]" />
          </>
        )}

        <div className="relative z-10 px-6 py-7 md:px-8 md:py-8 text-white">
          <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>로스트아크 길드 운영, 한 곳에서</span>
          </div>

          <h2 className="text-2xl md:text-[26px] font-bold leading-tight mb-1.5">{title}</h2>
          <p className="text-sm text-white/85 max-w-lg leading-relaxed">{subtitle}</p>

          {showStats && (
            <div className="flex items-center gap-6 mt-5">
              <div>
                <p className="text-2xl md:text-[28px] font-bold leading-none">
                  {formatNumber(guildCount)}<span className="text-sm text-white/70 ml-1">개</span>
                </p>
                <p className="text-[11px] text-white/70 mt-1.5">활동 길드</p>
              </div>
              <div className="w-px h-9 bg-white/25" />
              <div>
                <p className="text-2xl md:text-[28px] font-bold leading-none">
                  {formatNumber(memberCount)}<span className="text-sm text-white/70 ml-1">명</span>
                </p>
                <p className="text-[11px] text-white/70 mt-1.5">길드원</p>
              </div>
              <div className="w-px h-9 bg-white/25" />
              <div>
                <p className="text-2xl md:text-[28px] font-bold leading-none">
                  {formatNumber(todayAttendance)}<span className="text-sm text-white/70 ml-1">회</span>
                </p>
                <p className="text-[11px] text-white/70 mt-1.5">오늘 출석</p>
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mt-5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-violet-700 hover:bg-white/90 transition-colors"
            >
              디스코드로 시작하기
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* 패치노트 미리보기 (배너 아래 붙임) */}
      {latestPatch && patchMeta && (
        <Link
          href="/patch-notes"
          className="flex items-center gap-3 mt-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 transition-colors"
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ backgroundColor: patchMeta.bg }}
          >
            <Megaphone className="w-4 h-4" style={{ color: patchMeta.text }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold" style={{ color: patchMeta.text }}>{patchMeta.label}</span>
              <span className="text-[11px] text-slate-400">새 업데이트</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate">{latestPatch.title}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </Link>
      )}
    </div>
  );
}
