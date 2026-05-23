"use client";
import { Package, Megaphone, Clock, Calendar, Coins } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

export type InventoryItem = {
  id: string;
  item_name: string;
  item_category: string;
  price_paid: number;
  created_at: string;
  expires_at: string | null;
  activated_at: string | null;
  megaphone_message: string | null;
};

type Props = {
  guildName: string;
  items: InventoryItem[];
  isStaff: boolean;
};

function megaphoneStatus(item: InventoryItem): "ready" | "active" | "done" {
  if (item.item_category !== "확성기") return "ready";
  if (!item.activated_at) return "ready";
  if (item.expires_at && new Date(item.expires_at).getTime() > Date.now()) {
    return "active";
  }
  return "done";
}

export default function GuildInventory({ guildName, items, isStaff }: Props) {
  const cosmetics = items.filter((i) => i.item_category !== "확성기");
  const megaphones = items.filter((i) => i.item_category === "확성기");

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">길드 보관함</h1>
          <p className="text-xs text-violet-300 font-mono">{guildName}</p>
        </div>
      </div>

      {!isStaff && (
        <div className="rounded-lg bg-card/40 ring-1 ring-border px-4 py-2.5 mb-6">
          <p className="text-xs text-muted-foreground">
            길드 보관함은 누구나 볼 수 있어요. 아이템 사용·관리는 마스터·부마스터만 가능합니다.
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl bg-card/40 ring-1 ring-border p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">아직 구매한 길드 아이템이 없어요</p>
          <p className="text-xs text-muted-foreground mt-1">
            상점에서 길드 포인트로 아이템을 구매해보세요
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 코스메틱 아이템 */}
          {cosmetics.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-violet-400" />
                보유 아이템
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cosmetics.map((item) => (
                  <div key={item.id} className="rounded-xl bg-card/60 ring-1 ring-border p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/15 text-violet-300">
                        {item.item_category}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <Coins className="w-3 h-3" />
                        {item.price_paid.toLocaleString()}P
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{item.item_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-1.5">
                      <Calendar className="w-3 h-3" />
                      {getRelativeTime(item.created_at)} 구매
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 확성기 기록 */}
          {megaphones.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-cyan-400" />
                확성기 기록
              </h2>
              <div className="space-y-2">
                {megaphones.map((item) => {
                  const status = megaphoneStatus(item);
                  return (
                    <div key={item.id} className="rounded-xl bg-card/60 ring-1 ring-border p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
                          <Megaphone className="w-4 h-4 text-cyan-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{item.item_name}</p>
                            {status === "active" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300">
                                노출중
                              </span>
                            )}
                            {status === "ready" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300">
                                미사용
                              </span>
                            )}
                            {status === "done" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-muted-foreground">
                                사용완료
                              </span>
                            )}
                          </div>
                          {item.megaphone_message ? (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {item.megaphone_message}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(item.created_at)} 구매
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {item.price_paid.toLocaleString()}P
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isStaff && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  미사용 확성기는 상점 → 길드샵 → 보유 확성기에서 사용할 수 있어요.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
