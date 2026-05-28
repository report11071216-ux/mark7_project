"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Calendar, Coins, Check, Loader2, Trash2 } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { equipProfileCard, equipPersonalMark, deletePurchase } from "@/app/mypage/actions";
import toast from "react-hot-toast";

export type MyInventoryItem = {
  id: string;
  item_name: string;
  item_category: string;
  price_paid: number;
  created_at: string;
  image_url: string | null;
  frame_url: string | null;
};

type Props = {
  items: MyInventoryItem[];
  equippedCardId: string | null;
  equippedMarkId: string | null;
};

export default function MyInventory({ items, equippedCardId, equippedMarkId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<MyInventoryItem | null>(null);

  const handleEquip = (
    item: MyInventoryItem,
    type: "card" | "mark",
    isEquipped: boolean
  ) => {
    startTransition(async () => {
      const fn = type === "card" ? equipProfileCard : equipPersonalMark;
      const result = await fn(isEquipped ? null : item.id);
      if (result.success) {
        toast.success(isEquipped ? "장착 해제됨" : `'${item.item_name}' 장착 완료!`);
        router.refresh();
      } else {
        toast.error(result.error ?? "장착에 실패했습니다");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deletePurchase(target.id);
      if (result.success) {
        toast.success(`'${target.item_name}' 삭제됨`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "삭제에 실패했습니다");
      }
    });
  };

  return (
    <div className="plaza-card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-blue-600" />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
          My Items
        </p>
        <span className="text-[10px] font-mono text-slate-400">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <Package className="w-6 h-6 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">아직 구매한 아이템이 없어요</p>
          <p className="text-xs text-slate-400 mt-1">
            길드 상점 활동샵에서 활동 포인트로 구매할 수 있어요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {items.map((item) => {
            const isCard = item.item_category.includes("프로필카드");
            const isMark = item.item_category.includes("마크");
            const equipType: "card" | "mark" | null = isCard
              ? "card"
              : isMark
              ? "mark"
              : null;
            const isEquipped = isCard
              ? equippedCardId === item.id
              : isMark
              ? equippedMarkId === item.id
              : false;

            const previewUrl = isCard
              ? item.frame_url ?? item.image_url
              : item.image_url;

            return (
              <div
                key={item.id}
                className={`flex flex-col rounded-xl border p-3 transition ${
                  isEquipped
                    ? "bg-blue-50 border-blue-300"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                {/* 미리보기 — 전체 정사각 통일 */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2.5 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={item.item_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-7 h-7 text-slate-300" />
                  )}
                  {/* 삭제 버튼 — 우상단 */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    disabled={isPending}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 backdrop-blur ring-1 ring-slate-200 text-slate-400 hover:text-red-500 hover:ring-red-200 transition flex items-center justify-center disabled:opacity-50"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-600 ring-1 ring-violet-200">
                    {item.item_category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5 shrink-0">
                    <Coins className="w-3 h-3" />
                    {item.price_paid.toLocaleString()}P
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">{item.item_name}</p>
                <p className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5 mt-1">
                  <Calendar className="w-3 h-3" />
                  {getRelativeTime(item.created_at)} 구매
                </p>

                {/* 버튼 영역 — mt-auto로 카드 바닥에 정렬 */}
                {equipType ? (
                  <button
                    type="button"
                    onClick={() => handleEquip(item, equipType, isEquipped)}
                    disabled={isPending}
                    className={`mt-2.5 w-full h-8 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-60 ${
                      isEquipped
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isEquipped ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        장착중
                      </>
                    ) : (
                      "장착하기"
                    )}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !isPending && setDeleteTarget(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">아이템 삭제</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Delete Item</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="text-slate-900 font-bold">{deleteTarget.item_name}</span>
                {" "}을(를) 영구 삭제할까요? 삭제하면 인벤토리에서 사라지고{" "}
                <span className="text-red-500 font-bold">포인트는 환불되지 않아요.</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "삭제"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
