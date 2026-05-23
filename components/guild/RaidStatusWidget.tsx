"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CalendarDays, ChevronDown, ChevronUp, Check, X } from "lucide-react";

type RaidMember = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  confirmed: boolean;
};

type Raid = {
  id: string;
  title: string;
  raid_date: string;
  raid_time: string | null;
  difficulty: string | null;
  members: RaidMember[];
  max_members: number;
};

type Props = { raids: Raid[]; guildCode: string };

export default function RaidStatusWidget({ raids, guildCode }: Props) {
  const [expanded, setExpanded] = useState<string | null>(raids[0]?.id ?? null);

  if (raids.length === 0) {
    return (
      <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-violet-400" />
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider leading-none mb-0.5">RAID STATUS</p>
            <h3 className="text-sm font-bold text-white">레이드 현황</h3>
          </div>
        </div>
        <p className="text-xs text-zinc-500 text-center py-4">예정된 레이드가 없어요</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-violet-400" />
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider leading-none mb-0.5">RAID STATUS</p>
          <h3 className="text-sm font-bold text-white">레이드 현황</h3>
        </div>
      </div>
      <div className="space-y-2">
        {raids.map((raid) => {
          const isOpen = expanded === raid.id;
          const confirmed = raid.members.filter((m) => m.confirmed).length;
          const fillRate = Math.round((confirmed / (raid.max_members || 8)) * 100);

          return (
            <div key={raid.id} className="rounded-lg border border-zinc-800 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : raid.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800/40 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{raid.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-mono text-zinc-500">{raid.raid_date}</p>
                    {raid.raid_time && (
                      <p className="text-[10px] font-mono text-zinc-500">{raid.raid_time}</p>
                    )}
                    {raid.difficulty && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300">
                        {raid.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-violet-300 font-mono">{confirmed}/{raid.max_members}</p>
                  <p className="text-[10px] font-mono text-zinc-500">{fillRate}%</p>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-zinc-800/50">
                  <div className="w-full bg-zinc-800 rounded-full h-1 mt-2 mb-3">
                    <div
                      className="bg-violet-500 h-1 rounded-full transition-all"
                      style={{ width: `${fillRate}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {raid.members.map((m) => (
                      <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-800/30">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[9px] font-mono text-violet-300 shrink-0">
                            {m.username?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="text-xs text-zinc-300 truncate flex-1">{m.username ?? "Unknown"}</span>
                        {m.confirmed
                          ? <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          : <X className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
