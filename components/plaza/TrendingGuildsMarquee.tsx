"use client";

import { useRef, useState } from "react";
import GuildCard from "@/components/guild/GuildCard";
import TrendingGuildModal from "./TrendingGuildModal";

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
  tags: string[];
  recruitMessage: string;
  discordUrl: string;
  design: { [effect: string]: any } | null;
  imageUrl?: string | null;
};

export default function TrendingGuildsMarquee({
  items,
  isLoggedIn,
}: {
  items: TrendingItem[];
  isLoggedIn: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<TrendingItem | null>(null);

  if (items.length === 0) return null;

  const loop = items.concat(items);
  const duration = Math.max(items.length * 8, 48);

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
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          width: "max-content",
          animation: `trending-scroll ${duration}s linear infinite`,
        }}
      >
        {loop.map((g, i) => (
          <button
            key={g.id + "-" + i}
            type="button"
            onClick={() => setSelected(g)}
            aria-hidden={i >= items.length}
            tabIndex={i >= items.length ? -1 : 0}
            className="text-left"
            style={{ width: 300, flexShrink: 0, display: "block", alignSelf: "flex-start" }}
          >
            <div>
              <GuildCard
                guildName={g.name}
                server={g.server ? g.server + " 서버" : undefined}
                grade={g.grade}
                markUrl={g.markUrl}
                imageUrl={g.imageUrl ?? null}
                tierLabel={g.tierLabel}
                tierColor={g.tierColor}
                memberCount={g.memberCount}
                maxMembers={g.maxMembers}
                design={g.design}
              />
            </div>
            {g.description ? (
              <p className="text-xs text-slate-500 mt-1.5 px-0.5 truncate">
                {g.description}
              </p>
            ) : null}
          </button>
        ))}
      </div>

      {selected ? (
        <TrendingGuildModal
          guild={selected}
          isLoggedIn={isLoggedIn}
          onClose={() => setSelected(null)}
        />
      ) : null}

      <style>{`
        @keyframes trending-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
