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

const VISIBLE = 6;

export default function OnlineMembersCard({
  onlineMembers, textPrimary, textSecondary, cardBg, cardBorder, primaryColor,
}: Props) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const online = onlineMembers.filter((m) => isOnline(m.last_seen_at));
  const shown = expanded ? online : online.slice(0, VISIBLE);
  const remaining = online.length - VISIBLE;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <p className="text-xs font-bold" style={{ color: textPrimary }}>접속중 {online.length}명</p>
      </div>

      {online.length === 0 ? (
        <p className="text-xs text-center py-5" style={{ color: textSecondary }}>접속 중인 멤버가 없어요</p>
      ) : (
        <div className="p-2 space-y-2">
          {shown.map((m) => {
            const cardUrl = m.profiles?.card_url ?? null;
            const markUrl = m.profiles?.mark_url ?? null;
            const avatar = markUrl ?? m.profiles?.avatar_url ?? null;
            const name = m.profiles?.username ?? "?";

            // 카드배경 장착 — 가로 배너 (REF 1)
            if (cardUrl) {
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setProfileUserId(m.user_id)}
                  className="relative w-full aspect-[16/5] rounded-lg overflow-hidden block hover:ring-2 hover:ring-white/40 transition"
                >
                  <div className="absolute inset-0 bg-zinc-900" />
                  <img src={cardUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />

                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 ring-2 ring-black/40" />

                  <div className="absolute inset-0 flex items-center gap-2.5 px-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/40 shrink-0">
                      {avatar
                        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-white/15 flex items-center justify-center text-sm font-bold text-white">{name[0]?.toUpperCase()}</div>
                      }
                    </div>
                    <span className="text-sm font-bold text-white truncate drop-shadow-[0_1px_5px_rgba(0,0,0,1)]">{name}</span>
                  </div>
                </button>
              );
            }

            // 카드배경 없음 — 컴팩트 줄
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setProfileUserId(m.user_id)}
                className="relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition hover:opacity-80"
                style={{ backgroundColor: primaryColor + "0F" }}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2" style={{ borderColor: primaryColor + "33" }}>
                  {avatar
                    ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: primaryColor + "22", color: primaryColor }}>{name[0]?.toUpperCase()}</div>
                  }
                </div>
                <span className="text-sm font-medium truncate" style={{ color: textPrimary }}>{name}</span>
                <span className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" />
              </button>
            );
          })}

          {remaining > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
              style={{ backgroundColor: primaryColor + "0F", color: primaryColor }}
            >
              {expanded ? "접기" : `+${remaining}명 더보기`}
            </button>
          ) : null}
        </div>
      )}

      <ProfileCardModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
