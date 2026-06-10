"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Users, X, Eye, UserPlus, MessageSquare, Diamond, Search } from "lucide-react";
import toast from "react-hot-toast";
import { requestJoinGuild } from "@/app/actions/join-request-actions";
import GuildCard from "@/components/guild/GuildCard";

export type RecruitGuild = {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  server: string | null;
  description: string;
  memberCount: number;
  maxMembers: number;
  totalExp: number;
  rank: number;
  tags: string[];
  discordUrl: string;
  recruitMessage: string;
  cardImageUrl: string | null;
  cardDesign: { [effect: string]: any } | null;
};

const SERVERS = ["전체", "루페온", "실리안", "아만", "카마인", "카제로스", "아브렐슈드", "니나브", "카단"];

function gradeOf(exp: number) {
  if (exp >= 12000) return { label: "그랜드마스터", color: "#dc2626" };
  if (exp >= 6000) return { label: "마스터", color: "#9333ea" };
  if (exp >= 3000) return { label: "다이아몬드", color: "#0891b2" };
  if (exp >= 1500) return { label: "에메랄드", color: "#059669" };
  if (exp >= 700) return { label: "플래티넘", color: "#7c3aed" };
  if (exp >= 300) return { label: "골드", color: "#ca8a04" };
  if (exp >= 100) return { label: "실버", color: "#64748b" };
  return { label: "브론즈", color: "#b45309" };
}

export default function RecruitingGallery({
  guilds,
  isLoggedIn,
}: {
  guilds: RecruitGuild[];
  isLoggedIn: boolean;
}) {
  const [serverFilter, setServerFilter] = useState("전체");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RecruitGuild | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let list = guilds;
    if (serverFilter !== "전체") {
      list = list.filter((g) => g.server === serverFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((g) => {
        const inName = g.name.toLowerCase().includes(q);
        const inTags = g.tags.some((t) => t.toLowerCase().includes(q));
        const inMsg = g.recruitMessage.toLowerCase().includes(q);
        return inName || inTags || inMsg;
      });
    }
    // 정렬은 서버에서 활동순으로 이미 끝났으니 그대로 유지
    return list;
  }, [guilds, serverFilter, query]);

  const selectedGrade = selected ? gradeOf(selected.totalExp) : null;
  const alreadyRequested = selected ? requestedIds.includes(selected.id) : false;

  function closeModal() {
    setSelected(null);
    setJoinMessage("");
  }

  async function handleJoin() {
    if (!selected) return;
    if (!isLoggedIn) {
      toast.error("로그인이 필요해요");
      return;
    }
    setSubmitting(true);
    const res = await requestJoinGuild(selected.id, joinMessage);
    setSubmitting(false);
    if (res.success) {
      toast.success("가입 신청을 보냈어요! 길드장의 승인을 기다려주세요");
      setRequestedIds((prev) => [...prev, selected.id]);
      setJoinMessage("");
    } else {
      toast.error(res.error ?? "신청에 실패했어요");
    }
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 서버 필터 */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="길드명, 태그, 모집 내용으로 검색"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SERVERS.map((s) => (
            <button
              key={s}
              onClick={() => setServerFilter(s)}
              className={
                "h-8 px-3.5 rounded-full text-xs font-bold transition-colors " +
                (serverFilter === s
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {query.trim() ? "검색 결과가 없어요" : "현재 조건에 맞는 모집중인 길드가 없어요"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((g) => {
            const grade = gradeOf(g.totalExp);
            const requested = requestedIds.includes(g.id);
            return (
              <div
                key={g.id}
                className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm"
              >
                {/* 명함 카드 */}
                <button
                  onClick={() => setSelected(g)}
                  className="w-full md:w-[300px] shrink-0 block transition hover:-translate-y-0.5"
                >
                  <GuildCard
                    guildName={g.name}
                    server={g.server ? g.server + " 서버" : undefined}
                    grade="custom"
                    markUrl={g.logoUrl}
                    imageUrl={g.cardImageUrl}
                    tierLabel={grade.label}
                    tierColor={grade.color}
                    memberCount={g.memberCount}
                    maxMembers={g.maxMembers}
                    design={g.cardDesign}
                  />
                </button>

                {/* 정보 + 액션 */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {g.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {g.tags.slice(0, 4).map((t) => (
                        <span key={t} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {g.recruitMessage ? (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{g.recruitMessage}</p>
                  ) : (
                    <p className="text-xs text-slate-400">{g.description || "함께할 길드원을 모집해요"}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setSelected(g)}
                      className="h-9 px-5 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" /> 가입 신청
                    </button>
                    <Link
                      href={"/guild/" + g.code}
                      className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> 둘러보기
                    </Link>
                    {requested ? (
                      <span className="text-xs font-bold text-emerald-600">신청 완료</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 가입 모달 */}
      {selected && selectedGrade ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <button onClick={closeModal} className="absolute top-3 right-3 z-10 text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div>
              <GuildCard
                guildName={selected.name}
                server={selected.server ? selected.server + " 서버" : undefined}
                grade="custom"
                markUrl={selected.logoUrl}
                imageUrl={selected.cardImageUrl}
                tierLabel={selectedGrade.label}
                tierColor={selectedGrade.color}
                memberCount={selected.memberCount}
                maxMembers={selected.maxMembers}
                design={selected.cardDesign}
              />
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {selected.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <span key={t} className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">{t}</span>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-slate-500">인원</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selected.memberCount}<span className="text-xs text-slate-400">/{selected.maxMembers}</span></p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-slate-500">등급</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: selectedGrade.color }}>{selectedGrade.label}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-slate-500">랭킹</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selected.rank > 0 ? "#" + selected.rank : "-"}</p>
                </div>
              </div>

              {selected.recruitMessage ? (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">모집 안내</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.recruitMessage}</p>
                </div>
              ) : null}

              {selected.discordUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    const url = selected.discordUrl.startsWith("http")
                      ? selected.discordUrl
                      : "https://" + selected.discordUrl;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition"
                >
                  <MessageSquare className="w-4 h-4" /> 디스코드 참여하기
                </button>
              ) : null}

              {!alreadyRequested ? (
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
                href={"/guild/" + selected.code}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
              >
                <Eye className="w-4 h-4" /> 둘러보기
              </Link>
              {alreadyRequested ? (
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
      ) : null}
    </div>
  );
}
