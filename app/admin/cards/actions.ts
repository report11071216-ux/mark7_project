"use client";
import { useState } from "react";
import { Trash2, Loader2, EyeOff } from "lucide-react";
import { deleteCard, toggleCardActive } from "@/app/admin/cards/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  id: string;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
  ringClass: string;
};

export default function CardItem({ id, name, imageUrl, isActive, ringClass }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    const res = await deleteCard(id);
    setBusy(false);
    setConfirm(false);
    if (res.ok) {
      if (res.archived) {
        toast.success(`보유자 ${res.holders}명이 있어 절판(비활성) 처리됐어요`);
      } else {
        toast.success("카드를 삭제했어요");
      }
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    const res = await toggleCardActive(id, !isActive);
    setBusy(false);
    if (res.ok) {
      toast.success(isActive ? "뽑기 풀에서 제외됨" : "뽑기 풀에 추가됨");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden relative group">
      <div className="aspect-[3/4] bg-slate-100 overflow-hidden relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className={`w-full h-full object-cover ring-2 ${ringClass} ${!isActive ? "grayscale opacity-50" : ""}`}
          />
        ) : null}
        {!isActive && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[9px] font-bold">절판</span>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-bold text-slate-900 truncate mb-1.5">{name}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            className="flex-1 h-7 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition disabled:opacity-50 flex items-center justify-center gap-0.5"
          >
            <EyeOff className="w-3 h-3" />
            {isActive ? "끄기" : "켜기"}
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            disabled={busy}
            className="h-7 px-2 rounded-md bg-rose-50 text-rose-500 text-[10px] font-bold hover:bg-rose-100 transition disabled:opacity-50 flex items-center justify-center"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {confirm && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-2 z-10">
          <p className="text-[11px] text-slate-700 text-center mb-2 font-bold">삭제할까요?</p>
          <p className="text-[9px] text-slate-400 text-center mb-2 leading-tight">보유자가 있으면 절판 처리돼요</p>
          <div className="flex gap-1 w-full">
            <button type="button" onClick={() => setConfirm(false)} className="flex-1 h-7 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">취소</button>
            <button type="button" onClick={handleDelete} className="flex-1 h-7 rounded-md bg-rose-500 text-white text-[10px] font-bold">삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}
