"use client";

import { useState } from "react";
import { Users, Search, Crown } from "lucide-react";

export type AdminMemberRow = {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  isPlatformAdmin: boolean;
  createdAt: string;
  guilds: { name: string; role: string }[];
};

type SortKey = "createdAt" | "lastSeen" | "name";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function lastSeenLabel(iso: string | null): string {
  if (!iso) return "기록 없음";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 5) return "접속 중";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return fmtDate(iso);
}

function roleLabel(role: string): string {
  if (role === "master") return "마스터";
  if (role === "submaster") return "부마";
  return "길드원";
}

export default function MemberAdminList({ members }: { members: AdminMemberRow[] }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");

  const keyword = q.trim().toLowerCase();
  const filtered = members.filter((m) => {
    if (!keyword) return true;
    if (m.name.toLowerCase().includes(keyword)) return true;
    return m.guilds.some((g) => g.name.toLowerCase().includes(keyword));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "lastSeen") return (b.lastSeenAt || "").localeCompare(a.lastSeenAt || "");
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "createdAt", label: "가입순" },
    { key: "lastSeen", label: "접속순" },
    { key: "name", label: "이름순" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">회원 목록</h2>
          <span className="text-sm text-slate-400 font-mono">{members.length}명</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="닉네임·길드명 검색"
              className="w-52 rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
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

      <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 py-16 text-center">
            {keyword ? "검색 결과가 없어요" : "아직 회원이 없어요"}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex-1">회원</span>
              <span className="flex-1">소속 길드</span>
              <span className="w-24 text-center">마지막 접속</span>
              <span className="w-24 text-right">가입일</span>
            </div>
            {sorted.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                {/* 회원 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold shrink-0">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-900 truncate">{m.name}</span>
                      {m.isPlatformAdmin && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                          <Crown className="w-3 h-3" />관리자
                        </span>
                      )}
                    </div>
                    <span className="sm:hidden text-[11px] text-slate-400">{lastSeenLabel(m.lastSeenAt)}</span>
                  </div>
                </div>
                {/* 소속 길드 */}
                <div className="hidden sm:flex flex-1 min-w-0 flex-wrap gap-1">
                  {m.guilds.length === 0 ? (
                    <span className="text-xs text-slate-400">소속 없음</span>
                  ) : (
                    m.guilds.map((g, i) => (
                      <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[120px]">
                        {g.name}
                        <span className="text-slate-400 ml-1">{roleLabel(g.role)}</span>
                      </span>
                    ))
                  )}
                </div>
                {/* 마지막 접속 */}
                <span className="hidden sm:block w-24 text-center text-xs text-slate-500">{lastSeenLabel(m.lastSeenAt)}</span>
                {/* 가입일 */}
                <span className="hidden sm:block w-24 text-right text-xs text-slate-400 font-mono">{fmtDate(m.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
