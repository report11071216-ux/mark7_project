"use client";

import { useState } from "react";
import { Users, ArrowDownUp } from "lucide-react";

export type MemberRow = {
  userId: string;
  name: string;
  characterClass: string;
  role: "dealer" | "support" | null;
  itemLevel: number | null;
  guildRole: string;
  points: number;
  joinedAt: string;
  attendanceCount: number;
  raidCount: number;
  markUrl: string;
  cardBgUrl: string;
};

type SortKey = "points" | "itemLevel" | "joinedAt";

type Props = {
  guildName: string;
  memberCount: number;
  members: MemberRow[];
  primaryColor: string;
  backgroundColor: string;
};

function isLightColor(hex: string) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function roleLabel(guildRole: string): string {
  if (guildRole === "master") return "마스터";
  if (guildRole === "submaster") return "부마스터";
  return "길드원";
}

function joinedLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yy = String(d.getFullYear()).slice(2);
  return `${yy}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function MembersList({
  guildName,
  memberCount,
  members,
  primaryColor,
  backgroundColor,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("points");

  const isLight = isLightColor(backgroundColor);
  const textPrimary = isLight ? "#111827" : "#ffffff";
  const textSecondary = isLight ? "#6b7280" : "#a1a1aa";
  const textTertiary = isLight ? "#9ca3af" : "#71717a";
  const cardBg = isLight ? "#ffffff" : "#18181b";
  const cardBorder = isLight ? "#e5e7eb" : "#27272a";
  const chipBg = isLight ? "#f3f4f6" : "#27272a";
  const accent = primaryColor;

  const sorted = [...members].sort((a, b) => {
    if (sortKey === "points") return b.points - a.points;
    if (sortKey === "itemLevel") return (b.itemLevel ?? 0) - (a.itemLevel ?? 0);
    // joinedAt: 먼저 가입한 순(오래된 순)
    return (a.joinedAt || "").localeCompare(b.joinedAt || "");
  });

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "points", label: "포인트" },
    { key: "itemLevel", label: "아이템레벨" },
    { key: "joinedAt", label: "가입순" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="max-w-[900px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: accent }} />
            <h1 className="text-lg font-bold" style={{ color: textPrimary }}>멤버</h1>
            <span className="text-sm font-mono" style={{ color: textSecondary }}>{memberCount}명</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDownUp className="w-3.5 h-3.5" style={{ color: textTertiary }} />
            {sortButtons.map((b) => {
              const active = sortKey === b.key;
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setSortKey(b.key)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={
                    active
                      ? { backgroundColor: accent + "22", color: accent, border: `1px solid ${accent}66` }
                      : { backgroundColor: cardBg, color: textSecondary, border: `1px solid ${cardBorder}` }
                  }
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border py-16 text-center" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: textTertiary }} />
            <p className="text-sm" style={{ color: textSecondary }}>아직 멤버가 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((m, idx) => {
              const rankColor = idx === 0 ? accent : textTertiary;
              const initial = m.name.charAt(0);
              return (
                <div
                  key={m.userId}
                  className="relative flex items-center gap-3 rounded-xl border px-4 py-3 overflow-hidden"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  {/* 카드배경 코스메틱 (은은하게) */}
                  {m.cardBgUrl ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${m.cardBgUrl})`, opacity: isLight ? 0.08 : 0.18 }}
                      />
                    </>
                  ) : null}

                  {/* 순위 */}
                  <div
                    className="relative font-mono text-sm font-bold w-5 text-center shrink-0"
                    style={{ color: rankColor }}
                  >
                    {idx + 1}
                  </div>

                  {/* 아바타 (장착 마크 우선) */}
                  <div className="relative shrink-0">
                    {m.markUrl ? (
                      <img
                        src={m.markUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: accent }}
                      >
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* 이름 + 직업/가입일 */}
                  <div className="relative min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate" style={{ color: textPrimary }}>{m.name}</span>
                      {m.guildRole !== "member" ? (
                        <span
                          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={
                            m.guildRole === "master"
                              ? { backgroundColor: "#fef3c7", color: "#92400e" }
                              : { backgroundColor: accent + "22", color: accent }
                          }
                        >
                          {roleLabel(m.guildRole)}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs truncate" style={{ color: textSecondary }}>
                      {m.characterClass || "캐릭터 미연동"}
                      {m.joinedAt ? ` · ${joinedLabel(m.joinedAt)} 가입` : ""}
                    </div>
                  </div>

                  {/* 스탯 칩 */}
                  <div className="relative flex gap-1.5 shrink-0 flex-wrap justify-end">
                    <span className="text-[11px] font-mono px-2 py-1 rounded-md" style={{ backgroundColor: chipBg, color: textPrimary }}>
                      Lv {m.itemLevel != null ? Math.floor(m.itemLevel).toLocaleString() : "—"}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-1 rounded-md" style={{ backgroundColor: accent + "22", color: accent }}>
                      {m.points.toLocaleString()}P
                    </span>
                    <span className="text-[11px] font-mono px-2 py-1 rounded-md" style={{ backgroundColor: chipBg, color: textSecondary }}>
                      출석 {m.attendanceCount}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-1 rounded-md" style={{ backgroundColor: chipBg, color: textSecondary }}>
                      레이드 {m.raidCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
