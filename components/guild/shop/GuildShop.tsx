"use client";
import { useState } from "react";
import { ShoppingBag, Coins, User, Lock, Check, Clock } from "lucide-react";

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
  guildName: string;
  guildPoints: number;
  myPoints: number;
  myRole: string;
  isStaff: boolean;
  items: ShopItem[];
  ownedItemIds: string[];
};

export default function GuildShop({
  guildCode, guildName, guildPoints, myPoints,
  isStaff, items, ownedItemIds,
}: Props) {
  const [tab, setTab] = useState<"activity" | "guild">("activity");

  const activityItems = items.filter((i) => i.shop_type === "activity");
  const guildItems = items.filter((i) => i.shop_type === "guild");
  const currentItems = tab === "activity" ? activityItems : guildItems;

  // 카테고리별 그룹
  const grouped: { [key: string]: ShopItem[] } = {};
  for (const it of currentItems) {
    if (!grouped[it.category]) grouped[it.category] = [];
    grouped[it.category].push(it);
  }
  const categories = Object.keys(grouped);

  const currentBalance = tab === "activity" ? myPoints : guildPoints;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">포인트 상점</h1>
          <p className="text-xs text-violet-300 font-mono">{guildName}</p>
        </div>
      </div>

      {/* 탭 + 보유 포인트 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("activity")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${
              tab === "activity"
                ? "bg-violet-500/20 text-white ring-1 ring-violet-500/40"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
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
                ? "bg-cyan-500/20 text-white ring-1 ring-cyan-500/40"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            길드샵
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 ring-1 ring-border">
          <Coins className={`w-4 h-4 ${tab === "activity" ? "text-violet-300" : "text-cyan-300"}`} />
          <span className="text-xs text-muted-foreground">
            {tab === "activity" ? "내 활동 포인트" : "길드 포인트"}
          </span>
          <span className="text-sm font-bold text-white">
            {currentBalance.toLocaleString()}P
          </span>
        </div>
      </div>

      {/* 길드샵인데 권한 없음 */}
      {tab === "guild" && !isStaff ? (
        <div className="rounded-xl bg-card/40 ring-1 ring-border p-12 text-center">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-white font-medium">길드샵은 마스터·부마스터만 이용할 수 있어요</p>
          <p className="text-xs text-muted-foreground mt-1">
            길드 포인트로 길드 마크, 확성기 등을 구매할 수 있습니다
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl bg-card/40 ring-1 ring-border p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">아직 등록된 상품이 없어요</p>
        </div>
      ) : (
        <div className="space-y-7">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className={`w-1 h-4 rounded-full ${tab === "activity" ? "bg-violet-400" : "bg-cyan-400"}`} />
                {cat}
              </h2>
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
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShopCard({
  item, owned, canAfford, accent,
}: {
  item: ShopItem;
  owned: boolean;
  canAfford: boolean;
  accent: "activity" | "guild";
}) {
  const accentText = accent === "activity" ? "text-violet-300" : "text-cyan-300";

  return (
    <div className="rounded-xl bg-card/60 ring-1 ring-border overflow-hidden flex flex-col">
      <div className="aspect-square bg-black/30 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {item.duration_hours && (
          <span className="inline-flex items-center gap-0.5 self-start px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 mb-1">
            <Clock className="w-2.5 h-2.5" />
            {item.duration_hours}시간
          </span>
        )}
        <p className="text-sm font-bold text-white truncate">{item.name}</p>
        {item.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
        )}
        <p className={`text-base font-bold mt-1.5 ${accentText}`}>
          {item.price.toLocaleString()}
          <span className="text-[10px] text-muted-foreground ml-0.5">P</span>
        </p>

        <button
          type="button"
          disabled={owned || !canAfford}
          className={`mt-2 w-full h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            owned
              ? "bg-white/5 text-muted-foreground cursor-not-allowed"
              : !canAfford
              ? "bg-white/5 text-muted-foreground cursor-not-allowed"
              : accent === "activity"
              ? "bg-violet-600 text-white hover:bg-violet-500"
              : "bg-cyan-600 text-white hover:bg-cyan-500"
          }`}
        >
          {owned ? (
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
