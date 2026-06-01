"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Shield, Users, Diamond, X, Eye, UserPlus, MessageSquare } from "lucide-react";

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
};

const SERVERS = ["전체", "루페온", "실리안", "아만", "카마인", "카제로스", "아브렐슈드", "니나브"];

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

export default function RecruitingGallery({ guilds }: { guilds: RecruitGuild[] }) {
  const [serverFilter, setServerFilter] = useState("전체");
  const [sort, setSort] = useState("activity");
  const [selected, setSelected] = useState<RecruitGuild | null>(null);

  const filtered = useMemo(() => {
    let list = guilds;
    if (serverFilter !== "전체") {
      list = list.filter((g) => g.server === serverFilter);
    }
    const sorted = [...list];
    if (sort === "members") {
      sorted.sort((a, b) => (b.maxMembers - b.memberCount) - (a.maxMembers - a.memberCount));
    } else if (sort === "activity") {
      sorted.sort((a, b) => b.totalExp - a.totalExp);
    }
    return sorted;
  }, [guilds, serverFilter, sort]);

  const selectedGrade = selected ? gradeOf(selected.totalExp) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap flex-1">
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
        >
          <option value="activity">활동성순</option>
          <option value="recent">최신순</option>
          <option value="members">자리 많은순</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">현재 조건에 맞는 모집중인 길드가 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((g) => {
            const grade = gradeOf(g.totalExp);
            return (
              <button
                key={g.id}
                onClick={() => setSelected(g)}
                className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-violet-300 hover:shadow-sm transition flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {g.logoUrl ? (
                      <img src={g.logoUrl} alt={g.name} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-5 h-5 text-violet-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-slate-900 truncate">{g.name}</p>
                    {g.server ? (
                      <span className="inline-block text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded mt-0.5">
                        {g.server}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Diamond className="w-3.5 h-3.5" style={{ color: grade.color }} />
                  <span className="text-[11px] font-bold" style={{ color: grade.color }}>{grade.label}</span>
                </div>

                <p className="text-xs text-slate-500 leading-snug line-clamp-2 min-h-[2rem]">
                  {g.description || "소개가 아직 없어요"}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {g.memberCount}/{g.maxMembers}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    모집중
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && selectedGrade ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="relative h-24 bg-slate-900 flex items-end p-4 shrink-0">
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-violet-400/40">
                  {selected.logoUrl ? (
                    <img src={selected.logoUrl} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-7 h-7 text-violet-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-white">{selected.name}</p>
                    {selected.server ? (
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded">{selected.server}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Diamond className="w-3.5 h-3.5" style={{ color: selectedGrade.color }} />
                    <span className="text-xs font-bold" style={{ color: selectedGrade.color }}>{selectedGrade.label} 길드</span>
                  </div>
                </div>
              </div>
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
            </div>

            <div className="flex gap-2 p-4 border-t border-slate-100 shrink-0">
              <Link
                href={"/guild/" + selected.code}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
              >
                <Eye className="w-4 h-4" /> 둘러보기
              </Link>
              <button
                type="button"
                disabled
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold opacity-50 cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" /> 가입 신청
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
