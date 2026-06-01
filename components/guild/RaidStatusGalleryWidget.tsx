"use client";

import { useState } from "react";
import Link from "next/link";
import { Swords } from "lucide-react";
import RaidDetailModal from "@/components/guild/RaidDetailModal";

type RaidThumb = {
  id: string;
  title: string;
  image_url: string | null;
};

type Props = {
  raids: RaidThumb[];
  guildCode: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  dividerColor: string;
  primaryColor: string;
};

export default function RaidStatusGalleryWidget({
  raids,
  guildCode,
  textPrimary,
  textSecondary,
  cardBg,
  cardBorder,
  dividerColor,
  primaryColor,
}: Props) {
  const [openRaidId, setOpenRaidId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <h2 className="text-xs font-bold" style={{ color: textPrimary }}>레이드</h2>
          </div>
          <Link href={`/guild/${guildCode}/raids`} className="text-[10px] hover:underline" style={{ color: primaryColor }}>
            전체 →
          </Link>
        </div>

        {raids.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: textSecondary }}>등록된 레이드가 없어요</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-2.5">
            {raids.slice(0, 6).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setOpenRaidId(r.id)}
                className="group text-left"
              >
                <div className="aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: dividerColor }}>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Swords className="w-4 h-4" style={{ color: textSecondary }} />
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-medium truncate mt-1" style={{ color: textPrimary }}>{r.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {openRaidId && (
        <RaidDetailModal
          guildCode={guildCode}
          raidId={openRaidId}
          onClose={() => setOpenRaidId(null)}
        />
      )}
    </>
  );
}
