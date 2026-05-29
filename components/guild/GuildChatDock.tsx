"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

type Props = {
  guildId: string;
  guildCode: string;
  guildName: string;
  currentUserId: string;
  members: { user_id: string; username: string; avatar_url: string | null }[];
  initialMessages: { id: string; user_id: string; content: string; created_at: string }[];
  primaryColor?: string;
  backgroundColor?: string;
};

export default function GuildChatDock({ guildCode, primaryColor }: Props) {
  const accent = primaryColor ?? "#7c3aed";

  return (
    <Link
      href={`/guild/${guildCode}/chat`}
      className="fixed z-40 right-4 bottom-44 md:right-8 md:bottom-24 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
      style={{ backgroundColor: accent }}
      aria-label="길드 채팅 열기"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </Link>
  );
}
