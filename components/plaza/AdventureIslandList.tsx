"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type IslandItem = {
  name: string;
  times: string[];
  icon: string | null;
};

export default function AdventureIslandList({ items }: { items: IslandItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 3);
  const hasMore = items.length > 3;

  if (items.length === 0) {
    return (
      <p className="text-xs text-slate-400 text-center py-4">
        오늘 모험섬 정보가 없어요
      </p>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {visible.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {item.icon ? (
              <img
                src={item.icon}
                alt={item.name}
                className="w-8 h-8 rounded-md object-cover ring-1 ring-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-blue-50 ring-1 ring-blue-100 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {item.name}
              </p>
              <p className="text-[10px] font-mono text-blue-600">
                {item.times.join(" · ")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-[11px] font-mono text-slate-400 hover:text-blue-600 transition-colors"
        >
          {expanded ? (
            <>접기 <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>{items.length - 3}개 더보기 <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
}
