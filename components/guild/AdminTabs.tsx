"use client";

import { useState } from "react";
import { Palette, Megaphone, MessageCircle, AlertTriangle } from "lucide-react";

type TabKey = "appearance" | "recruit" | "discord" | "danger";

type Props = {
  appearance: React.ReactNode;
  recruit: React.ReactNode;
  discord: React.ReactNode;
  danger: React.ReactNode | null;
};

export default function AdminTabs({ appearance, recruit, discord, danger }: Props) {
  const [tab, setTab] = useState<TabKey>("appearance");

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "appearance", label: "꾸미기", icon: Palette },
    { key: "recruit", label: "모집", icon: Megaphone },
    { key: "discord", label: "디스코드", icon: MessageCircle },
  ];
  if (danger) {
    tabs.push({ key: "danger", label: "위험", icon: AlertTriangle });
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Palette className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">관리자 패널</h1>
          <p className="text-sm text-slate-500">길드 운영 설정</p>
        </div>
      </div>

      {/* 탭 바 */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-colors " +
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

      {/* 탭 내용 */}
      <div>
        {tab === "appearance" ? appearance : null}
        {tab === "recruit" ? recruit : null}
        {tab === "discord" ? discord : null}
        {tab === "danger" ? danger : null}
      </div>
    </div>
  );
}
