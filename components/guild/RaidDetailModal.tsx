"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Coins, Gift, TrendingUp, Swords, Loader2, PenLine, Crown, Users } from "lucide-react";
import { getRaidDetail, type RaidDetail, type RaidGuide } from "@/app/guild/[code]/raids/actions";
import { formatNumber, getRelativeTime } from "@/lib/utils";
import RaidGuideEditor from "@/components/guild/RaidGuideEditor";

type Props = {
  guildCode: string;
  raidId: string;
  onClose: () => void;
};

type GuideType = "leader" | "normal";

export default function RaidDetailModal({ guildCode, raidId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [raid, setRaid] = useState<RaidDetail | null>(null);
  const [guides, setGuides] = useState<RaidGuide[]>([]);
  const [tab, setTab] = useState<GuideType>("leader");
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await getRaidDetail(guildCode, raidId);
      if (result.success) {
        setRaid(result.raid);
        setGuides(result.guides);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raidId]);

  const currentGuide = guides.find((g) => g.guide_type === tab) ?? null;

  const handleSaved = () => {
    setEditing(false);
    setLoading(true);
    load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
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
            <div className="relative h-40 bg-slate-100">
              {raid.image_url ? (
                <img src={raid.image_url} alt={raid.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Swords className="w-10 h-10 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <h2 className="absolute bottom-3 left-4 right-12 text-lg font-bold text-white truncate">{raid.title}</h2>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 수치 4종 */}
            <div className="grid grid-cols-2 gap-2 p-4">
              <StatBox icon={<Coins className="w-4 h-4" />} label="클리어 골드" value={goldText(raid)} accent="amber" />
              <StatBox icon={<TrendingUp className="w-4 h-4" />} label="적정 레벨" value={raid.rec_item_level ? formatNumber(raid.rec_item_level) : "—"} accent="violet" />
              <StatBox icon={<Swords className="w-4 h-4" />} label="적정 전투력" value={raid.rec_combat_power ? formatNumber(raid.rec_combat_power) : "—"} accent="cyan" />
              <StatBox icon={<Gift className="w-4 h-4" />} label="획득 재화" value={raid.reward_materials || "—"} accent="rose" small />
            </div>

            {/* 공략 탭 */}
            <div className="px-4">
              <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
                <TabButton active={tab === "leader"} onClick={() => { setTab("leader"); setEditing(false); }} icon={<Crown className="w-3.5 h-3.5" />} label="공대장용" />
                <TabButton active={tab === "normal"} onClick={() => { setTab("normal"); setEditing(false); }} icon={<Users className="w-3.5 h-3.5" />} label="일반용" />
              </div>
            </div>

            {/* 공략 본문 / 에디터 */}
            <div className="p-4">
              {editing ? (
                <RaidGuideEditor
                  guildCode={guildCode}
                  raidId={raidId}
                  guideType={tab}
                  initialContent={currentGuide?.content ?? ""}
                  initialImages={currentGuide?.image_urls ?? []}
                  onSaved={handleSaved}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <>
                  {currentGuide && (currentGuide.content || currentGuide.image_urls.length > 0) ? (
                    <div className="space-y-3">
                      {currentGuide.content && (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{currentGuide.content}</p>
                      )}
                      {currentGuide.image_urls.map((url, i) => (
                        <img key={url} src={url} alt={`공략 이미지 ${i + 1}`} className="w-full rounded-xl border border-slate-200" />
                      ))}
                      <p className="text-[11px] text-slate-400 font-mono pt-1">
                        {currentGuide.updated_by_name ? `${currentGuide.updated_by_name} · ` : ""}
                        {currentGuide.updated_at ? getRelativeTime(currentGuide.updated_at) : ""} 수정
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">{tab === "leader" ? "공대장용" : "일반용"} 공략이 아직 없어요</p>
                      <p className="text-xs text-slate-400 mt-1">길드원 누구나 작성할 수 있어요</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-4 w-full h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition flex items-center justify-center gap-1.5"
                  >
                    <PenLine className="w-4 h-4" />
                    {currentGuide && (currentGuide.content || currentGuide.image_urls.length > 0) ? "공략 수정" : "공략 작성"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function goldText(raid: RaidDetail) {
  const parts: string[] = [];
  if (raid.gold_normal) parts.push(`노 ${formatNumber(raid.gold_normal)}`);
  if (raid.gold_hard) parts.push(`하 ${formatNumber(raid.gold_hard)}`);
  if (raid.gold_nightmare) parts.push(`나 ${formatNumber(raid.gold_nightmare)}`);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

function StatBox({
  icon, label, value, accent, small,
}: {
  icon: React.ReactNode; label: string; value: string; accent: string; small?: boolean;
}) {
  const colorMap: { [key: string]: string } = {
    amber: "text-amber-600 bg-amber-50",
    violet: "text-violet-600 bg-violet-50",
    cyan: "text-cyan-600 bg-cyan-50",
    rose: "text-rose-600 bg-rose-50",
  };
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-6 h-6 rounded-md flex items-center justify-center ${colorMap[accent]}`}>{icon}</span>
        <span className="text-[11px] font-bold text-slate-500">{label}</span>
      </div>
      <p className={`font-bold text-slate-900 ${small ? "text-xs leading-snug" : "text-sm"}`}>{value}</p>
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
      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-bold transition ${
        active ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
