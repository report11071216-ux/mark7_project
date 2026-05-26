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
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">레이드</h1>
            <p className="text-xs text-violet-300 font-mono">{guildName}</p>
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
        <div className="rounded-xl bg-card/40 ring-1 ring-border p-12 text-center">
          <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">아직 등록된 레이드가 없어요</p>
          {isStaff && (
            <p className="text-xs text-muted-foreground mt-1">레이드를 추가해보세요</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {raids.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="group rounded-xl overflow-hidden ring-1 ring-border bg-card/60 hover:ring-violet-500/50 transition text-left"
            >
              <div className="aspect-square bg-zinc-900 overflow-hidden">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Swords className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[10px] font-mono text-violet-300 uppercase tracking-wider mb-0.5">
                  레이드
                </p>
                <p className="text-sm font-bold text-white truncate">{r.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 레이드 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-zinc-950 ring-1 ring-zinc-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-zinc-900">
              {selected.image_url ? (
                <img src={selected.image_url} alt={selected.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Swords className="w-10 h-10 text-zinc-700" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-[10px] font-mono text-violet-300 uppercase tracking-wider mb-1">레이드</p>
              <h2 className="text-lg font-bold text-white mb-4">{selected.title}</h2>

              {/* 난이도별 클리어 골드 */}
              <div className="flex items-center gap-1.5 mb-2">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-xs font-bold text-muted-foreground">난이도별 클리어 골드</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "노말", value: selected.gold_normal, color: "text-zinc-300" },
                  { label: "하드", value: selected.gold_hard, color: "text-violet-300" },
                  { label: "나이트메어", value: selected.gold_nightmare, color: "text-rose-300" },
                ].map((g) => (
                  <div
                    key={g.label}
                    className="flex items-center justify-between rounded-lg bg-zinc-900 ring-1 ring-zinc-800 px-3 py-2"
                  >
                    <span className={`text-xs font-bold ${g.color}`}>{g.label}</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      {g.value > 0 ? g.value.toLocaleString() : "—"}
                      {g.value > 0 && <span className="text-[10px] text-muted-foreground ml-0.5">G</span>}
                    </span>
                  </div>
                ))}
              </div>

              {isStaff && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(selected)}
                  className="mt-4 w-full h-10 rounded-lg bg-rose-500/10 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-xs rounded-2xl bg-card ring-1 ring-border p-5">
            <p className="text-sm font-bold text-white mb-1">레이드를 삭제할까요?</p>
            <p className="text-xs text-muted-foreground mb-4">
              '{confirmDelete.title}'을(를) 삭제합니다
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-10 rounded-lg bg-white/5 text-sm font-bold text-muted-foreground hover:bg-white/10 transition"
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
