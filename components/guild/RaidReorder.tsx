// components/guild/RaidReorder.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Swords, GripVertical, Check, X, Loader2, ArrowUpDown } from "lucide-react";
import { updateRaidOrder } from "@/app/guild/[code]/raids/actions";
import toast from "react-hot-toast";

export type ReorderRaid = {
  id: string;
  title: string;
  image_url: string | null;
};

type Props = {
  guildCode: string;
  raids: ReorderRaid[];
};

export default function RaidReorder({ guildCode, raids }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<ReorderRaid[]>(raids);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // 편집 시작
  const startEdit = () => {
    setOrder(raids);
    setEditing(true);
  };

  // 취소
  const cancel = () => {
    setOrder(raids);
    setEditing(false);
    setDragIndex(null);
  };

  // 드래그한 카드를 target 위치로 이동
  const moveItem = (from: number, to: number) => {
    if (from === to) return;
    const next = order.slice();
    const moved = next.splice(from, 1)[0];
    next.splice(to, 0, moved);
    setOrder(next);
  };

  // 저장
  const save = () => {
    startTransition(async () => {
      const result = await updateRaidOrder(guildCode, order.map((r) => r.id));
      if (result.success) {
        toast.success("순서가 저장되었어요");
        setEditing(false);
        setDragIndex(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "저장에 실패했어요");
      }
    });
  };

  if (raids.length < 2) return null;

  // ── 편집 모드 OFF: "순서 편집" 버튼만 ──
  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:border-violet-300 hover:text-violet-600 transition"
      >
        <ArrowUpDown className="w-4 h-4" />
        순서 편집
      </button>
    );
  }

  // ── 편집 모드 ON: 드래그 그리드 + 저장/취소 ──
  return (
    <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs font-bold text-violet-700">
          카드를 끌어서 순서를 바꾼 뒤 저장하세요
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={cancel}
            disabled={isPending}
            className="flex items-center gap-1 px-3 h-9 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition disabled:opacity-60"
          >
            <X className="w-4 h-4" />
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="flex items-center gap-1 px-4 h-9 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            순서 저장
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {order.map((r, i) => (
          <div
            key={r.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) moveItem(dragIndex, i);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={`relative rounded-xl overflow-hidden border bg-white cursor-grab active:cursor-grabbing transition ${
              dragIndex === i ? "border-violet-400 opacity-50" : "border-slate-200 hover:border-violet-300"
            }`}
          >
            <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur text-white">
              <GripVertical className="w-3 h-3" />
              <span className="text-[11px] font-bold">{i + 1}</span>
            </div>
            <div className="aspect-square bg-slate-100 overflow-hidden pointer-events-none">
              {r.image_url ? (
                <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Swords className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>
            <div className="p-2.5 pointer-events-none">
              <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
