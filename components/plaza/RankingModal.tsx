"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { X, Trophy, Medal, UserPlus, Eye, MessageSquare, Loader2 } from "lucide-react";
import { requestJoinGuild } from "@/app/actions/join-request-actions";
import GuildCard from "@/components/guild/GuildCard";
import { gradeOf, type RankedGuild } from "./RankingBoard";

export default function RankingModal({
  guild,
  rank,
  isLoggedIn,
  onClose,
}: {
  guild: RankedGuild;
  rank: number;
  isLoggedIn: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  const grade = gradeOf(guild.exp);

  // 순위 배지 색/아이콘
  let badgeBg = "#3c3489";
  let badgeColor = "#d4ccff";
  let BadgeIcon = Trophy;
  if (rank === 1) { badgeBg = "#fac775"; badgeColor = "#412402"; BadgeIcon = Trophy; }
  else if (rank === 2) { badgeBg = "#c5c3d4"; badgeColor = "#2c2c2a"; BadgeIcon = Medal; }
  else if (rank === 3) { badgeBg = "#d8a878"; badgeColor = "#412402"; BadgeIcon = Medal; }

  async function handleJoin() {
    if (!isLoggedIn) {
      toast.error("로그인이 필요해요");
      return;
    }
    setSubmitting(true);
    const res = await requestJoinGuild(guild.id, message);
    setSubmitting(false);
    if (res.success) {
      toast.success("가입 신청을 보냈어요! 길드장의 승인을 기다려주세요");
      setRequested(true);
      setMessage("");
    } else {
      toast.error(res.error ?? "신청에 실패했어요");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[330px] bg-plaza-surface border border-plaza-line rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* 카드 + 순위 배지 */}
        <div className="relative shrink-0">
          <GuildCard
            guildName={guild.name}
            server={guild.server ? guild.server + " 서버" : undefined}
            grade="custom"
            markUrl={guild.markUrl}
            imageUrl={guild.cardImageUrl}
            tierLabel={grade.label}
            tierColor={grade.color}
            design={guild.cardDesign}
          />
          <span
            className="absolute top-2.5 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: badgeBg, color: badgeColor }}
          >
            <BadgeIcon className="w-3.5 h-3.5" />
            전체 {rank}위
          </span>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 left-3 z-10 text-white/80 hover:text-white"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {/* EXP 강조 */}
          <div className="flex items-center justify-between rounded-xl border border-plaza-accent/40 bg-plaza-accent-soft px-4 py-3 mb-3">
            <span className="text-[10px] font-mono text-plaza-accent tracking-wider">GUILD EXP</span>
            <span className="text-xl font-bold" style={{ color: rank <= 3 ? badgeBg : "#fac775" }}>
              {guild.exp.toLocaleString()}<span className="text-[10px] text-plaza-ink-dim ml-1">EXP</span>
            </span>
          </div>

          {/* 스탯 3칸 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-plaza-surface-2 rounded-lg py-2.5 text-center">
              <p className="text-[9px] text-plaza-ink-dim mb-0.5">등급</p>
              <p className="text-sm font-bold" style={{ color: grade.color }}>{grade.label}</p>
            </div>
            <div className="bg-plaza-surface-2 rounded-lg py-2.5 text-center">
              <p className="text-[9px] text-plaza-ink-dim mb-0.5">멤버</p>
              <p className="text-sm font-bold text-plaza-ink">{guild.memberCount}</p>
            </div>
            <div className="bg-plaza-surface-2 rounded-lg py-2.5 text-center">
              <p className="text-[9px] text-plaza-ink-dim mb-0.5">서버</p>
              <p className="text-xs font-bold text-plaza-ink truncate px-1">{guild.server ?? "-"}</p>
            </div>
          </div>

          {/* 모집중이면 한마디 + 가입 신청 */}
          {guild.isRecruiting && !requested ? (
            <>
              <p className="text-[10px] text-plaza-ink-soft mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                가입 신청 한마디 (선택)
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                placeholder="간단한 자기소개나 캐릭터 정보를 적어주세요"
                className="w-full bg-plaza-surface-2 border border-plaza-line rounded-lg px-3 py-2 text-xs text-plaza-ink placeholder:text-plaza-ink-dim min-h-[54px] resize-none focus:outline-none focus:ring-2 focus:ring-plaza-accent/40 mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={submitting}
                  className="flex-1 h-9 rounded-lg bg-plaza-accent text-plaza-canvas text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  가입 신청
                </button>
                <Link
                  href={`/guild/${guild.code}`}
                  className="h-9 px-3 rounded-lg border border-plaza-line text-plaza-ink-soft text-sm flex items-center gap-1.5 hover:bg-plaza-surface-2 transition"
                >
                  <Eye className="w-4 h-4" />
                  보러가기
                </Link>
              </div>
            </>
          ) : requested ? (
            <div className="h-9 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-bold flex items-center justify-center">
              신청 완료
            </div>
          ) : (
            <Link
              href={`/guild/${guild.code}`}
              className="w-full h-9 rounded-lg border border-plaza-line text-plaza-ink-soft text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-plaza-surface-2 transition"
            >
              <Eye className="w-4 h-4" />
              길드 보러가기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
