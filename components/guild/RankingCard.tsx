"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { type RankingMember } from "@/lib/guild-layout-types";
import ProfileCardModal from "@/components/ProfileCardModal";

type Props = {
  rankingMembers: RankingMember[];
  textPrimary: string;
  primaryColor: string;
  cardBg: string;
  cardBorder: string;
};

export default function RankingCard({
  rankingMembers, textPrimary, primaryColor, cardBg, cardBorder,
}: Props) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: primaryColor }}>
        <Trophy className="w-3.5 h-3.5 text-white" />
        <p className="text-[11px] font-bold text-white">포인트 랭킹</p>
      </div>
      <div className="py-1">
        {rankingMembers.slice(0, 7).map((m, i) => {
          const avatar = m.profiles?.mark_url ?? m.profiles?.avatar_url ?? null;
          const name = m.profiles?.username ?? "?";
          return (
            <button
              key={m.user_id}
              type="button"
              onClick={() => setProfileUserId(m.user_id)}
              className="flex items-center gap-2 px-3 py-1.5 w-full row-hover transition"
            >
              <span className="text-[10px] font-bold w-4 text-center" style={{
                color: i === 0 ? "#eab308" : i === 1 ? "#9ca3af" : i === 2 ? "#f97316" : textPrimary
              }}>{i + 1}</span>
              <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + "33" }}>
                {avatar
                  ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[8px] font-bold" style={{ color: primaryColor }}>{name[0]?.toUpperCase()}</span>
                }
              </div>
              <span className="text-[11px] truncate flex-1 text-left" style={{ color: textPrimary }}>{name}</span>
              <span className="text-[10px] font-bold shrink-0" style={{ color: primaryColor }}>{m.points}P</span>
            </button>
          );
        })}
      </div>

      <ProfileCardModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
