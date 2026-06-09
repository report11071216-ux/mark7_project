"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowDownUp, Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { setMemberTitle } from "@/app/guild/[code]/members/actions";

export type MemberRow = {
  userId: string;
  name: string;
  characterClass: string;
  role: "dealer" | "support" | null;
  itemLevel: number | null;
  guildRole: string;
  title: string | null;
  points: number;
  joinedAt: string;
  attendanceCount: number;
  raidCount: number;
  markUrl: string;
  cardBgUrl: string;
  nicknameColor: string | null;
};

type SortKey = "points" | "itemLevel" | "joinedAt";

type Props = {
  guildCode: string;
  guildId: string;
  myRole: string;
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
  guildCode,
  guildId,
  myRole,
  guildName,
  memberCount,
  members,
  primaryColor,
  backgroundColor,
}: Props) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const canEditTitle = myRole === "master" || myRole === "submaster";

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
    return (a.joinedAt || "").localeCompare(b.joinedAt || "");
  });

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "points", label: "포인트" },
    { key: "itemLevel", label: "아이템레벨" },
    { key: "joinedAt", label: "가입순" },
  ];

  function startEdit(m: MemberRow) {
    setEditing(m.userId);
    setDraft(m.title ?? "");
  }

  function cancelEdit() {
    setEditing(null);
    setDraft("");
  }

  async function saveTitle(targetUserId: string) {
    if (saving) return;
    setSaving(true);
    const res = await setMemberTitle(guildCode, guildId, targetUserId, draft);
    setSaving(false);
    if (res.ok) {
      toast.success(draft.trim() ? "직위가 설정됐어요" : "직위를 해제했어요");
      setEditing(null);
      setDraft("");
      router.refresh();
    } else {
      toast.error(res.error ?? "설정 실패");
    }
  }

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
              const isEditingThis = editing === m.userId;
              return (
                <div
                  key={m.userId}
                  className="relative flex items-center gap-3 rounded-xl border px-4 py-3 overflow-hidden"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  {m.cardBgUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${m.cardBgUrl})`, opacity: isLight ? 0.08 : 0.18 }}
                    />
                  ) : null}

                  <div
                    className="relative font-mono text-sm font-bold w-5 text-center shrink-0"
                    style={{ color: rankColor }}
                  >
                    {idx + 1}
                  </div>

                  <div className="relative shrink-0">
                    {m.markUrl ? (
                      <img src={m.markUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: accent }}
                      >
                        {initial}
                      </div>
                    )}
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium truncate" style={{ color: m.nicknameColor ?? textPrimary }}>{m.name}</span>

                      {/* 역할 뱃지 (마스터/부마만) */}
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

                      {/* 직위 뱃지 (있을 때) */}
                      {m.title ? (
                        <span
                          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{ backgroundColor: chipBg, color: textSecondary }}
                        >
                          {m.title}
                        </span>
                      ) : null}

                      {/* 직위 설정 버튼 (마스터/부마만) */}
                      {canEditTitle && !isEditingThis ? (
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
                          style={{ color: textTertiary }}
                          title="직위 설정"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>

                    {/* 인라인 직위 편집 */}
                    {isEditingThis ? (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          maxLength={20}
                          placeholder="직위 입력 (예: 사장)"
                          className="text-xs px-2 py-1 rounded-md outline-none flex-1 min-w-0"
                          style={{ backgroundColor: chipBg, color: textPrimary, border: `1px solid ${cardBorder}` }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveTitle(m.userId)}
                          disabled={saving}
                          className="shrink-0 p-1 rounded-md"
                          style={{ backgroundColor: accent + "22", color: accent }}
                          title="저장"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="shrink-0 p-1 rounded-md"
                          style={{ backgroundColor: chipBg, color: textSecondary }}
                          title="취소"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs truncate" style={{ color: textSecondary }}>
                        {m.characterClass || "캐릭터 미연동"}
                        {m.joinedAt ? ` · ${joinedLabel(m.joinedAt)} 가입` : ""}
                      </div>
                    )}
                  </div>

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
