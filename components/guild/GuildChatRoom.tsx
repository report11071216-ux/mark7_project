"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { sendMessage, deleteMessage } from "@/app/guild/[code]/chat/actions";

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
  mark_url: string | null;
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

function isSameGroup(prev: ChatMessage | null, cur: ChatMessage): boolean {
  if (!prev) return false;
  if (prev.user_id !== cur.user_id) return false;
  const gap = new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
  return gap < 5 * 60 * 1000;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

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
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "guild_messages",
          filter: `guild_id=eq.${guildId}`,
        },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
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

  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await sendMessage(guildCode, text);
    setSending(false);
    if (res.ok) {
      setInput("");
      if (taRef.current) taRef.current.style.height = "auto";
      setMessages((prev) =>
        prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]
      );
    } else {
      toast.error(res.error);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    const res = await deleteMessage(id);
    setDeletingId(null);
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } else {
      toast.error(res.error);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function renderAvatar(member: ChatMember | undefined, name: string, mine: boolean) {
    const img = member?.mark_url || member?.avatar_url || null;
    return (
      <div
        className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center ${
          mine ? "bg-violet-600" : "bg-violet-100"
        }`}
      >
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className={`text-xs font-bold ${mine ? "text-white" : "text-violet-700"}`}>
            {name[0]?.toUpperCase() ?? "?"}
          </span>
        )}
      </div>
    );
  }

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
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">아직 메시지가 없어요.</p>
                <p className="text-xs text-slate-400 mt-1">첫 메시지를 보내보세요!</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const mine = msg.user_id === currentUserId;
              const sender = memberMap[msg.user_id];
              const name = mine ? "나" : (sender?.username ?? "알 수 없음");

              const prev = i > 0 ? messages[i - 1] : null;
              const grouped = isSameGroup(prev, msg);

              const thisDate = dateLabel(msg.created_at);
              const showDate = thisDate !== lastDate;
              lastDate = thisDate;

              const headerHidden = grouped && !showDate;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
                        {thisDate}
                      </span>
                    </div>
                  )}

                  <div className={`group flex gap-2.5 ${headerHidden ? "mt-0.5" : "mt-3"}`}>
                    {/* 아바타 자리 */}
                    <div className="w-9 shrink-0">
                      {!headerHidden && renderAvatar(sender, name, mine)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {!headerHidden && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span
                            className={`text-sm font-bold ${
                              mine ? "text-violet-700" : "text-slate-800"
                            }`}
                          >
                            {name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-slate-700 break-words leading-relaxed whitespace-pre-wrap min-w-0">
                          {msg.content}
                        </p>
                        {/* 내 메시지에만 삭제 버튼 (호버 시) */}
                        {mine && (
                          <button
                            type="button"
                            onClick={() => handleDelete(msg.id)}
                            disabled={deletingId === msg.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                            aria-label="메시지 삭제"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력창 */}
      <div className="shrink-0 px-4 md:px-6 py-3 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoGrow(); }}
            onKeyDown={onKeyDown}
            placeholder="메시지를 입력하세요  (Shift+Enter로 줄바꿈)"
            maxLength={1000}
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 leading-relaxed"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || input.trim().length === 0}
            className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-violet-600 text-white transition-opacity disabled:opacity-40 hover:bg-violet-500"
            aria-label="전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
