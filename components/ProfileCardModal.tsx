"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Sword, Zap, Star, Server, Loader2 } from "lucide-react";
import { getPublicProfile, type PublicProfile } from "@/app/actions/profile-card";

type Props = {
  userId: string | null;
  onClose: () => void;
};

export default function ProfileCardModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    const result = await getPublicProfile(id);
    setLoading(false);
    if (result.success && result.profile) {
      setProfile(result.profile);
    } else {
      setError(result.error ?? "불러오지 못했어요");
    }
  }, []);

  useEffect(() => {
    if (userId) load(userId);
  }, [userId, load]);

  if (!userId) return null;

  const cpText =
    profile && profile.combat_power > 0
      ? profile.combat_power.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";
  const ilvlText =
    profile && profile.item_level > 0
      ? profile.item_level.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  const avatar = profile?.mark_url ?? profile?.avatar_url ?? null;
  const hasCard = !!profile?.card_url;
  const name = profile?.username ?? "이름없음";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-zinc-950 ring-1 ring-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 — 프로필카드 배경 + 마크 + 닉네임 */}
        <div className="relative">
          {hasCard && (
            <>
              <div className="absolute inset-0 bg-zinc-900" />
              <img src={profile!.card_url!} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/45" />
            </>
          )}
          {!hasCard && (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-cyan-500/20" />
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative flex flex-col items-center text-center px-5 py-6">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/40 mb-3">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-violet-500/40 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <p className="text-lg font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
              {name}
            </p>
          </div>
        </div>

        {/* 하단 — 캐릭터 정보 */}
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : error ? (
            <p className="text-sm text-zinc-500 text-center py-6">{error}</p>
          ) : profile && profile.main_character_name ? (
            <div className="space-y-4">
              {/* 직업 · 서버 */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-mono">
                <span className="text-amber-300/90">{profile.character_class ?? "—"}</span>
                <span className="text-zinc-600">·</span>
                <span className="flex items-center gap-0.5 text-zinc-400">
                  <Server className="w-2.5 h-2.5" />
                  {profile.server_name ?? "—"}
                </span>
              </div>

              {/* 캐릭터명 */}
              <p className="text-center text-sm font-bold text-white">
                {profile.main_character_name}
              </p>

              {/* 스펙 3종 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-zinc-900 ring-1 ring-zinc-800 p-2.5 text-center">
                  <p className="text-[8px] font-mono text-zinc-500 uppercase mb-1 flex items-center justify-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    전투력
                  </p>
                  <p className="text-sm font-bold text-amber-400 leading-none">{cpText}</p>
                </div>
                <div className="rounded-lg bg-zinc-900 ring-1 ring-zinc-800 p-2.5 text-center">
                  <p className="text-[8px] font-mono text-zinc-500 uppercase mb-1 flex items-center justify-center gap-0.5">
                    <Sword className="w-2.5 h-2.5 text-zinc-400" />
                    아이템
                  </p>
                  <p className="text-sm font-bold text-zinc-100 leading-none">{ilvlText}</p>
                </div>
                <div className="rounded-lg bg-zinc-900 ring-1 ring-zinc-800 p-2.5 text-center">
                  <p className="text-[8px] font-mono text-zinc-500 uppercase mb-1 flex items-center justify-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-zinc-400" />
                    원정대
                  </p>
                  <p className="text-sm font-bold text-zinc-100 leading-none">Lv.{profile.expedition_level}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-6">
              아직 캐릭터 정보를 등록하지 않았어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
