"use client";

import { useState } from "react";
import { Users, ChevronDown } from "lucide-react";

type Sibling = {
  name: string;
  characterClass: string;
  itemLevel: number;
  serverName: string;
};

type Props = {
  characters: Sibling[];
  repName: string;
};

export default function SiblingCharacters({ characters, repName }: Props) {
  const [open, setOpen] = useState(false);

  const others = (Array.isArray(characters) ? characters : []).filter(
    (c) => c.name !== repName
  );

  if (others.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          보유 캐릭터 목록 ({others.length})
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {others.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {c.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {c.characterClass || "직업 미상"}
                  {c.serverName ? ` · ${c.serverName}` : ""}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-bold text-blue-600">
                Lv {Math.floor(c.itemLevel).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
