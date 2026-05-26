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
      <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: cardBorder }}>
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <p className="text-[11px] font-bold" style={{ color: textPrimary }}>접속중 {online.length}명</p>
      </div>
      <div className="py-1.5 px-1.5 space-y-1">
        {online.length === 0 ? (
          <p className="text-[11px] text-center py-3" style={{ color: textSecondary }}>없음</p>
        ) : (
          online.slice(0, 6).map((m) => {
            const cardUrl = m.profiles?.card_url ?? null;
            const markUrl = m.profiles?.mark_url ?? null;
            const avatar = markUrl ?? m.profiles?.avatar_url ?? null;
            const name = m.profiles?.username ?? "?";

            // 프로필카드 장착 — 줄에 배경 깔기
            if (cardUrl) {
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setProfileUserId(m.user_id)}
                  className="relative rounded-md overflow-hidden w-full block hover:ring-1 hover:ring-white/40 transition"
                >
                  <div className="absolute inset-0 bg-zinc-900" />
                  <img src={cardUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative flex items-center gap-2 px-2 py-1.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 ring-1 ring-white/30">
                      {avatar
                        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-white/15 flex items-center justify-center text-[8px] font-bold text-white">{name[0]?.toUpperCase()}</div>
                      }
                    </div>
                    <span className="text-[11px] font-bold text-white truncate drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">{name}</span>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  </div>
                </button>
              );
            }

            // 프로필카드 없음 — 기본
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setProfileUserId(m.user_id)}
                className="flex items-center gap-2 px-2 py-1.5 w-full rounded-md hover:bg-black/5 transition"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: primaryColor + "22" }}>
                  {avatar
                    ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ color: primaryColor }}>{name[0]?.toUpperCase()}</div>
                  }
                </div>
                <span className="text-[11px] truncate" style={{ color: textPrimary }}>{name}</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              </button>
            );
          })
        )}
      </div>

      <ProfileCardModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
