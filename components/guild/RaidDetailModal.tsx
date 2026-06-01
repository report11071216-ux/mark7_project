"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Gift, TrendingUp, Swords, Loader2, PenLine, Crown, Users, Settings2 } from "lucide-react";
import { getRaidDetail, type RaidDetail, type RaidGuide } from "@/app/guild/[code]/raids/actions";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import RaidGuideEditor from "@/components/guild/RaidGuideEditor";
import RaidInfoEditor from "@/components/guild/RaidInfoEditor";

type Props = {
  guildCode: string;
  raidId: string;
  onClose: () => void;
};

type GuideType = "leader" | "normal";

const DIFF = [
  { key: "gold_normal", label: "노말", dot: "#eab308", text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  { key: "gold_hard", label: "하드", dot: "#ef4444", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  { key: "gold_nightmare", label: "나메", dot: "#8b5cf6", text: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
] as const;

export default function RaidDetailModal({ guildCode, raidId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [raid, setRaid] = useState<RaidDetail | null>(null);
  const [guides, setGuides] = useState<RaidGuide[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [tab, setTab] = useState<GuideType>("leader");
  const [editingGuide, setEditingGuide] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await getRaidDetail(guildCode, raidId);
      if (result.success) {
        setRaid(result.raid);
        setGuides(result.guides);
        setIsStaff(result.isStaff);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raidId]);

  const currentGuide = guides.find((g) => g.guide_type === tab) ?? null;

  const handleGuideSaved = () => {
    setEditingGuide(false);
    setLoading(true);
    load();
  };
  const handleInfoSaved = () => {
    setEditingInfo(false);
    setLoading(true);
    load();
  };

  const hasGuide = !!(currentGuide && (currentGuide.content || currentGuide.image_urls.length > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : !raid ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">레이드 정보를 불러오지 못했어요</p>
            <button onClick={onClose} className="mt-4 px-4 h-10 rounded-lg bg-slate-100 text-sm font-bold text-slate-600">닫기</button>
          </div>
        ) : (
          <>
            {/* 헤더 이미지 */}
            <div className="relative h-44">
              {raid.image_url ? (
                <img src={raid.image_url} alt={raid.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-violet-700">
                  <Swords className="w-10 h-10 text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition backdrop-blur-sm"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <p className="text-[11px] font-mono text-white/70 uppercase tracking-widest mb-0.5">RAID</p>
                <h2 className="text-xl font-bold text-white leading-tight truncate">{raid.title}</h2>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {editingInfo ? (
                <RaidInfoEditor
                  guildCode={guildCode}
                  raid={raid}
                  onSaved={handleInfoSaved}
                  onCancel={() => setEditingInfo(false)}
                />
              ) : (
                <>
                  {/* 클리어 골드 — 난이도별 색상 칩 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">클리어 골드</p>
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => setEditingInfo(true)}
                          className="flex items-center gap-1 text-[11px] font-bold text-violet-500 hover:text-violet-600 transition"
                        >
                          <Settings2 className="w-3 h-3" />
                          정보 수정
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DIFF.map((d) => {
                        const val = raid[d.key as keyof RaidDetail] as number | null;
                        if (!val) return null;
                        return (
                          <div key={d.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${d.bg} ${d.border}`}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.dot }} />
                            <span className={`text-xs font-bold ${d.text}`}>{d.label}</span>
                            <span className="text-sm font-bold text-slate-900 font-mono">{formatNumber(val)}<span className="text-[10px] text-slate-400 ml-0.5">G</span></span>
                          </div>
                        );
                      })}
                      {!raid.gold_normal && !raid.gold_hard && !raid.gold_nightmare && (
                        <p className="text-xs text-slate-400 py-1">골드 정보 없음</p>
                      )}
                    </div>
                  </div>

                  {/* 적정 스펙 + 재화 */}
                  <div className="grid grid-cols-3 gap-2">
                    <SpecBox icon={<TrendingUp className="w-3.5 h-3.5" />} label="적정 레벨" value={raid.rec_item_level ? formatNumber(raid.rec_item_level) : "—"} />
                    <SpecBox icon={<Swords className="w-3.5 h-3.5" />} label="적정 전투력" value={raid.rec_combat_power ? formatNumber(raid.rec_combat_power) : "—"} />
                    <SpecBox icon={<Gift className="w-3.5 h-3.5" />} label="획득 재화" value={raid.reward_materials || "—"} small />
                  </div>

                  {/* 공략 탭 */}
                  <div>
                    <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 mb-3">
                      <TabButton active={tab === "leader"} onClick={() => { setTab("leader"); setEditingGuide(false); }} icon={<Crown className="w-3.5 h-3.5" />} label="공대장용" />
                      <TabButton active={tab === "normal"} onClick={() => { setTab("normal"); setEditingGuide(false); }} icon={<Users className="w-3.5 h-3.5" />} label="일반용" />
                    </div>

                    {editingGuide ? (
                      <RaidGuideEditor
                        guildCode={guildCode}
                        raidId={raidId}
                        guideType={tab}
                        initialContent={currentGuide?.content ?? ""}
                        initialImages={currentGuide?.image_urls ?? []}
                        onSaved={handleGuideSaved}
                        onCancel={() => setEditingGuide(false)}
                      />
                    ) : (
                      <>
                        {hasGuide ? (
                          <div className="space-y-3">
                            {currentGuide!.content && (
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{currentGuide!.content}</p>
                            )}
                            {currentGuide!.image_urls.map((url, i) => (
                              <img key={url} src={url} alt={`공략 이미지 ${i + 1}`} className="w-full rounded-xl border border-slate-200" />
                            ))}
                            <p className="text-[11px] text-slate-400 font-mono pt-1">
                              {currentGuide!.updated_by_name ? `${currentGuide!.updated_by_name} · ` : ""}
                              {currentGuide!.updated_at ? getRelativeTime(currentGuide!.updated_at) : ""} 수정
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                            <p className="text-sm text-slate-500">{tab === "leader" ? "공대장용" : "일반용"} 공략이 아직 없어요</p>
                            <p className="text-xs text-slate-400 mt-1">길드원 누구나 작성할 수 있어요</p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingGuide(true)}
                          className="mt-3 w-full h-11 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition flex items-center justify-center gap-1.5"
                        >
                          <PenLine className="w-4 h-4" />
                          {hasGuide ? "공략 수정" : "공략 작성"}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SpecBox({
  icon, label, value, small,
}: {
  icon: React.ReactNode; label: string; value: string; small?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1 text-slate-400 mb-1.5">
        {icon}
        <span className="text-[10px] font-bold">{label}</span>
      </div>
      <p className={`font-bold text-slate-900 ${small ? "text-[11px] leading-snug break-words" : "text-base font-mono"}`}>{value}</p>
    </div>
  );
}

function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-bold transition ${
        active ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
