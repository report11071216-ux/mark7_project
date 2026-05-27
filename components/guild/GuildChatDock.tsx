"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { MessageCircle, X, Send } from "lucide-react";
import { sendMessage } from "@/app/guild/[code]/chat/actions";

type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Member = {
  user_id: string;
  username: string;
  avatar_url: string | null;
};

type Props = {
  guildId: string;
  guildCode: string;
  guildName: string;
  currentUserId: string;
  members: Member[];
  initialMessages: ChatMessage[];
  primaryColor?: string;
  backgroundColor?: string;
};

function isLightColor(hex: string) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  h = h % 12;
  if (h === 0) h = 12;
  return `${ampm} ${h}:${String(m).padStart(2, "0")}`;
}

export default function GuildChatDock({
  guildId,
  guildCode,
  guildName,
  currentUserId,
  members,
  initialMessages,
  primaryColor,
  backgroundColor,
}: Props) {
  const accent = primaryColor ?? "#7c3aed";
  const bg = backgroundColor ?? "#09090b";
  const isLight = isLightColor(bg);
  const textPrimary = isLight ? "#111827" : "#ffffff";
  const textSecondary = isLight ? "#6b7280" : "#a1a1aa";
  const cardBg = isLight ? "#ffffff" : "#18181b";
  const borderCol = isLight ? "#e5e7eb" : "#27272a";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const memberMap = useMemo(() => {
    const map: { [key: string]: Member } = {};
    for (const m of members) map[m.user_id] = m;
    return map;
  }, [members]);

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    const channel = supabase
      .channel(`guild-chat-${guildId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guild_messages",
          filter: `guild_id=eq.${guildId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
          if (!openRef.current && row.user_id !== currentUserId) {
            setUnread((n) => n + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, guildId, currentUserId]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView();
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await sendMessage(guildCode, text);
    setSending(false);
    if (res.ok) {
      setInput("");
      setMessages((prev) =>
        prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]
      );
    } else {
      toast.error(res.error);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* 떠다니는 채팅 버튼 */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed z-40 right-4 bottom-44 md:right-8 md:bottom-24 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: accent }}
          aria-label="길드 채팅 열기"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      )}

      {/* 채팅 패널 */}
      {open && (
        <div
          className="fixed z-50 flex flex-col rounded-2xl border shadow-2xl overflow-hidden inset-x-3 bottom-3 top-20 md:inset-auto md:right-8 md:bottom-8 md:top-auto md:w-96 md:h-[34rem]"
          style={{ backgroundColor: bg, borderColor: borderCol }}
        >
          {/* 헤더 */}
          <div
            className="shrink-0 flex items-center justify-between px-4 py-3 border-b"
            style={{ backgroundColor: cardBg, borderColor: borderCol }}
          >
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>
                GUILD CHAT
              </p>
              <h2 className="text-sm font-bold" style={{ color: textPrimary }}>
                {guildName} 채팅
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/10"
              style={{ color: textSecondary }}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-center px-4" style={{ color: textSecondary }}>
                  아직 메시지가 없어요.
                  <br />
                  첫 메시지를 보내보세요!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const mine = msg.user_id === currentUserId;
                const sender = memberMap[msg.user_id];
                const name = sender?.username ?? "알 수 없음";
                const avatar = sender?.avatar_url ?? null;

                if (mine) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="flex items-end gap-1.5 max-w-[80%]">
                        <span className="text-[10px] shrink-0" style={{ color: textSecondary }}>
                          {formatTime(msg.created_at)}
                        </span>
                        <div
                          className="rounded-2xl rounded-br-sm px-3 py-2 text-sm break-words"
                          style={{ backgroundColor: accent, color: "#ffffff" }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: accent }}
                    >
                      {avatar ? (
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {name[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 max-w-[80%]">
                      <p className="text-[11px] mb-0.5" style={{ color: textSecondary }}>
                        {name}
                      </p>
                      <div className="flex items-end gap-1.5">
                        <div
                          className="rounded-2xl rounded-tl-sm px-3 py-2 text-sm break-words border"
                          style={{ backgroundColor: cardBg, color: textPrimary, borderColor: borderCol }}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: textSecondary }}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div
            className="shrink-0 px-3 py-3 border-t flex items-center gap-2"
            style={{ backgroundColor: cardBg, borderColor: borderCol }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="메시지를 입력하세요"
              maxLength={1000}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none border"
              style={{ backgroundColor: bg, color: textPrimary, borderColor: borderCol }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || input.trim().length === 0}
              className="h-9 px-3 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-40"
              style={{ backgroundColor: accent, color: "#ffffff" }}
              aria-label="전송"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
