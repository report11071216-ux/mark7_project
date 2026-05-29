"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Coins, User, Lock, Check, Clock, Loader2, X } from "lucide-react";
import { purchaseItem } from "@/app/guild/[code]/shop/actions";
import { type MegaphoneItem } from "@/components/guild/shop/MegaphoneInventory";
import toast from "react-hot-toast";

export type ShopItem = {
  id: string;
  shop_type: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  duration_hours: number | null;
};

type Props = {
  guildCode: string;
  guildId: string;
  guildName: string;
  guildPoints: number;
  myPoints: number;
  myRole: string;
  isStaff: boolean;
  items: ShopItem[];
  ownedItemIds: string[];
  megaphoneItems: MegaphoneItem[];
};

export default function GuildShop({
  guildCode, guildId, guildName, guildPoints, myPoints,
  isStaff, items, ownedItemIds, megaphoneItems,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"activity" | "guild">("activity");
  const [catTab, setCatTab] = useState<string>("전체");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  const activityItems = items.filter((i) => i.shop_type === "activity");
  const guildItems = items.filter((i) => i.shop_type === "guild");
  const currentItems = tab === "activity" ? activityItems : guildItems;

  const categories: string[] = [];
  for (const it of currentItems) {
    if (!categories.includes(it.category)) categories.push(it.category);
  }

  useEffect(() => {
    setCatTab("전체");
  }, [tab]);

  const filteredItems =
    catTab === "전체" ? currentItems : currentItems.filter((i) => i.category === catTab);

  const grouped: { [key: string]: ShopItem[] } = {};
  for (const it of filteredItems) {
    if (!grouped[it.category]) grouped[it.category] = [];
    grouped[it.category].push(it);
  }
  const groupedCats = Object.keys(grouped);

  const currentBalance = tab === "activity" ? myPoints : guildPoints;

  const confirmPurchase = () => {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);
    setPendingId(item.id);
    startTransition(async () => {
      const result = await purchaseItem(guildCode, item.id, guildId);
      setPendingId(null);
      if (result.success) {
        toast.success(`'${result.item_name}' 구매 완료!`);
        router.refresh();
      } else {
        toast.error(result.error ?? "구매에 실패했습니다");
      }
    });
  };

  const accent = tab;
  const accentText = accent === "activity" ? "text-violet-600" : "text-cyan-600";
  const balanceAfter = confirmItem ? currentBalance - confirmItem.price : 0;

  const countOf = (cat: string) =>
    cat === "전체" ? currentItems.length : currentItems.filter((i) => i.category === cat).length;

  const showGuildLock = tab === "guild" && !isStaff;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">POINT SHOP</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">포인트 상점</h1>
          </div>
        </div>

        {/* 샵 탭 + 보유 포인트 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("activity")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${
                tab === "activity"
                  ? "bg-violet-50 text-violet-700 border border-violet-300"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <User className="w-4 h-4" />
              활동샵
            </button>
            <button
              type="button"
              onClick={() => setTab("guild")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${
                tab === "guild"
                  ? "bg-cyan-50 text-cyan-700 border border-cyan-300"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              길드샵
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
            <Coins className={`w-4 h-4 ${tab === "activity" ? "text-violet-500" : "text-cyan-500"}`} />
            <span className="text-xs text-slate-500">
              {tab === "activity" ? "내 활동 포인트" : "길드 포인트"}
            </span>
            <span className="text-sm font-bold text-slate-900">
              {currentBalance.toLocaleString()}P
            </span>
          </div>
        </div>

        {/* 카테고리 탭 */}
        {!showGuildLock && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-white ring-1 ring-slate-200 mb-6">
            {["전체", ...categories].map((cat) => {
              const active = catTab === cat;
              const activeColor =
                tab === "activity"
                  ? "bg-violet-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.25)]"
                  : "bg-cyan-600 text-white shadow-[0_2px_8px_rgba(8,145,178,0.25)]";
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatTab(cat)}
                  className={
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition " +
                    (active ? activeColor : "text-slate-600 hover:bg-slate-100")
                  }
                >
                  {cat}
                  <span className={"text-[11px] font-mono px-1.5 rounded " + (active ? "bg-white/20" : "bg-slate-100 text-slate-400")}>
                    {countOf(cat)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {showGuildLock ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-800 font-medium">길드샵은 마스터·부마스터만 이용할 수 있어요</p>
            <p className="text-xs text-slate-400 mt-1">
              길드 포인트로 길드 마크, 확성기 등을 구매할 수 있습니다
            </p>
          </div>
        ) : groupedCats.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">
              {categories.length === 0 ? "아직 등록된 상품이 없어요" : "이 분류에 상품이 없어요"}
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {groupedCats.map((cat) => (
              <div key={cat}>
                {catTab === "전체" && (
                  <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className={`w-1 h-4 rounded-full ${tab === "activity" ? "bg-violet-500" : "bg-cyan-500"}`} />
                    {cat}
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {grouped[cat].map((item) => {
                    const owned = ownedItemIds.includes(item.id);
                    const canAfford = currentBalance >= item.price;
                    return (
                      <ShopCard
                        key={item.id}
                        item={item}
                        owned={owned}
                        canAfford={canAfford}
                        accent={tab}
                        loading={pendingId === item.id && isPending}
                        disabled={isPending}
                        onBuy={() => setConfirmItem(item)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 구매 확인 모달 */}
        {confirmItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">구매 확인</h3>
                <button
                  type="button"
                  onClick={() => setConfirmItem(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {confirmItem.image_url ? (
                      <img src={confirmItem.image_url} alt={confirmItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">{confirmItem.category}</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{confirmItem.name}</p>
                    <p className={`text-base font-bold ${accentText}`}>
                      {confirmItem.price.toLocaleString()}
                      <span className="text-[10px] text-slate-400 ml-0.5">P</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {tab === "activity" ? "내 활동 포인트" : "길드 포인트"}
                    </span>
                    <span className="text-slate-900 font-mono">{currentBalance.toLocaleString()}P</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">구매 후</span>
                    <span className={`font-mono font-bold ${accentText}`}>
                      {balanceAfter.toLocaleString()}P
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmItem(null)}
                    className="flex-1 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={confirmPurchase}
                    className={`flex-1 h-10 rounded-lg text-white text-sm font-bold transition ${
                      accent === "activity"
                        ? "bg-violet-600 hover:bg-violet-500"
                        : "bg-cyan-600 hover:bg-cyan-500"
                    }`}
                  >
                    구매하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShopCard({
  item, owned, canAfford, accent, loading, disabled, onBuy,
}: {
  item: ShopItem;
  owned: boolean;
  canAfford: boolean;
  accent: "activity" | "guild";
  loading: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  const accentText = accent === "activity" ? "text-violet-600" : "text-cyan-600";
  const buyable = !owned && canAfford && !disabled;

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag className="w-8 h-8 text-slate-300" />
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {item.duration_hours && (
          <span className="inline-flex items-center gap-0.5 self-start px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700 mb-1">
            <Clock className="w-2.5 h-2.5" />
            {item.duration_hours}시간
          </span>
        )}
        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
        {item.description && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
        )}
        <p className={`text-base font-bold mt-1.5 ${accentText}`}>
          {item.price.toLocaleString()}
          <span className="text-[10px] text-slate-400 ml-0.5">P</span>
        </p>

        <button
          type="button"
          onClick={onBuy}
          disabled={!buyable}
          className={`mt-2 w-full h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            owned
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : !canAfford
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : accent === "activity"
              ? "bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60"
              : "bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-60"
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : owned ? (
            <>
              <Check className="w-3.5 h-3.5" />
              보유중
            </>
          ) : !canAfford ? (
            "포인트 부족"
          ) : (
            "구매하기"
          )}
        </button>
      </div>
    </div>
  );
}
