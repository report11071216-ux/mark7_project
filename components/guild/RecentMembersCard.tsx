"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { type RecentMember } from "@/lib/guild-layout-types";
import { getRelativeTime } from "@/lib/utils";
import ProfileCardModal from "@/components/ProfileCardModal";

type Props = {
  recentMembers: RecentMember[];
  textPrimary: string;
  textSecondary: string;
  primaryColor: string;
  cardBg: string;
  cardBorder: string;
  dividerColor: string;
};

export default function RecentMembersCard({
  recentMembers, textPrimary, textSecondary, primaryColor, cardBg, cardBorder, dividerColor,
}: Props) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <Users className="w-4 h-4" style={{ color: primaryColor }} />
        <h2 className="text-sm font-bold" style={{ color: textPrimary }}>최근 가입</h2>
      </div>
      <div>
        {recentMembers.slice(0, 4).map((m) => {
          const avatar = m.profiles?.mark_url ?? m.profiles?.avatar_url ?? null;
          const name = m.profiles?.username ?? "?";
          return (
            <button
              key={m.user_id}
              type="button"
              onClick={() => setProfileUserId(m.user_id)}
              className="flex items-center gap-3 px-4 py-2 border-b last:border-0 w-full hover:bg-black/5 transition"
              style={{ borderColor: dividerColor }}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + "22" }}>
                {avatar
                  ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[10px] font-bold" style={{ color: primaryColor }}>{name[0]?.toUpperCase()}</span>
                }
              </div>
              <span className="text-sm flex-1 truncate text-left" style={{ color: textPrimary }}>{name}</span>
              <span className="text-[11px]" style={{ color: textSecondary }}>{getRelativeTime(m.joined_at)}</span>
            </button>
          );
        })}
      </div>

      <ProfileCardModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
