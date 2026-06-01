"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Clock, Loader2, X, Check, Trash2 } from "lucide-react";
import { activateMegaphone, deleteGuildPurchase } from "@/app/guild/[code]/shop/actions";
import toast from "react-hot-toast";

export type MegaphoneItem = {
  id: string;
  item_name: string;
  duration_hours: number | null;
  activated_at: string | null;
  expires_at: string | null;
  megaphone_message: string | null;
};

type Props = {
  guildCode: string;
  guildId: string;
  items: MegaphoneItem[];
  canUse: boolean;
};

function statusOf(item: MegaphoneItem): "ready" | "active" | "expired" {
  if (!item.activated_at) return "ready";
  if (item.expires_at && new Date(item.expires_at).getTime() > Date.now()) {
    return "active";
  }
  return "expired";
}

export default function MegaphoneInventory({ guildCode, guildId, items, canUse }: Props) {
  const router = useRouter();
  const [modalId, setModalId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletePending, setDeletePending] = useState<string | null>(null);

  if (items.length === 0) return null;

  const handleActivate = () => {
    if (!modalId) return;
    if (!message.trim()) {
      toast.error("확성기 문구를 입력하세요");
      return;
    }
    startTransition(async () => {
      const result = await activateMegaphone(guildCode, modalId, message.trim());
      if (result.success) {
        toast.success("확성기가 광장에 노출됩니다!");
        setModalId(null);
        setMessage("");
        router.refresh();
      } else {
        toast.error(result.error ?? "사용에 실패했습니다");
      }
    });
  };

  const handleDelete = async (item: MegaphoneItem) => {
    if (deletePending) return;
    setDeletePending(item.id);
    const result = await deleteGuildPurchase(guildCode, guildId, item.id);
    setDeletePending(null);
    if (result.success) {
      toast.success("삭제되었습니다");
      router.refresh();
    } else {
      toast.error(result.error ?? "삭제에 실패했습니다");
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-cyan-500" />
        보유 확성기
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const status = statusOf(item);
          return (
            <div
              key={item.id}
              className="rounded-xl bg-white border border-slate-200 shadow-sm p-3.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.item_name}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {item.duration_hours ?? "?"}시간
                  </p>
                </div>
              </div>

              {status === "ready" && (
                <button
                  type="button"
                  onClick={() => { setModalId(item.id); setMessage(""); }}
                  disabled={!canUse}
                  className="w-full h-9 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {canUse ? "사용하기" : "마스터·부마스터만"}
                </button>
              )}
              {status === "active" && (
                <div className="rounded-lg bg-cyan-50 border border-cyan-200 px-2.5 py-2">
                  <p className="text-[10px] text-cyan-700 font-bold mb-0.5">광장 노출중</p>
                  <p className="text-[11px] text-slate-700 truncate">{item.megaphone_message}</p>
                </div>
              )}
              {status === "expired" && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-xs text-slate-400">사용 완료</span>
                  </div>
                  {canUse && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletePending === item.id}
                      className="h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 disabled:opacity-50 transition flex items-center justify-center shrink-0"
                      aria-label="삭제"
                      title="삭제"
                    >
                      {deletePending === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사용 모달 */}
      {modalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-600" />
                확성기 문구 작성
              </h3>
              <button
                type="button"
                onClick={() => setModalId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-2">
              광장 상단에 흐를 문구예요. 사용하면 바로 노출이 시작됩니다.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 100))}
              placeholder="예: 카제로스 서버 쁘밍 길드 신규 길드원 모집! 디스코드로 문의주세요"
              rows={3}
              className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-1.5 mb-4">
              <span className="text-[11px] text-slate-400">{message.length}/100</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalId(null)}
                className="flex-1 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={isPending}
                className="flex-1 h-10 rounded-lg bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                사용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
