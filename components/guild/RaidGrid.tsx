"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Swords, Plus, Coins, Trash2, Loader2, X } from "lucide-react";
import { deleteRaidEntry } from "@/app/guild/[code]/raids/actions";
import toast from "react-hot-toast";

export type RaidEntry = {
  id: string;
  title: string;
  image_url: string | null;
  gold_normal: number;
  gold_hard: number;
  gold_nightmare: number;
};

type Props = {
  guildCode: string;
  guildName: string;
  raids: RaidEntry[];
  isStaff: boolean;
};

export default function RaidGrid({ guildCode, guildName, raids, isStaff }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<RaidEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RaidEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirmDelete) return;
    const raid = confirmDelete;
    startTransition(async () => {
      const result = await deleteRaidEntry(guildCode, raid.id);
      if (result.success) {
        toast.success("레이드가 삭제되었어요");
        setConfirmDelete(null);
        setSelected(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "삭제에 실패했어요");
      }
    });
  };

  return (
    <div className="pb-24 md:pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">RAID CODEX</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">레이드 도감</h1>
          </div>
        </div>
        {isStaff && (
          <Link
            href={`/guild/${guildCode}/raids/new`}
            className="flex items-center gap-1.5 px-4 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            레이드 추가
          </Link>
        )}
      </div>

      {raids.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
          <Swords className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">아직 등록된 레이드가 없어요</p>
          {isStaff && (
            <p className="text-xs text-slate-400 mt-1">레이드를 추가해보세요</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {raids.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:border-violet-300 hover:shadow-md transition text-left"
            >
              <div className="aspect-square bg-slate-100 overflow-hidden">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Swords className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[10px] font-mono text-violet-500 uppercase tracking-wider mb-0.5">
                  레이드
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 레이드 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-slate-100">
              {selected.image_url ? (
                <img src={selected.image_url} alt={selected.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Swords className="w-10 h-10 text-slate-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-[10px] font-mono text-violet-500 uppercase tracking-wider mb-1">레이드</p>
              <h2 className="text-lg font-bold text-slate-900 mb-4">{selected.title}</h2>

              {/* 난이도별 클리어 골드 */}
              <div className="flex items-center gap-1.5 mb-2">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-xs font-bold text-slate-500">난이도별 클리어 골드</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "노말", value: selected.gold_normal, color: "text-slate-600" },
                  { label: "하드", value: selected.gold_hard, color: "text-rose-500" },
                  { label: "나이트메어", value: selected.gold_nightmare, color: "text-violet-600" },
                ].map((g) => (
                  <div
                    key={g.label}
                    className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2"
                  >
                    <span className={`text-xs font-bold ${g.color}`}>{g.label}</span>
                    <span className="text-sm font-bold text-amber-600 font-mono">
                      {g.value > 0 ? g.value.toLocaleString() : "—"}
                      {g.value > 0 && <span className="text-[10px] text-slate-400 ml-0.5">G</span>}
                    </span>
                  </div>
                ))}
              </div>

              {isStaff && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(selected)}
                  className="mt-4 w-full h-10 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  레이드 삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xs rounded-2xl bg-white border border-slate-200 shadow-2xl p-5">
            <p className="text-sm font-bold text-slate-900 mb-1">레이드를 삭제할까요?</p>
            <p className="text-xs text-slate-500 mb-4">
              '{confirmDelete.title}'을(를) 삭제합니다
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 h-10 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-500 disabled:opacity-60 transition flex items-center justify-center"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
