"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { MessageCircle, Send, Trash2, SmilePlus, Smile } from "lucide-react";
import { sendMessage, sendSticker, deleteMessage, toggleReaction } from "@/app/guild/[code]/chat/actions";

export type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  message_type: string;
  sticker_url: string | null;
};

export type ChatMember = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  mark_url: string | null;
  nickname_color: string | null;
};
type Reaction = { id: string; message_id: string; user_id: string; emoji: string; };

type Props = {
  guildId: string;
  guildCode: string;
  guildName: string;
  currentUserId: string;
  members: ChatMember[];
  initialMessages: ChatMessage[];
  availableStickers: string[];
};

const EMOJI_SET = ["👍", "❤️", "😂", "🎉", "😮", "😢", "🔥", "👏", "💪", "🙏"];

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
  guildId, guildCode, guildName, currentUserId, members, initialMessages, availableStickers,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const memberMap = useMemo(() => {
    const map: { [key: string]: ChatMember } = {};
    for (const m of members) map[m.user_id] = m;
    return map;
  }, [members]);

  const [supabase] = useState(() =>
    createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ids = messages.map((m) => m.id);
      if (ids.length === 0) return;
      const { data } = await supabase
        .from("message_reactions").select("id, message_id, user_id, emoji").in("message_id", ids);
      if (!cancelled && data) setReactions(data as Reaction[]);
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, messages.length]);

  useEffect(() => {
    const channel = supabase
      .channel(`guild-chat-room-${guildId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "guild_messages", filter: `guild_id=eq.${guildId}` },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, row]);
        })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "guild_messages", filter: `guild_id=eq.${guildId}` },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, guildId]);

  useEffect(() => {
    const channel = supabase
      .channel(`guild-reactions-${guildId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "message_reactions" },
        (payload) => {
          const row = payload.new as Reaction;
          setReactions((prev) => prev.some((r) => r.id === row.id) ? prev : [...prev, row]);
        })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "message_reactions" },
        (payload) => {
          const removed = payload.old as { id: string };
          setReactions((prev) => prev.filter((r) => r.id !== removed.id));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, guildId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
      setMessages((prev) => prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]);
    } else { toast.error(res.error); }
  }

  async function handleSendSticker(url: string) {
    setStickerOpen(false);
    const res = await sendSticker(guildCode, url);
    if (res.ok) {
      setMessages((prev) => prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]);
    } else { toast.error(res.error); }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    const res = await deleteMessage(id);
    setDeletingId(null);
    if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== id));
    else toast.error(res.error);
  }

  async function handleReact(messageId: string, emoji: string) {
    setPickerFor(null);
    const mineExists = reactions.some(
      (r) => r.message_id === messageId && r.user_id === currentUserId && r.emoji === emoji
    );
    if (mineExists) {
      setReactions((prev) => prev.filter(
        (r) => !(r.message_id === messageId && r.user_id === currentUserId && r.emoji === emoji)));
    } else {
      setReactions((prev) => [...prev,
        { id: `tmp-${Date.now()}`, message_id: messageId, user_id: currentUserId, emoji }]);
    }
    const res = await toggleReaction(messageId, emoji);
    if (!res.ok) toast.error(res.error);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function renderAvatar(member: ChatMember | undefined, name: string, mine: boolean) {
    const img = member?.mark_url || member?.avatar_url || null;
    return (
      <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center ${mine ? "bg-violet-600" : "bg-violet-100"}`}>
        {img ? <img src={img} alt={name} className="w-full h-full object-cover" />
          : <span className={`text-xs font-bold ${mine ? "text-white" : "text-violet-700"}`}>{name[0]?.toUpperCase() ?? "?"}</span>}
      </div>
    );
  }

  function reactionSummary(messageId: string) {
    const rs = reactions.filter((r) => r.message_id === messageId);
    const map: { [emoji: string]: { count: number; mine: boolean } } = {};
    for (const r of rs) {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, mine: false };
      map[r.emoji].count += 1;
      if (r.user_id === currentUserId) map[r.emoji].mine = true;
    }
    return map;
  }

  let lastDate = "";

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 bg-white border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GUILD CHAT</p>
          <h1 className="text-base font-bold text-slate-900 leading-tight truncate">{guildName} 채팅</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4" onClick={() => { setPickerFor(null); setStickerOpen(false); }}>
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
              const summary = reactionSummary(msg.id);
              const summaryKeys = Object.keys(summary);
              const isSticker = msg.message_type === "sticker" && msg.sticker_url;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">{thisDate}</span>
                    </div>
                  )}
                  <div className={`group flex gap-2.5 ${headerHidden ? "mt-0.5" : "mt-3"}`}>
                    <div className="w-9 shrink-0">{!headerHidden && renderAvatar(sender, name, mine)}</div>
                    <div className="min-w-0 flex-1">
                     {!headerHidden && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span
                            className="text-sm font-bold"
                            style={
                              sender?.nickname_color
                                ? { color: sender.nickname_color }
                                : undefined
                            }
                          >
                            <span className={sender?.nickname_color ? "" : (mine ? "text-violet-700" : "text-slate-800")}>
                              {name}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5">
                        {isSticker ? (
                          <img
                            src={msg.sticker_url!}
                            alt="이모티콘"
                            className="object-contain"
                            style={{ maxWidth: "120px", maxHeight: "120px" }}
                          />
                        ) : (
                          <p className="text-sm text-slate-700 break-words leading-relaxed whitespace-pre-wrap min-w-0">{msg.content}</p>
                        )}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative">
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setPickerFor(pickerFor === msg.id ? null : msg.id); }}
                            className="p-1 rounded text-slate-300 hover:text-violet-500 hover:bg-violet-50" aria-label="반응 추가" title="반응">
                            <SmilePlus className="w-3.5 h-3.5" />
                          </button>
                          {mine && (
                            <button type="button" onClick={() => handleDelete(msg.id)} disabled={deletingId === msg.id}
                              className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-50" aria-label="메시지 삭제" title="삭제">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {pickerFor === msg.id && (
                            <div onClick={(e) => e.stopPropagation()}
                              className="absolute z-10 top-7 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex gap-0.5 flex-wrap w-56">
                              {EMOJI_SET.map((em) => (
                                <button key={em} type="button" onClick={() => handleReact(msg.id, em)}
                                  className="w-9 h-9 rounded-lg hover:bg-slate-100 text-lg flex items-center justify-center">{em}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {summaryKeys.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {summaryKeys.map((em) => {
                            const info = summary[em];
                            return (
                              <button key={em} type="button" onClick={() => handleReact(msg.id, em)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition ${
                                  info.mine ? "bg-violet-50 border-violet-300 text-violet-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                                <span>{em}</span><span className="font-medium">{info.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
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
        <div className="max-w-3xl mx-auto flex items-end gap-2 relative">
          {/* 이모티콘 버튼 */}
          <div className="relative">
            <button type="button"
              onClick={(e) => { e.stopPropagation(); setStickerOpen((v) => !v); }}
              className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:text-violet-500 hover:border-violet-300"
              aria-label="이모티콘">
              <Smile className="w-5 h-5" />
            </button>
            {stickerOpen && (
              <div onClick={(e) => e.stopPropagation()}
                className="absolute bottom-14 left-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-72 max-h-72 overflow-y-auto">
                {availableStickers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 px-2">
                    장착된 이모티콘팩이 없어요.<br />마스터가 보관함에서 장착하면 여기 떠요.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {availableStickers.map((url, i) => (
                      <button key={i} type="button" onClick={() => handleSendSticker(url)}
                        className="aspect-square rounded-lg hover:bg-slate-100 p-1 flex items-center justify-center">
                        <img src={url} alt={`이모티콘 ${i + 1}`} className="max-w-full max-h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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
          <button type="button" onClick={handleSend} disabled={sending || input.trim().length === 0}
            className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-violet-600 text-white transition-opacity disabled:opacity-40 hover:bg-violet-500" aria-label="전송">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
