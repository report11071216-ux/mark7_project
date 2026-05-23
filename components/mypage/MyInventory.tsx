"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Calendar, Coins, Check, Loader2 } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { equipProfileCard } from "@/app/mypage/actions";
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
};

export default function MyInventory({ items, equippedCardId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEquip = (item: MyInventoryItem, isEquipped: boolean) => {
    startTransition(async () => {
      const result = await equipProfileCard(isEquipped ? null : item.id);
      if (result.success) {
        toast.success(isEquipped ? "장착 해제됨" : `'${item.item_name}' 장착 완료!`);
        router.refresh();
      } else {
        toast.error(result.error ?? "장착에 실패했습니다");
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
            const isEquipped = equippedCardId === item.id;
            // 프로필카드는 프레임 이미지, 그 외는 썸네일
            const previewUrl = isCard
              ? item.frame_url ?? item.image_url
              : item.image_url;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 transition ${
                  isEquipped
                    ? "bg-blue-50 border-blue-300"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                {/* 이미지 미리보기 */}
                <div className={`rounded-lg overflow-hidden bg-slate-100 mb-2.5 flex items-center justify-center ${
                  isCard ? "aspect-[3/2]" : "aspect-square"
                }`}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={item.item_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-7 h-7 text-slate-300" />
                  )}
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

                {isCard && (
                  <button
                    type="button"
                    onClick={() => handleEquip(item, isEquipped)}
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
