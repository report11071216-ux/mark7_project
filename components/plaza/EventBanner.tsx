"use client";

import { useState } from "react";
import { PartyPopper } from "lucide-react";

export type PlazaEvent = {
  link: string;
  title: string;
  thumbnail: string | null;
  endDate: string | null;
};

const MAX_SHOWN = 5;
const LOSTARK_EVENT_PAGE = "https://lostark.game.onstove.com/News/Event/Now";

function endLabel(iso: string | null): string {
  if (!iso) return "";
  const end = new Date(iso);
  if (!Number.isFinite(end.getTime())) return "";

  const now = Date.now();
  const diffMs = end.getTime() - now;
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDay = Math.ceil(diffMs / dayMs);

  // 종료일 텍스트 (KST 기준 월/일)
  const md = end.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });

  if (diffMs <= 0) return md + " 종료";
  if (diffDay <= 7) return "~ " + md + " · D-" + diffDay;
  return "~ " + md;
}

function isEndingSoon(iso: string | null): boolean {
  if (!iso) return false;
  const end = new Date(iso).getTime();
  if (!Number.isFinite(end)) return false;
  const diffDay = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
  return diffDay >= 0 && diffDay <= 3;
}

export default function EventBanner({ events }: { events: PlazaEvent[] }) {
  const list = Array.isArray(events) ? events : [];
  const shown = list.slice(0, MAX_SHOWN);
  const hasMore = list.length > MAX_SHOWN;

  function open(url: string) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (shown.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <PartyPopper className="w-4 h-4 text-plaza-accent" />
        <h2 className="text-base font-bold text-plaza-ink">진행 중인 이벤트</h2>
        <div className="flex-1 h-px bg-plaza-line ml-2" />
        <button
          onClick={() => open(LOSTARK_EVENT_PAGE)}
          className="text-xs font-bold text-plaza-ink-dim hover:text-plaza-accent transition-colors shrink-0"
        >
          {hasMore ? "더보기 →" : "공식 →"}
        </button>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:[grid-template-columns:repeat(var(--ev-cols),minmax(0,1fr))]"
        style={{ ["--ev-cols" as any]: Math.min(shown.length, MAX_SHOWN) }}
      >
        {shown.map((ev) => {
          const ending = isEndingSoon(ev.endDate);
          return (
            <button
              key={ev.link}
              onClick={() => open(ev.link)}
              className="group block text-left rounded-xl ring-1 ring-plaza-line bg-plaza-surface overflow-hidden hover:ring-plaza-accent transition"
            >
              <div className="relative aspect-square bg-plaza-surface-2 overflow-hidden">
                {ev.thumbnail ? (
                  <img
                    src={ev.thumbnail}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PartyPopper className="w-6 h-6 text-plaza-ink-dim" />
                  </div>
                )}
                {ending ? (
                  <span className="absolute top-1.5 left-1.5 rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    마감임박
                  </span>
                ) : null}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-bold text-plaza-ink leading-snug line-clamp-2 group-hover:text-plaza-accent transition-colors">
                  {ev.title}
                </p>
                {ev.endDate ? (
                  <p className="text-[10px] text-plaza-ink-dim mt-1">
                    {endLabel(ev.endDate)}
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
