"use client";

import { useState, useEffect } from "react";
import { X, Sword, Gem, BookOpen, Layers, CreditCard, RefreshCw, Zap, Grid3x3 } from "lucide-react";
import { fetchArmoryData } from "@/app/mypage/actions";

function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

function safeArray(val: any): any[] {
  return Array.isArray(val) ? val : [];
}

type Props = {
  open: boolean;
  onClose: () => void;
  characterName: string;
  characterClass: string;
  imageUrl: string | null;
};

const TABS = [
  { key: "equipment", label: "장비", icon: Sword },
  { key: "gem", label: "보석", icon: Gem },
  { key: "skill", label: "스킬", icon: Zap },
  { key: "engraving", label: "각인", icon: BookOpen },
  { key: "arkpassive", label: "아크패시브", icon: Layers },
  { key: "arkgrid", label: "아크그리드", icon: Grid3x3 },
  { key: "card", label: "카드", icon: CreditCard },
];

const GRADE_COLOR: { [key: string]: string } = {
  "일반": "text-slate-400",
  "고급": "text-green-400",
  "희귀": "text-blue-400",
  "영웅": "text-violet-400",
  "전설": "text-orange-400",
  "유물": "text-red-400",
  "고대": "text-yellow-300",
  "에스더": "text-cyan-300",
};

const GRADE_RING: { [key: string]: string } = {
  "일반": "ring-slate-600",
  "고급": "ring-green-500",
  "희귀": "ring-blue-500",
  "영웅": "ring-violet-500",
  "전설": "ring-orange-400",
  "유물": "ring-red-400",
  "고대": "ring-yellow-300",
  "에스더": "ring-cyan-300",
};

const ARK_POINT_STYLE: { [key: string]: { text: string; bg: string; border: string } } = {
  "진화": { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  "깨달음": { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  "도약": { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
};

const EQUIP_ORDER = ["무기", "투구", "어깨", "상의", "하의", "장갑"];

function gradeColor(grade: string) { return GRADE_COLOR[grade] ?? "text-zinc-400"; }
function gradeRing(grade: string) { return GRADE_RING[grade] ?? "ring-zinc-700"; }

export default function ArmoryModal({ open, onClose, characterName, characterClass, imageUrl }: Props) {
  const [activeTab, setActiveTab] = useState("equipment");
  const [armory, setArmory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    fetchArmoryData(characterName).then((data) => {
      setArmory(data);
      setLoading(false);
      setFetched(true);
    });
  }, [open, characterName, fetched]);

  if (!open) return null;

  // ── 안전한 배열 추출 (핵심 수정) ──
  const equipment = safeArray(armory?.ArmoryEquipment);
  const gems = safeArray(armory?.ArmoryGem?.Gems);
  const allSkills = safeArray(armory?.ArmorySkills);
  const arkPassiveEffects = safeArray(armory?.ArmoryEngraving?.ArkPassiveEffects);
  const engravingEffects = safeArray(armory?.ArmoryEngraving?.Effects);
  const cards = safeArray(armory?.ArmoryCard?.Cards);
  const cardEffects = safeArray(armory?.ArmoryCard?.Effects);
  const arkGridSections = safeArray(armory?.ArkGrid);

  // ArkPassive: { Title, IsArkPassive, Points: [...], Effects: [...] }
  const arkPassive = armory?.ArkPassive ?? null;
  const arkPassivePoints = safeArray(arkPassive?.Points);
  const arkPassiveAbilities = safeArray(arkPassive?.Effects);

  const sortedEquip = EQUIP_ORDER.map(
    (type) => equipment.find((e: any) => e.Type === type) ?? null
  );

  const activeSkills = allSkills
    .filter((s: any) => s.Level >= 4 || safeArray(s.Tripods).some((t: any) => t.IsSelected))
    .sort((a: any, b: any) => b.Level - a.Level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={characterName} className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-500/30" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
              <Sword className="w-5 h-5 text-amber-500/50" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-[0.2em]">{characterClass}</p>
            <h2 className="text-base font-bold text-white truncate">{characterName}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-4 py-3 border-b border-zinc-800 shrink-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-sm text-zinc-500 font-mono">전투정보실 불러오는 중...</p>
            </div>
          ) : !armory ? (
            <EmptyState text="데이터를 불러올 수 없어요" />
          ) : (
            <>
              {/* ── 장비 ── */}
              {activeTab === "equipment" && (
                <div className="grid grid-cols-2 gap-3">
                  {sortedEquip.map((item, i) => !item ? (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 opacity-40">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0" />
                      <div>
                        <p className="text-[10px] font-mono text-zinc-600">{EQUIP_ORDER[i]}</p>
                        <p className="text-xs text-zinc-600">장착 없음</p>
                      </div>
                    </div>
                  ) : (
                    <div key={item.Type} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition">
                      <img
                        src={item.Icon}
                        alt={stripHtml(item.Name)}
                        className={`w-12 h-12 rounded-lg object-cover ring-2 shrink-0 ${gradeRing(item.Grade)}`}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-zinc-500 mb-0.5">{item.Type}</p>
                        <p className={`text-xs font-bold truncate ${gradeColor(item.Grade)}`}>{stripHtml(item.Name)}</p>
                        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{item.Grade}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 보석 ── */}
              {activeTab === "gem" && (
                gems.length === 0 ? <EmptyState text="장착된 보석이 없어요" /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {gems.map((gem: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <div className="relative shrink-0">
                          <img
                            src={gem.Icon}
                            alt={`보석 슬롯 ${gem.Slot}`}
                            className={`w-12 h-12 rounded-lg object-cover ring-2 ${gradeRing(gem.Grade)}`}
                          />
                          <span className="absolute -top-1 -right-1 text-[10px] font-mono font-bold text-white bg-zinc-950 border border-zinc-700 rounded px-1">
                            {gem.Level}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${gradeColor(gem.Grade)}`}>{gem.Grade}</p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Lv.{gem.Level} 보석</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">슬롯 {gem.Slot + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── 스킬 ── */}
              {activeTab === "skill" && (
                activeSkills.length === 0 ? <EmptyState text="스킬 정보가 없어요" /> : (
                  <div className="space-y-3">
                    {activeSkills.map((skill: any, i: number) => {
                      const selectedTripods = safeArray(skill.Tripods).filter((t: any) => t.IsSelected);
                      return (
                        <div key={i} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                          <div className="flex items-center gap-3 mb-2">
                            <img src={skill.Icon} alt={skill.Name} className="w-10 h-10 rounded-lg object-cover ring-1 ring-zinc-700 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-zinc-200 truncate">{skill.Name}</p>
                                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                                  Lv.{skill.Level}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{skill.Type}</p>
                            </div>
                            {skill.Rune && (
                              <img src={skill.Rune.Icon} alt={skill.Rune.Name} className="w-8 h-8 rounded-md object-cover ring-1 ring-zinc-700 shrink-0" title={skill.Rune.Name} />
                            )}
                          </div>
                          {selectedTripods.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-1">
                              {selectedTripods.map((t: any, j: number) => (
                                <div key={j} className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-2 py-1">
                                  <img src={t.Icon} alt={t.Name} className="w-4 h-4 rounded object-cover" />
                                  <span className="text-[10px] font-bold text-zinc-300">{t.Name}</span>
                                  <span className="text-[9px] font-mono text-amber-400">T{t.Tier + 1}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* ── 각인 ── */}
              {activeTab === "engraving" && (
                <div className="space-y-4">
                  {arkPassiveEffects.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-2">아크패시브 각인</p>
                      <div className="space-y-2">
                        {arkPassiveEffects.map((e: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ring-2 bg-zinc-800 ${gradeRing(e.Grade)} ${gradeColor(e.Grade)}`}>
                              {e.Level}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className={`text-xs font-bold ${gradeColor(e.Grade)}`}>{e.Name}</p>
                                <span className="text-[10px] font-mono text-zinc-500">{e.Grade}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">{stripHtml(e.Description ?? "")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {engravingEffects.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">활성 각인</p>
                      <div className="space-y-2">
                        {engravingEffects.map((e: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            {e.Icon && <img src={e.Icon} alt={stripHtml(e.Name ?? "")} className="w-9 h-9 rounded-lg object-cover ring-1 ring-zinc-700 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-200 truncate">{stripHtml(e.Name ?? "")}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{stripHtml(e.Description ?? "")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {arkPassiveEffects.length === 0 && engravingEffects.length === 0 && (
                    <EmptyState text="각인 데이터가 없어요" />
                  )}
                </div>
              )}

              {/* ── 아크패시브 ── */}
              {activeTab === "arkpassive" && (
                !arkPassive ? <EmptyState text="아크패시브 데이터가 없어요" /> : (
                  <div className="space-y-5">
                    {/* 클래스 아이덴티티 + 포인트 */}
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">클래스 아이덴티티</p>
                      <p className="text-base font-bold text-amber-400 mb-4">{arkPassive.Title}</p>
                      <div className="grid grid-cols-3 gap-3">
                        {arkPassivePoints.map((pt: any, i: number) => {
                          const style = ARK_POINT_STYLE[pt.Name] ?? { text: "text-zinc-400", bg: "bg-zinc-800", border: "border-zinc-700" };
                          return (
                            <div key={i} className={`rounded-xl p-3 border ${style.bg} ${style.border}`}>
                              <p className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${style.text}`}>{pt.Name}</p>
                              <p className={`text-2xl font-bold font-mono ${style.text}`}>{pt.Value}</p>
                              <p className="text-[9px] text-zinc-600 mt-1">{pt.Description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 패시브 능력 */}
                    {arkPassiveAbilities.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">패시브 능력</p>
                        <div className="space-y-2">
                          {arkPassiveAbilities.map((e: any, i: number) => {
                            const style = ARK_POINT_STYLE[e.Name] ?? { text: "text-zinc-400", bg: "", border: "" };
                            return (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                                {e.Icon && <img src={e.Icon} alt="" className="w-9 h-9 rounded-lg object-cover ring-1 ring-zinc-700 shrink-0" />}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-zinc-200 truncate mb-0.5">{stripHtml(e.Description ?? "")}</p>
                                  <p className={`text-[10px] font-mono ${style.text}`}>{e.Name}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* ── 아크그리드 ── */}
              {activeTab === "arkgrid" && (
                arkGridSections.length === 0 ? <EmptyState text="아크그리드 데이터가 없어요" /> : (
                  <div className="space-y-6">
                    {arkGridSections.map((section: any, i: number) => {
                      const slots = safeArray(section.Slots);
                      const effects = safeArray(section.Effects);
                      if (slots.length === 0 && effects.length === 0) return null;
                      return (
                        <div key={i}>
                          {effects.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-2">스탯 효과</p>
                              <div className="grid grid-cols-2 gap-2">
                                {effects.map((e: any, j: number) => (
                                  <div key={j} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                                    <span className="text-[11px] font-bold text-zinc-300">{e.Name}</span>
                                    <span className="text-[10px] font-mono text-amber-400">Lv.{e.Level}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {slots.length > 0 && (
                            <div>
                              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">젬 슬롯</p>
                              <div className="grid grid-cols-4 gap-2">
                                {slots.map((slot: any, j: number) => (
                                  <div key={j} className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${slot.IsActive ? "bg-zinc-900 border-zinc-700" : "bg-zinc-900/50 border-zinc-800 opacity-50"}`}>
                                    <img src={slot.Icon} alt="" className={`w-10 h-10 rounded-lg object-cover ring-2 ${gradeRing(slot.Grade)}`} />
                                    <span className={`text-[9px] font-bold ${gradeColor(slot.Grade)}`}>{slot.Grade}</span>
                                    {slot.IsActive && <span className="text-[9px] font-mono text-amber-400">활성</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* ── 카드 ── */}
              {activeTab === "card" && (
                <div className="space-y-4">
                  {cardEffects.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-2">활성 카드 효과</p>
                      <div className="space-y-2">
                        {cardEffects.map((e: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <p className="text-xs font-bold text-zinc-200 mb-0.5">{e.CardSlots}세트</p>
                            <p className="text-[11px] text-zinc-500">{stripHtml(safeArray(e.Items)[0]?.Description ?? "")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {cards.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">보유 카드</p>
                      <div className="grid grid-cols-4 gap-2">
                        {cards.map((card: any, i: number) => (
                          <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                            {card.Icon && <img src={card.Icon} alt={stripHtml(card.Name ?? "")} className="w-12 h-16 object-cover rounded-md ring-1 ring-zinc-700" />}
                            <p className="text-[9px] text-zinc-400 leading-tight truncate w-full">{stripHtml(card.Name ?? "")}</p>
                            <p className="text-[9px] font-mono text-amber-400">{card.AwakeCount}각</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {cards.length === 0 && cardEffects.length === 0 && <EmptyState text="카드 데이터가 없어요" />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-sm text-zinc-600">{text}</p>
    </div>
  );
}
