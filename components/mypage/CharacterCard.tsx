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

  // ───── 프레임 장착 버전 ─────
  if (frameUrl) {
    return (
      <>
        <div
          onClick={() => setModalOpen(true)}
          className="relative w-full overflow-hidden cursor-pointer group"
          style={{ aspectRatio: "3 / 2" }}
        >
          {/* 프레임 배경 이미지 */}
          <img
            src={frameUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* 호버 힌트 */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <span className="text-[10px] font-mono text-white/90 bg-black/50 px-2 py-0.5 rounded-full">
              전투정보실 보기
            </span>
          </div>

          <div className="relative h-full flex items-center">
            {/* 좌측 — 캐릭터 이미지 (프레임 육각형 영역 안에) */}
            <div className="relative w-[28%] h-full shrink-0 flex items-center justify-center">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={name}
                  className="max-h-[60%] max-w-[78%] object-contain"
                  style={{
                    maskImage:
                      "radial-gradient(ellipse 70% 80% at 50% 45%, black 55%, transparent 80%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse 70% 80% at 50% 45%, black 55%, transparent 80%)",
                  }}
                />
              )}
            </div>

            {/* 우측 — 정보 */}
            <div className="flex-1 flex flex-col justify-center pr-[14%] pl-1 -mt-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[9px] font-mono text-amber-300/90 uppercase tracking-[0.15em] drop-shadow">
                  {characterClass}
                </p>
                <span className="text-white/30 text-[9px]">·</span>
                <div className="flex items-center gap-0.5">
                  <Server className="w-2.5 h-2.5 text-white/50" />
                  <p className="text-[9px] font-mono text-white/60">{serverName}</p>
                </div>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-2.5">
                {name}
              </h2>

              <div className="flex items-end gap-3.5">
                <div>
                  <p className="text-[8px] font-mono text-white/50 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-300" />
                    전투력
                  </p>
                  <p className="text-[17px] font-bold text-amber-300 leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    {cpText}
                  </p>
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div>
                  <p className="text-[8px] font-mono text-white/50 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                    <Sword className="w-2.5 h-2.5 text-white/60" />
                    아이템
                  </p>
                  <p className="text-[14px] font-bold text-white leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    {ilvlText}
                  </p>
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div>
                  <p className="text-[8px] font-mono text-white/50 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-white/60" />
                    원정대
                  </p>
                  <p className="text-[14px] font-bold text-white leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    Lv.{expeditionLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>
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

  // ───── 기본 골드 카드 (프레임 미장착) ─────
  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-amber-500/20 shadow-[0_8px_40px_rgba(245,158,11,0.12)] cursor-pointer hover:border-amber-400/40 hover:shadow-[0_8px_48px_rgba(245,158,11,0.2)] transition-all group"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_50%,rgba(245,158,11,0.04),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_20%_50%,rgba(245,158,11,0.06),transparent)]" />

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <span className="text-[10px] font-mono text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            전투정보실 보기
          </span>
        </div>

        <div className="relative flex items-stretch min-h-[140px]">
          <div className="relative w-[120px] shrink-0 bg-gradient-to-br from-zinc-900 to-zinc-950 border-r border-amber-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent)]" />
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[140px] object-contain object-bottom"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sword className="w-10 h-10 text-amber-500/30" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <div className="w-5 h-5 border border-amber-500/30 rotate-45 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-amber-500/20" />
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-[0.2em]">
                  {characterClass}
                </p>
                <span className="text-amber-500/20">·</span>
                <div className="flex items-center gap-1">
                  <Server className="w-2.5 h-2.5 text-zinc-500" />
                  <p className="text-[10px] font-mono text-zinc-500">{serverName}</p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{name}</h2>
            </div>

            <div className="flex items-end gap-5 mt-4">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  전투력
                </p>
                <p className="text-[22px] font-bold text-amber-400 leading-none tracking-tight">
                  {cpText}
                </p>
              </div>

              <div className="h-10 w-px bg-amber-500/10" />

              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sword className="w-2.5 h-2.5 text-zinc-400" />
                  아이템 레벨
                </p>
                <p className="text-[18px] font-bold text-zinc-200 leading-none tracking-tight">
                  {ilvlText}
                </p>
              </div>

              <div className="h-10 w-px bg-amber-500/10" />

              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-zinc-400" />
                  원정대
                </p>
                <p className="text-[18px] font-bold text-zinc-200 leading-none tracking-tight">
                  Lv.{expeditionLevel}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-20">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-px bg-amber-400"
                style={{ width: i % 2 === 0 ? "16px" : "10px" }}
              />
            ))}
          </div>

          <div className="absolute bottom-3 right-4">
            <p className="text-[9px] font-mono text-amber-500/30 uppercase tracking-[0.15em]">
              GUILD PASS
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
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
