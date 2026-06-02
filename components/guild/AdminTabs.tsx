// components/guild/AdminTabs.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Palette, Megaphone, MessageCircle, AlertTriangle, ArrowLeft, Users } from "lucide-react";

type TabKey = "appearance" | "members" | "recruit" | "discord" | "danger";

type Props = {
  guildCode: string;
  appearance: React.ReactNode;
  members: React.ReactNode;
  recruit: React.ReactNode;
  discord: React.ReactNode;
  danger: React.ReactNode | null;
};

export default function AdminTabs({ guildCode, appearance, members, recruit, discord, danger }: Props) {
  const [tab, setTab] = useState<TabKey>("appearance");

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "appearance", label: "꾸미기", icon: Palette },
    { key: "members", label: "멤버", icon: Users },
    { key: "recruit", label: "모집", icon: Megaphone },
    { key: "discord", label: "디스코드", icon: MessageCircle },
  ];
  if (danger) {
    tabs.push({ key: "danger", label: "위험", icon: AlertTriangle });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center gap-3 py-4">
            <Link
              href={`/guild/${guildCode}`}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">GUILD ADMIN</p>
              <h1 className="text-base font-bold text-slate-900">관리자 패널</h1>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-colors -mb-px " +
                    (active
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-400 hover:text-slate-600")
                  }
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {tab === "appearance" ? appearance : null}
        {tab === "members" ? members : null}
        {tab === "recruit" ? recruit : null}
        {tab === "discord" ? discord : null}
        {tab === "danger" ? danger : null}
      </div>
    </div>
  );
}
