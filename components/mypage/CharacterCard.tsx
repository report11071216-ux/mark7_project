"use client";

import { useState } from "react";
import { Sword, Zap, Star, Server } from "lucide-react";
import ArmoryModal from "./ArmoryModal";

type Props = {
  name: string;
  characterClass: string;
  serverName: string;
  itemLevel: number;
  combatPower: number;
  expeditionLevel: number;
  imageUrl: string | null;
  syncedAt: string | null;
  frameUrl?: string | null;
};

export default function CharacterCard({
  name,
  characterClass,
  serverName,
  itemLevel,
  combatPower,
  expeditionLevel,
  imageUrl,
  syncedAt,
  frameUrl,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const cpText =
    combatPower > 0
      ? combatPower.toLocaleString("ko-KR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";
  const ilvlText =
    itemLevel > 0
      ? itemLevel.toLocaleString("ko-KR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";

  const hasBg = !!frameUrl;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="relative w-full rounded-xl overflow-hidden bg-zinc-950 border border-amber-500/20 shadow-[0_6px_28px_rgba(245,158,11,0.1)] cursor-pointer hover:border-amber-400/40 transition-all group"
      >
        {/* 배경 이미지 (장착 시) */}
        {hasBg && (
          <>
            <img
              src={frameUrl!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}

        {/* 배경 없을 때 기본 장식 */}
        {!hasBg && (
          <>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_50%,rgba(245,158,11,0.04),transparent)]" />
          </>
        )}

        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <span className="text-[9px] font-mono text-amber-400/80 bg-black/50 px-2 py-0.5 rounded-full border border-amber-500/20">
            전투정보실 보기
          </span>
        </div>

        <div className="relative flex items-stretch min-h-[104px]">
          {/* 좌측 캐릭터 이미지 */}
          <div className={`relative w-[92px] shrink-0 overflow-hidden ${
            hasBg ? "" : "bg-gradient-to-br from-zinc-900 to-zinc-950 border-r border-amber-500/10"
          }`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[104px] object-contain object-bottom"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sword className="w-8 h-8 text-amber-500/30" />
              </div>
            )}
          </div>

          {/* 우측 정보 */}
          <div className="flex-1 px-4 py-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[9px] font-mono text-amber-300/80 uppercase tracking-[0.15em]">
                  {characterClass}
                </p>
                <span className="text-white/20 text-[9px]">·</span>
                <div className="flex items-center gap-0.5">
                  <Server className="w-2.5 h-2.5 text-zinc-400" />
                  <p className="text-[9px] font-mono text-zinc-400">{serverName}</p>
                </div>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {name}
              </h2>
            </div>

            <div className="flex items-end gap-3.5 mt-2">
              <div>
                <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  전투력
                </p>
                <p className="text-[17px] font-bold text-amber-400 leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {cpText}
                </p>
              </div>

              <div className="h-8 w-px bg-white/15" />

              <div>
                <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                  <Sword className="w-2.5 h-2.5 text-zinc-300" />
                  아이템
                </p>
                <p className="text-[14px] font-bold text-zinc-100 leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {ilvlText}
                </p>
              </div>

              <div className="h-8 w-px bg-white/15" />

              <div>
                <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 text-zinc-300" />
                  원정대
                </p>
                <p className="text-[14px] font-bold text-zinc-100 leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  Lv.{expeditionLevel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!hasBg && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        )}
      </div>

      <ArmoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        characterName={name}
        characterClass={characterClass}
        imageUrl={imageUrl}
      />
    </>
  );
}
