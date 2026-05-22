"use client";

import { useState, useEffect } from "react";
import { X, Sword, Gem, BookOpen, Layers, CreditCard, RefreshCw } from "lucide-react";
import { fetchArmoryData } from "@/app/mypage/actions";

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
  { key: "engraving", label: "각인", icon: BookOpen },
  { key: "arkpassive", label: "아크패시브", icon: Layers },
  { key: "card", label: "카드", icon: CreditCard },
];

const GRADE_COLOR: { [key: string]: string } = {
  일반: "text-slate-400",
  고급: "text-green-400",
  희귀: "text-blue-400",
  영웅: "text-violet-400",
  전설: "text-orange-400",
  유물: "text-red-400",
  고대: "text-yellow-300",
  에스더: "text-cyan-300",
};

const GRADE_RING: { [key: string]: string } = {
  일반: "ring-slate-600",
  고급: "ring-green-500",
  희귀: "ring-blue-500",
  영웅: "ring-violet-500",
  전설: "ring-orange-400",
  유물: "ring-red-400",
  고대: "ring-yellow-300",
  에스더: "ring-cyan-300",
};

const EQUIP_ORDER = ["무기", "투구", "어깨", "상의", "하의", "장갑"];

export default function ArmoryModal({
  open,
  onClose,
  characterName,
  characterClass,
  imageUrl,
}: Props) {
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

  const equipment = (armory?.ArmoryEquipment ?? []) as any[];
  const gems = (armory?.ArmoryGem?.Gems ?? []) as any[];
  const gemEffects = (armory?.ArmoryGem?.Effects ?? []) as any[];
  const engravings = (armory?.ArmoryEngraving?.Engravings ?? []) as any[];
  const engravingEffects = (armory?.ArmoryEngraving?.Effects ?? []) as any[];
  const arkPassive = armory?.ArkPassive ?? null;
  const cards = (armory?.ArmoryCard?.Cards ?? []) as any[];
  const cardEffects = (armory?.ArmoryCard?.Effects ?? []) as any[];

  const sortedEquip = EQUIP_ORDER.map(
    (type) => equipment.find((e: any) => e.Type === type) ?? null
  );

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
            <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-[0.2em]">
              {characterClass}
            </p>
            <h2 className="text-base font-bold text-white truncate">{characterName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-5 py-3 border-b border-zinc-800 shrink-0 overflow-x-auto">
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
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-zinc-500">데이터를 불러올 수 없어요</p>
            </div>
          ) : (
            <>
              {/* ── 장비 ── */}
              {activeTab === "equipment" && (
                <div className="grid grid-cols-2 gap-3">
                  {sortedEquip.map((item, i) => {
                    if (!item) return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 opacity-40">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0" />
                        <div>
                          <p className="text-[10px] font-mono text-zinc-600">{EQUIP_ORDER[i]}</p>
                          <p className="text-xs text-zinc-600">장착 없음</p>
                        </div>
                      </div>
                    );
                    return (
                      <div key={item.Type} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition">
                        <img
                          src={item.Icon}
                          alt={item.Name}
                          className={`w-12 h-12 rounded-lg object-cover ring-2 shrink-0 ${GRADE_RING[item.Grade] ?? "ring-zinc-700"}`}
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-zinc-500 mb-0.5">{item.Type}</p>
                          <p className={`text-xs font-bold truncate ${GRADE_COLOR[item.Grade] ?? "text-zinc-400"}`}>
                            {item.Name}
                          </p>
                          <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{item.Grade}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── 보석 ── */}
              {activeTab === "gem" && (
                <div>
                  {gems.length === 0 ? (
                    <EmptyState text="장착된 보석이 없어요" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {gems.map((gem: any, i: number) => {
                        const effect = gemEffects.find((e: any) => e.GemType === gem.Type);
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <div className="relative shrink-0">
                              <img src={gem.Icon} alt={gem.Name} className="w-12 h-12 rounded-lg object-cover ring-2 ring-zinc-700" />
                              <span className="absolute -top-1 -right-1 text-[10px] font-mono font-bold text-white bg-zinc-950 border border-zinc-700 rounded px-1">
                                {gem.Level}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-300 truncate">{gem.Name}</p>
                              {effect && (
                                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                                  {effect.Name}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── 각인 ── */}
              {activeTab === "engraving" && (
                <div className="space-y-4">
                  {engravingEffects.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-2">
                        활성 각인 효과
                      </p>
                      <div className="space-y-2">
                        {engravingEffects.map((e: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            {e.Icon && (
                              <img src={e.Icon} alt={e.Name} className="w-9 h-9 rounded-lg object-cover ring-1 ring-zinc-700 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-200 truncate">{e.Name}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{e.Description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {engravings.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        각인 목록
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {engravings.map((e: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                            {e.Icon && (
                              <img src={e.Icon} alt={e.Name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-zinc-300 truncate">{e.Name}</p>
                              <p className="text-[10px] font-mono text-amber-400">{e.Tooltip}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {engravingEffects.length === 0 && engravings.length === 0 && (
                    <EmptyState text="각인 데이터가 없어요" />
                  )}
                </div>
              )}

              {/* ── 아크패시브 ── */}
              {activeTab === "arkpassive" && (
                <div>
                  {!arkPassive ? (
                    <EmptyState text="아크패시브 데이터가 없어요" />
                  ) : (
                    <div className="space-y-4">
                      {["Enlightenment", "Evolution", "Leap"].map((key) => {
                        const section = arkPassive[key];
                        if (!section || section.length === 0) return null;
                        const labels: { [key: string]: string } = {
                          Enlightenment: "깨달음",
                          Evolution: "진화",
                          Leap: "도약",
                        };
                        return (
                          <div key={key}>
                            <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-2">
                              {labels[key]}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {section.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                                  {item.Icon && (
                                    <img src={item.Icon} alt={item.Name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-zinc-300 truncate">{item.Name}</p>
                                    <p className="text-[10px] font-mono text-amber-400">Lv.{item.Level}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── 카드 ── */}
              {activeTab === "card" && (
                <div className="space-y-4">
                  {cardEffects.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-2">
                        활성 카드 효과
                      </p>
                      <div className="space-y-2">
                        {cardEffects.map((e: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                            <p className="text-xs font-bold text-zinc-200 mb-0.5">{e.CardSlots}세트</p>
                            <p className="text-[11px] text-zinc-500">{e.Items?.[0]?.Description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {cards.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">보유 카드</p>
                      <div className="grid grid-cols-3 gap-2">
                        {cards.map((card: any, i: number) => (
                          <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                            {card.Icon && (
                              <img src={card.Icon} alt={card.Name} className="w-12 h-16 object-cover rounded-md ring-1 ring-zinc-700" />
                            )}
                            <p className="text-[10px] text-zinc-400 leading-tight truncate w-full">{card.Name}</p>
                            <p className="text-[10px] font-mono text-amber-400">{card.AwakeCount}각</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {cards.length === 0 && cardEffects.length === 0 && (
                    <EmptyState text="카드 데이터가 없어요" />
                  )}
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
