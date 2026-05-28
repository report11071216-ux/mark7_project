"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { MessageCircle, Send } from "lucide-react";
import { sendMessage } from "@/app/guild/[code]/chat/actions";

export type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type ChatMember = {
  user_id: string;
  username: string;
  avatar_url: string | null;
};

type Props = {
  guildId: string;
  guildCode: string;
  guildName: string;
  currentUserId: string;
  members: ChatMember[];
  initialMessages: ChatMessage[];
};

function formatTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  h = h % 12;
  if (h === 0) h = 12;
  return `${ampm} ${h}:${String(m).padStart(2, "0")}`;
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function GuildChatRoom({
  guildId,
  guildCode,
  guildName,
  currentUserId,
  members,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const memberMap = useMemo(() => {
    const map: { [key: string]: ChatMember } = {};
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
      .channel(`guild-chat-room-${guildId}`)
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, guildId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // 날짜 구분선 판단용
  let lastDate = "";

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 bg-white border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GUILD CHAT</p>
          <h1 className="text-base font-bold text-slate-900 leading-tight truncate">{guildName} 채팅</h1>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">아직 메시지가 없어요.</p>
                <p className="text-xs text-slate-400 mt-1">첫 메시지를 보내보세요!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const mine = msg.user_id === currentUserId;
              const sender = memberMap[msg.user_id];
              const name = sender?.username ?? "알 수 없음";
              const avatar = sender?.avatar_url ?? null;

              const thisDate = dateLabel(msg.created_at);
              const showDate = thisDate !== lastDate;
              lastDate = thisDate;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
                        {thisDate}
                      </span>
                    </div>
                  )}

                  {mine ? (
                    <div className="flex justify-end">
                      <div className="flex items-end gap-1.5 max-w-[75%]">
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(msg.created_at)}
                        </span>
                        <div className="rounded-2xl rounded-br-sm px-3.5 py-2 text-sm break-words bg-violet-600 text-white">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-violet-100">
                        {avatar ? (
                          <img src={avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-violet-700">
                            {name[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[75%]">
                        <p className="text-[11px] text-slate-500 mb-0.5">{name}</p>
                        <div className="flex items-end gap-1.5">
                          <div className="rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm break-words bg-white border border-slate-200 text-slate-800">
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력창 */}
      <div className="shrink-0 px-4 md:px-6 py-3 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="메시지를 입력하세요"
            maxLength={1000}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || input.trim().length === 0}
            className="h-11 w-11 rounded-xl flex items-center justify-center bg-violet-600 text-white transition-opacity disabled:opacity-40 hover:bg-violet-500"
            aria-label="전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
