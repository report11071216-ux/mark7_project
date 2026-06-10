"use client";

import { useRef } from "react";
import Link from "next/link";
import GuildCard from "@/components/guild/GuildCard";

export type TrendingItem = {
  id: string;
  code: string;
  name: string;
  server: string | null;
  grade: string;
  markUrl: string | null;
  tierLabel: string;
  tierColor: string;
  memberCount: number;
  maxMembers: number;
  description: string;
};

export default function TrendingGuildsMarquee({ items }: { items: TrendingItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  // 무한 흐름용: 목록을 두 번 이어붙임
  const loop = items.concat(items);

  // 한 바퀴 시간(초): 카드 수에 비례 (카드당 4초, 최소 24초)
  const duration = Math.max(items.length * 4, 24);

  function pause() {
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
  }
  function resume() {
    if (trackRef.current) trackRef.current.style.animationPlayState = "running";
  }

  return (
    <div
      style={{ overflow: "hidden", position: "relative" }}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div
        ref={trackRef}
        className="trending-track"
        style={{
          display: "flex",
          gap: 12,
          width: "max-content",
          animation: `trending-scroll ${duration}s linear infinite`,
        }}
      >
        {loop.map((g, i) => (
          <Link
            key={g.id + "-" + i}
            href={"/guild/" + g.code}
            aria-hidden={i >= items.length}
            tabIndex={i >= items.length ? -1 : 0}
            style={{ width: 300, flexShrink: 0, display: "block" }}
          >
            <div>
              <GuildCard
                guildName={g.name}
                server={g.server ? g.server + " 서버" : undefined}
                grade={g.grade}
                markUrl={g.markUrl}
                tierLabel={g.tierLabel}
                tierColor={g.tierColor}
                memberCount={g.memberCount}
                maxMembers={g.maxMembers}
              />
            </div>
            {g.description ? (
              <p className="text-xs text-slate-500 mt-1.5 px-0.5 truncate">
                {g.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes trending-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
