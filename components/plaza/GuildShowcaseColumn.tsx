"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export type ShowcaseItem = {
  id: string;
  guildCode: string;
  guildName: string;
  imageUrl: string;
};

const PER_PAGE = 4;
const ROTATE_MS = 5 * 60 * 1000;

export default function GuildShowcaseColumn({ items }: { items: ShowcaseItem[] }) {
  const [group, setGroup] = useState(0);
  const [zoom, setZoom] = useState<ShowcaseItem | null>(null);

  const groupCount = Math.max(1, Math.ceil(items.length / PER_PAGE));

  useEffect(() => {
    if (items.length <= PER_PAGE) return;
    const timer = setInterval(() => {
      setGroup((g) => (g + 1) % groupCount);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [items.length, groupCount]);

  const visible = items.slice(group * PER_PAGE, group * PER_PAGE + PER_PAGE);

  return (
    <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white">
      <div className="bg-slate-800 px-3 py-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white">길드 자랑</h3>
        {items.length > PER_PAGE && (
          <span className="text-[10px] font-mono text-slate-400">
            {group + 1}/{groupCount}
          </span>
        )}
      </div>

      <div className="p-3 space-y-2.5">
        {items.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center leading-relaxed py-4">
            아직 자랑한<br />길드가 없습니다
          </p>
        ) : (
          visible.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setZoom(it)}
              className="block w-full group"
            >
              <div className="aspect-square rounded-lg overflow-hidden ring-1 ring-slate-200 group-hover:ring-sky-400 transition-colors">
                <img
                  src={it.imageUrl}
                  alt={it.guildName}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] font-bold text-slate-700 truncate mt-1 text-center">
                {it.guildName}
              </p>
            </button>
          ))
        )}
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setZoom(null)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoom(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
              aria-label="닫기"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={zoom.imageUrl}
              alt={zoom.guildName}
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />
            <p className="text-center text-white font-bold mt-3">{zoom.guildName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
