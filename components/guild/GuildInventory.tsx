"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Megaphone, Clock, Calendar, Coins, Check, Loader2, Smile } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { equipGuildMark, toggleStickerPack } from "@/app/guild/[code]/shop/actions";
import toast from "react-hot-toast";

export type InventoryItem = {
  id: string;
  item_name: string;
  item_category: string;
  price_paid: number;
  created_at: string;
  expires_at: string | null;
  activated_at: string | null;
  megaphone_message: string | null;
  image_url: string | null;
};

export type StickerPack = {
  shop_item_id: string;
  name: string;
  cover_url: string | null;
  stickers: string[];
  equipped: boolean;
};

type Props = {
  guildCode: string;
  guildId: string;
  guildName: string;
  items: InventoryItem[];
  isStaff: boolean;
  equippedMarkId: string | null;
  stickerPacks: StickerPack[];
};

function megaphoneStatus(item: InventoryItem): "ready" | "active" | "done" {
  if (item.item_category !== "확성기") return "ready";
  if (!item.activated_at) return "ready";
  if (item.expires_at && new Date(item.expires_at).getTime() > Date.now()) {
    return "active";
  }
  return "done";
}

export default function GuildInventory({
  guildCode, guildId, guildName, items, isStaff, equippedMarkId, stickerPacks,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [packPending, setPackPending] = useState<string | null>(null);

  // 이모티콘팩은 별도 섹션에서 보여주니 보유 아이템에선 제외
  const cosmetics = items.filter(
    (i) => i.item_category !== "확성기" && i.item_category !== "이모티콘팩"
  );
  const megaphones = items.filter((i) => i.item_category === "확성기");

  const handleEquipMark = (item: InventoryItem, isEquipped: boolean) => {
    startTransition(async () => {
      const result = await equipGuildMark(guildCode, isEquipped ? null : item.id, guildId);
      if (result.success) {
        toast.success(isEquipped ? "장착 해제됨" : `'${item.item_name}' 장착 완료!`);
        router.refresh();
      } else {
        toast.error(result.error ?? "장착에 실패했습니다");
      }
    });
  };

  const handleTogglePack = async (pack: StickerPack) => {
    if (packPending) return;
    setPackPending(pack.shop_item_id);
    const result = await toggleStickerPack(guildCode, guildId, pack.shop_item_id);
    setPackPending(null);
    if (result.success) {
      toast.success(pack.equipped ? "장착 해제됨" : `'${pack.name}' 장착 완료!`);
      router.refresh();
    } else {
      toast.error(result.error ?? "장착에 실패했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GUILD STORAGE</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">길드 보관함</h1>
          </div>
        </div>

        {!isStaff && (
          <div className="rounded-lg bg-white border border-slate-200 px-4 py-2.5 mb-6">
            <p className="text-xs text-slate-500">
              길드 보관함은 누구나 볼 수 있어요. 아이템 사용·관리는 마스터·부마스터만 가능합니다.
            </p>
          </div>
        )}

        {items.length === 0 && stickerPacks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">아직 구매한 길드 아이템이 없어요</p>
            <p className="text-xs text-slate-400 mt-1">
              상점에서 길드 포인트로 아이템을 구매해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 이모티콘팩 섹션 */}
            {stickerPacks.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-cyan-500" />
                  이모티콘팩
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stickerPacks.map((pack) => (
                    <div
                      key={pack.shop_item_id}
                      className={`rounded-xl border p-3.5 transition ${
                        pack.equipped
                          ? "bg-cyan-50 border-cyan-300"
                          : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                          {pack.cover_url ? (
                            <img src={pack.cover_url} alt={pack.name} className="w-full h-full object-cover" />
                          ) : (
                            <Smile className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 min-w-0 truncate">{pack.name}</p>
                      </div>

                      {/* 이모티콘 5개 미리보기 */}
                      <div className="flex gap-1.5 mb-3">
                        {pack.stickers.map((url, i) => (
                          <div key={i} className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                            <img src={url} alt={`이모티콘 ${i + 1}`} className="max-w-full max-h-full object-contain" />
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTogglePack(pack)}
                        disabled={packPending === pack.shop_item_id || !isStaff}
                        className={`w-full h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                          pack.equipped
                            ? "bg-cyan-600 text-white hover:bg-cyan-500"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {packPending === pack.shop_item_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : pack.equipped ? (
                          <><Check className="w-3.5 h-3.5" />장착중 (채팅에서 사용 가능)</>
                        ) : isStaff ? (
                          "채팅에 장착"
                        ) : (
                          "마스터·부마스터만"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 보유 아이템 (마크/프로필카드 등) */}
            {cosmetics.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-violet-500" />
                  보유 아이템
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cosmetics.map((item) => {
                    const isMark = item.item_category.includes("마크");
                    const isEquipped = equippedMarkId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3.5 transition ${
                          isEquipped
                            ? "bg-cyan-50 border-cyan-300"
                            : "bg-white border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2.5 flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.item_name} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-7 h-7 text-slate-300" />
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700">
                            {item.item_category}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5 shrink-0">
                            <Coins className="w-3 h-3" />
                            {item.price_paid.toLocaleString()}P
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{item.item_name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-1">
                          <Calendar className="w-3 h-3" />
                          {getRelativeTime(item.created_at)} 구매
                        </p>

                        {isMark && (
                          <button
                            type="button"
                            onClick={() => handleEquipMark(item, isEquipped)}
                            disabled={isPending || !isStaff}
                            className={`mt-2.5 w-full h-8 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isEquipped
                                ? "bg-cyan-600 text-white hover:bg-cyan-500"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isEquipped ? (
                              <><Check className="w-3.5 h-3.5" />장착중</>
                            ) : isStaff ? (
                              "길드 로고로 장착"
                            ) : (
                              "마스터·부마스터만"
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 확성기 기록 */}
            {megaphones.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-cyan-500" />
                  확성기 기록
                </h2>
                <div className="space-y-2">
                  {megaphones.map((item) => {
                    const status = megaphoneStatus(item);
                    return (
                      <div key={item.id} className="rounded-xl bg-white border border-slate-200 shadow-sm p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                            <Megaphone className="w-4 h-4 text-cyan-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{item.item_name}</p>
                              {status === "active" && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-700">노출중</span>
                              )}
                              {status === "ready" && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700">미사용</span>
                              )}
                              {status === "done" && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">사용완료</span>
                              )}
                            </div>
                            {item.megaphone_message ? (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.megaphone_message}</p>
                            ) : (
                              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {getRelativeTime(item.created_at)} 구매
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {item.price_paid.toLocaleString()}P
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {isStaff && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    미사용 확성기는 상점 → 길드샵 → 보유 확성기에서 사용할 수 있어요.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
