"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronUp, Plus, LogIn, Shield } from "lucide-react";

export type MyGuildBtnItem = {
  code: string;
  name: string;
  role: string;
  myPoints: number;
  server: string | null;
  logoUrl: string | null;
};

const ROLE_LABEL: { [key: string]: string } = {
  master: "마스터",
  submaster: "부마스터",
  member: "멤버",
};

export default function MyGuildButton({
  isLoggedIn,
  guilds,
}: {
  isLoggedIn: boolean;
  guilds: MyGuildBtnItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // 비로그인 → 로그인 버튼
  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-plaza-accent text-plaza-canvas text-sm font-bold hover:opacity-90 transition"
      >
        <LogIn className="w-4 h-4" />
        로그인
      </button>
    );
  }

  // 로그인 + 길드 0개 → 길드 만들기
  if (guilds.length === 0) {
    return (
      <button
        type="button"
        onClick={() => router.push("/onboarding/create")}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-plaza-accent text-plaza-canvas text-sm font-bold hover:opacity-90 transition"
      >
        <Plus className="w-4 h-4" />
        길드 만들기
      </button>
    );
  }

  // 길드 1개 → 바로 이동 (드롭다운 없이)
  if (guilds.length === 1) {
    const g = guilds[0];
    return (
      <button
        type="button"
        onClick={() => router.push(`/guild/${g.code}`)}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-plaza-accent text-plaza-canvas text-sm font-bold hover:opacity-90 transition max-w-[180px]"
      >
        <Users className="w-4 h-4 shrink-0" />
        <span className="truncate">{g.name}</span>
      </button>
    );
  }

  // 길드 2개 이상 → 드롭다운
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-plaza-accent text-plaza-canvas text-sm font-bold hover:opacity-90 transition"
      >
        <Users className="w-4 h-4" />
        내 길드
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-[230px] bg-plaza-surface border border-plaza-line rounded-xl p-1.5 shadow-2xl z-50">
          <p className="text-[9px] font-mono text-plaza-ink-dim uppercase tracking-[0.15em] px-2 pt-1.5 pb-1">
            내가 속한 길드
          </p>
          {guilds.map((g) => (
            <button
              key={g.code}
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/guild/${g.code}`);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-plaza-surface-2 transition text-left"
            >
              {g.logoUrl ? (
                <img src={g.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-plaza-accent-soft flex items-center justify-center text-xs font-bold text-plaza-accent shrink-0">
                  {g.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-plaza-ink truncate">{g.name}</p>
                <p className="text-[10px] text-plaza-ink-dim">
                  {ROLE_LABEL[g.role] ?? "멤버"} · {g.myPoints}P
                </p>
              </div>
              {g.server ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-plaza-accent-soft text-plaza-accent shrink-0">
                  {g.server}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
