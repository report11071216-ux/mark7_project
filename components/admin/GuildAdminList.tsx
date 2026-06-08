"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Search, ExternalLink } from "lucide-react";

export type AdminGuildRow = {
  id: string;
  code: string;
  name: string;
  server: string | null;
  memberCount: number;
  maxMembers: number;
  totalExp: number;
  masterName: string;
  isRecruiting: boolean;
  createdAt: string;
};

type SortKey = "createdAt" | "memberCount" | "totalExp" | "name";

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function GuildAdminList({ guilds }: { guilds: AdminGuildRow[] }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");

  const keyword = q.trim().toLowerCase();
  const filtered = guilds.filter((g) => {
    if (!keyword) return true;
    return (
      g.name.toLowerCase().includes(keyword) ||
      g.code.toLowerCase().includes(keyword) ||
      g.masterName.toLowerCase().includes(keyword) ||
      (g.server ?? "").toLowerCase().includes(keyword)
    );
  });

  const sorted = filtered.slice().sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "memberCount") return b.memberCount - a.memberCount;
    if (sortKey === "totalExp") return b.totalExp - a.totalExp;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "createdAt", label: "최신순" },
    { key: "memberCount", label: "인원순" },
    { key: "totalExp", label: "경험치순" },
    { key: "name", label: "이름순" },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 + 검색/정렬 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">길드 목록</h2>
          <span className="text-sm text-slate-400 font-mono">{guilds.length}개</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="길드명·코드·마스터·서버 검색"
              className="w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1">
            {sortButtons.map((b) => {
              const active = sortKey === b.key;
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setSortKey(b.key)}
                  className={
                    "text-xs px-3 py-2 rounded-lg font-medium transition " +
                    (active ? "bg-blue-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50")
                  }
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 표 */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 py-16 text-center">
            {keyword ? "검색 결과가 없어요" : "아직 길드가 없어요"}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* 헤더 행 */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex-1">길드</span>
              <span className="w-20 text-center">인원</span>
              <span className="w-24 text-center">경험치</span>
              <span className="w-28">마스터</span>
              <span className="w-24 text-right">생성일</span>
              <span className="w-8" />
            </div>
            {sorted.map((g) => (
              <Link
                key={g.id}
                href={`/admin/guilds/${g.code}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
              >
                {/* 길드명 + 서버 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                    {g.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-900 truncate">{g.name}</span>
                      {g.isRecruiting && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">모집중</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {g.server && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700">{g.server}</span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">{g.code}</span>
                    </div>
                  </div>
                </div>
                {/* 인원 */}
                <span className="hidden sm:block w-20 text-center text-sm text-slate-600 font-mono">
                  {g.memberCount}/{g.maxMembers}
                </span>
                {/* 경험치 */}
                <span className="hidden sm:block w-24 text-center text-sm text-slate-600 font-mono">
                  {g.totalExp.toLocaleString()}
                </span>
                {/* 마스터 */}
                <span className="hidden sm:block w-28 text-sm text-slate-600 truncate">{g.masterName}</span>
                {/* 생성일 */}
                <span className="hidden sm:block w-24 text-right text-xs text-slate-400 font-mono">{fmtDate(g.createdAt)}</span>
                {/* 상세 보기 아이콘 */}
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 shrink-0"
                  aria-hidden="true"
                >
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
