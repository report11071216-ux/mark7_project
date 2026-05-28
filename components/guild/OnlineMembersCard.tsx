"use client";

import { useState } from "react";
import { type OnlineMember } from "@/lib/guild-layout-types";
import ProfileCardModal from "@/components/ProfileCardModal";

function isOnline(t: string | null) {
  if (!t) return false;
  return Date.now() - new Date(t).getTime() < 5 * 60 * 1000;
}

type Props = {
  onlineMembers: OnlineMember[];
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  primaryColor: string;
};

export default function OnlineMembersCard({
  onlineMembers, textPrimary, textSecondary, cardBg, cardBorder, primaryColor,
}: Props) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const online = onlineMembers.filter((m) => isOnline(m.last_seen_at));

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <p className="text-xs font-bold" style={{ color: textPrimary }}>접속중 {online.length}명</p>
      </div>

      {online.length === 0 ? (
        <p className="text-xs text-center py-5" style={{ color: textSecondary }}>접속 중인 멤버가 없어요</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-2.5">
          {online.slice(0, 8).map((m) => {
            const cardUrl = m.profiles?.card_url ?? null;
            const markUrl = m.profiles?.mark_url ?? null;
            const avatar = markUrl ?? m.profiles?.avatar_url ?? null;
            const name = m.profiles?.username ?? "?";

            // 카드배경 장착 — 타일 전체에 배경
            if (cardUrl) {
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setProfileUserId(m.user_id)}
                  className="relative rounded-lg overflow-hidden w-full aspect-[4/3] flex flex-col items-center justify-center gap-1.5 hover:ring-2 hover:ring-white/50 transition"
                >
                  <div className="absolute inset-0 bg-zinc-900" />
                  <img src={cardUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />

                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 ring-2 ring-black/40" />

                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/40 shrink-0">
                    {avatar
                      ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-white/15 flex items-center justify-center text-lg font-bold text-white">{name[0]?.toUpperCase()}</div>
                    }
                  </div>
                  <span className="relative text-[11px] font-bold text-white truncate max-w-full px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">{name}</span>
                </button>
              );
            }

            // 카드배경 없음 — 기본 타일
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setProfileUserId(m.user_id)}
                className="relative rounded-lg w-full aspect-[4/3] flex flex-col items-center justify-center gap-1.5 transition hover:opacity-80"
                style={{ backgroundColor: primaryColor + "0F" }}
              >
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400" />

                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2" style={{ borderColor: primaryColor + "33" }}>
                  {avatar
                    ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>{name[0]?.toUpperCase()}</div>
                  }
                </div>
                <span className="text-[11px] font-medium truncate max-w-full px-2" style={{ color: textPrimary }}>{name}</span>
              </button>
            );
          })}
        </div>
      )}

      <ProfileCardModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
