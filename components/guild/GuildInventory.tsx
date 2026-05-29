"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Megaphone, Clock, Calendar, Coins, Check, Loader2, Smile, Trash2, X, ChevronDown } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { equipGuildMark, toggleStickerPack, deleteGuildPurchase } from "@/app/guild/[code]/shop/actions";
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

type TabKey = "all" | "sticker" | "cosmetic" | "megaphone";

function megaphoneStatus(item: InventoryItem): "ready" | "active" | "done" {
  if (item.item_category !== "확성기") return "ready";
  if (!item.activated_at) return "ready";
  if (item.expires_at && new Date(item.expires_at).getTime() > Date.now()) return "active";
  return "done";
}

export default function GuildInventory({
  guildCode, guildId, items, isStaff, equippedMarkId, stickerPacks,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [packPending, setPackPending] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InventoryItem | null>(null);
  const [tab, setTab] = useState<TabKey>("all");
  const [showDoneMega, setShowDoneMega] = useState(false);

  const cosmetics = items.filter(
    (i) => i.item_category !== "확성기" && i.item_category !== "이모티콘팩"
  );
  const megaphones = items.filter((i) => i.item_category === "확성기");

  // 확성기: 활성(미사용/노출중) vs 완료 분리
  const activeMega = megaphones.filter((m) => megaphoneStatus(m) !== "done");
  const doneMega = megaphones.filter((m) => megaphoneStatus(m) === "done");

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "전체", count: stickerPacks.length + cosmetics.length + megaphones.length },
    { key: "sticker", label: "이모티콘팩", count: stickerPacks.length },
    { key: "cosmetic", label: "코스메틱", count: cosmetics.length },
    { key: "megaphone", label: "확성기", count: megaphones.length },
  ];

  const showSticker = tab === "all" || tab === "sticker";
  const showCosmetic = tab === "all" || tab === "cosmetic";
  const showMegaphone = tab === "all" || tab === "megaphone";

  const handleEquipMark = (item: InventoryItem, isEquipped: boolean) => {
    startTransition(async () => {
      const result = await equipGuildMark(guildCode, isEquipped ? null : item.id, guildId);
      if (result.success) {
        toast.success(isEquipped ? "장착 해제됨" : `'${item.item_name}' 장착 완료!`);
        router.refresh();
      } else { toast.error(result.error ?? "장착에 실패했습니다"); }
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
    } else { toast.error(result.error ?? "장착에 실패했습니다"); }
  };

  const handleDelete = async () => {
    if (!confirmDelete || deletePending) return;
    const item = confirmDelete;
    setDeletePending(item.id);
    const result = await deleteGuildPurchase(guildCode, guildId, item.id);
    setDeletePending(null);
    setConfirmDelete(null);
    if (result.success) {
      toast.success("삭제되었습니다");
      router.refresh();
    } else { toast.error(result.error ?? "삭제에 실패했습니다"); }
  };

  const totalCount = stickerPacks.length + cosmetics.length + megaphones.length;

  function renderMegaRow(item: InventoryItem) {
    const status = megaphoneStatus(item);
    return (
      <div key={item.id} className="group relative rounded-xl bg-white border border-slate-200 shadow-sm p-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0"><Megaphone className="w-4 h-4 text-cyan-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">{item.item_name}</p>
              {status === "active" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-700">노출중</span>}
              {status === "ready" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700">미사용</span>}
              {status === "done" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">사용완료</span>}
            </div>
            {item.megaphone_message ? <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.megaphone_message}</p>
              : <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-0.5"><Clock className="w-3 h-3" />{getRelativeTime(item.created_at)} 구매</p>}
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">{item.price_paid.toLocaleString()}P</span>
          {isStaff && (
            <button type="button" onClick={() => setConfirmDelete(item)} disabled={deletePending === item.id}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 shrink-0 disabled:opacity-50"
              aria-label="삭제" title="삭제">
              {deletePending === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    );
  }

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

        {/* 탭 */}
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-white ring-1 ring-slate-200 mb-6">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={"flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition " + (active ? "bg-violet-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.25)]" : "text-slate-600 hover:bg-slate-100")}>
                {t.label}
                <span className={"text-[11px] font-mono px-1.5 rounded " + (active ? "bg-white/20" : "bg-slate-100 text-slate-400")}>{t.count}</span>
              </button>
            );
          })}
        </div>

        {!isStaff && (
          <div className="rounded-lg bg-white border border-slate-200 px-4 py-2.5 mb-6">
            <p className="text-xs text-slate-500">
              길드 보관함은 누구나 볼 수 있어요. 아이템 사용·관리는 마스터·부마스터만 가능합니다.
            </p>
          </div>
        )}

        {totalCount === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">아직 구매한 길드 아이템이 없어요</p>
            <p className="text-xs text-slate-400 mt-1">상점에서 길드 포인트로 아이템을 구매해보세요</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 이모티콘팩 */}
            {showSticker && stickerPacks.length > 0 && (
              <div>
                {tab === "all" && (
                  <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-cyan-500" />이모티콘팩
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stickerPacks.map((pack) => (
                    <div key={pack.shop_item_id}
                      className={"rounded-xl border p-3.5 transition " + (pack.equipped ? "bg-cyan-50 border-cyan-300" : "bg-white border-slate-200 shadow-sm")}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                          {pack.cover_url ? <img src={pack.cover_url} alt={pack.name} className="w-full h-full object-cover" /> : <Smile className="w-5 h-5 text-slate-300" />}
                        </div>
                        <p className="text-sm font-bold text-slate-900 min-w-0 truncate">{pack.name}</p>
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        {pack.stickers.map((url, i) => (
                          <div key={i} className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                            <img src={url} alt={`이모티콘 ${i + 1}`} className="max-w-full max-h-full object-contain" />
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => handleTogglePack(pack)} disabled={packPending === pack.shop_item_id || !isStaff}
                        className={"w-full h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed " + (pack.equipped ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                        {packPending === pack.shop_item_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : pack.equipped ? <><Check className="w-3.5 h-3.5" />장착중 (채팅에서 사용 가능)</>
                          : isStaff ? "채팅에 장착" : "마스터·부마스터만"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 코스메틱 */}
            {showCosmetic && cosmetics.length > 0 && (
              <div>
                {tab === "all" && (
                  <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-violet-500" />코스메틱
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cosmetics.map((item) => {
                    const isMark = item.item_category.includes("마크");
                    const isEquipped = equippedMarkId === item.id;
                    return (
                      <div key={item.id}
                        className={"group relative rounded-xl border p-3.5 transition " + (isEquipped ? "bg-cyan-50 border-cyan-300" : "bg-white border-slate-200 shadow-sm")}>
                        {isStaff && (
                          <button type="button" onClick={() => setConfirmDelete(item)} disabled={deletePending === item.id}
                            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-white/90 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 disabled:opacity-50"
                            aria-label="삭제" title="삭제">
                            {deletePending === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2.5 flex items-center justify-center">
                          {item.image_url ? <img src={item.image_url} alt={item.item_name} className="w-full h-full object-contain" /> : <Package className="w-7 h-7 text-slate-300" />}
                        </div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700">{item.item_category}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5 shrink-0"><Coins className="w-3 h-3" />{item.price_paid.toLocaleString()}P</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{item.item_name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-1"><Calendar className="w-3 h-3" />{getRelativeTime(item.created_at)} 구매</p>
                        {isMark && (
                          <button type="button" onClick={() => handleEquipMark(item, isEquipped)} disabled={isPending || !isStaff}
                            className={"mt-2.5 w-full h-8 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed " + (isEquipped ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEquipped ? <><Check className="w-3.5 h-3.5" />장착중</> : isStaff ? "길드 로고로 장착" : "마스터·부마스터만"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 확성기 */}
            {showMegaphone && megaphones.length > 0 && (
              <div>
                {tab === "all" && (
                  <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-cyan-500" />확성기
                  </h2>
                )}
                {/* 활성(미사용/노출중) */}
                {activeMega.length > 0 ? (
                  <div className="space-y-2">
                    {activeMega.map(renderMegaRow)}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">사용 가능한 확성기가 없어요.</p>
                )}

                {/* 사용완료 접기 토글 */}
                {doneMega.length > 0 && (
                  <div className="mt-3">
                    <button type="button" onClick={() => setShowDoneMega((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition">
                      <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (showDoneMega ? "rotate-180" : "")} />
                      사용완료 {doneMega.length}개 {showDoneMega ? "숨기기" : "보기"}
                    </button>
                    {showDoneMega && (
                      <div className="space-y-2 mt-2 opacity-70">
                        {doneMega.map(renderMegaRow)}
                      </div>
                    )}
                  </div>
                )}

                {isStaff && activeMega.length > 0 && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    미사용 확성기는 상점 → 길드샵 → 보유 확성기에서 사용할 수 있어요.
                  </p>
                )}
              </div>
            )}

            {((tab === "sticker" && stickerPacks.length === 0) ||
              (tab === "cosmetic" && cosmetics.length === 0) ||
              (tab === "megaphone" && megaphones.length === 0)) && (
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">이 분류에 아이템이 없어요</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">아이템 삭제</h3>
              <button type="button" onClick={() => setConfirmDelete(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-bold text-slate-900">'{confirmDelete.item_name}'</span>을(를) 삭제할까요?
            </p>
            <p className="text-xs text-rose-500 mb-4">삭제하면 되돌릴 수 없고, 포인트는 환불되지 않아요.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 h-10 rounded-lg bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200">취소</button>
              <button type="button" onClick={handleDelete} disabled={deletePending !== null}
                className="flex-1 h-10 rounded-lg bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-1">
                {deletePending !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
