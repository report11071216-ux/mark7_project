"use client";
import { useState } from "react";
import { ShieldCheck, ChevronDown, Crown, Star, User, Check, Minus } from "lucide-react";

type Row = {
  label: string;
  master: boolean | string;
  submaster: boolean | string;
  member: boolean | string;
};

const ROWS: Row[] = [
  { label: "출석 · 레이드 참여 · 게시판", master: true, submaster: true, member: true },
  { label: "레이드 일정 만들기", master: true, submaster: true, member: true },
  { label: "레이드 일정 삭제 · 완료 처리", master: true, submaster: true, member: "주최자만" },
  { label: "길드 꾸미기 (테마 · 배너)", master: true, submaster: true, member: false },
  { label: "모집 공고 · 가입 승인", master: true, submaster: true, member: false },
  { label: "디스코드 알림 설정", master: true, submaster: true, member: false },
  { label: "멤버 관리 (추방 · 직위)", master: true, submaster: true, member: false },
  { label: "길드 자랑 올리기", master: true, submaster: true, member: false },
  { label: "길드 삭제", master: true, submaster: false, member: false },
  { label: "마스터 양도", master: true, submaster: false, member: false },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center py-3">
        <Check className="w-4 h-4 text-emerald-600" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center justify-center py-3">
        <Minus className="w-3.5 h-3.5 text-slate-300" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center py-3">
      <span className="text-[10px] font-bold text-amber-600 text-center leading-tight">{value}</span>
    </div>
  );
}

export default function PermissionGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-violet-600" />
          직위별 권한이 궁금하신가요?
        </span>
        <ChevronDown className={"w-4 h-4 text-slate-400 transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open ? (
        <div className="border-t border-slate-100">
          {/* 헤더 */}
          <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr] bg-slate-50 border-b border-slate-200">
            <div className="px-4 py-3 text-xs font-bold text-slate-500">권한</div>
            <div className="px-1 py-3 text-xs font-bold text-center text-amber-700 flex items-center justify-center gap-1">
              <Crown className="w-3.5 h-3.5" /> 마스터
            </div>
            <div className="px-1 py-3 text-xs font-bold text-center text-violet-600 flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5" /> 부마
            </div>
            <div className="px-1 py-3 text-xs font-bold text-center text-slate-500 flex items-center justify-center gap-1">
              <User className="w-3.5 h-3.5" /> 길드원
            </div>
          </div>

          {/* 행 */}
          {ROWS.map((r, i) => (
            <div
              key={r.label}
              className={
                "grid grid-cols-[1.7fr_1fr_1fr_1fr] border-b border-slate-100 last:border-0 " +
                (i % 2 === 1 ? "bg-slate-50/40" : "")
              }
            >
              <div className="px-4 py-3 text-sm text-slate-700 flex items-center">{r.label}</div>
              <Cell value={r.master} />
              <Cell value={r.submaster} />
              <Cell value={r.member} />
            </div>
          ))}

          {/* 안내 */}
          <div className="p-4 bg-violet-50/50 border-t border-slate-100">
            <ul className="text-[13px] text-violet-800/90 space-y-1 leading-relaxed">
              <li>· 레이드 일정은 길드원 누구나 만들 수 있어요. 삭제·완료 처리는 주최자 본인 또는 마스터·부마만 가능해요.</li>
              <li>· 길드 삭제와 마스터 양도는 마스터만 할 수 있어요.</li>
              <li>· 부마스터는 추방·직위 설정 등 운영 전반을 도울 수 있지만, 길드 삭제는 못 해요.</li>
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
