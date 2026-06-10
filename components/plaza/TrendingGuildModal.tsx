"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Eye, UserPlus, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { requestJoinGuild } from "@/app/actions/join-request-actions";
import GuildCard from "@/components/guild/GuildCard";
import type { TrendingItem } from "./TrendingGuildsMarquee";

export default function TrendingGuildModal({
  guild,
  isLoggedIn,
  onClose,
}: {
  guild: TrendingItem;
  isLoggedIn: boolean;
  onClose: () => void;
}) {
  const [joinMessage, setJoinMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  async function handleJoin() {
    if (!isLoggedIn) {
      toast.error("로그인이 필요해요");
      return;
    }
    setSubmitting(true);
    const res = await requestJoinGuild(guild.id, joinMessage);
    setSubmitting(false);
    if (res.success) {
      toast.success("가입 신청을 보냈어요! 길드장의 승인을 기다려주세요");
      setRequested(true);
      setJoinMessage("");
    } else {
      toast.error(res.error ?? "신청에 실패했어요");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <GuildCard
            guildName={guild.name}
            server={guild.server ? guild.server + " 서버" : undefined}
            grade={guild.grade}
            markUrl={guild.markUrl}
            tierLabel={guild.tierLabel}
            tierColor={guild.tierColor}
            memberCount={guild.memberCount}
            maxMembers={guild.maxMembers}
          />
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {guild.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {guild.tags.map((t) => (
                <span key={t} className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-slate-500">인원</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {guild.memberCount}
                <span className="text-xs text-slate-400">/{guild.maxMembers}</span>
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-slate-500">등급</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: guild.tierColor }}>
                {guild.tierLabel}
              </p>
            </div>
          </div>

          {guild.recruitMessage ? (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">모집 안내</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {guild.recruitMessage}
              </p>
            </div>
          ) : null}

          {guild.discordUrl ? (
            <button
              type="button"
              onClick={() => {
                const url = guild.discordUrl.startsWith("http")
                  ? guild.discordUrl
                  : "https://" + guild.discordUrl;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition"
            >
              <MessageSquare className="w-4 h-4" /> 디스코드 참여하기
            </button>
          ) : null}

          {!requested ? (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">가입 신청 메시지 (선택)</p>
              <textarea
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                maxLength={200}
                placeholder="간단한 자기소개나 캐릭터 정보를 적어주세요."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 bg-white min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 p-4 border-t border-slate-100 shrink-0">
          <Link
            href={"/guild/" + guild.code}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
          >
            <Eye className="w-4 h-4" /> 둘러보기
          </Link>
          {requested ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-bold">
              신청 완료
            </div>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" /> {submitting ? "신청 중..." : "가입 신청"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
