"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Coins, Check, Loader2, Smile, Trash2, X, ArrowUp, Box, Megaphone, Plus, Star, Gift } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { equipGuildMark, toggleStickerPack, deleteGuildPurchase, toggleGuildBackground, activateMegaphone } from "@/app/guild/[code]/shop/actions";
import { buyGuildCapacity } from "@/app/guild/[code]/admin/growth-actions";
import { donateCard } from "@/app/guild/[code]/inventory/actions";
import { GUILD_COSTS } from "@/lib/guild-grade";
import { type MegaphoneItem } from "@/components/guild/shop/MegaphoneInventory";
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

export type BackgroundItem = {
  purchase_id: string;
  name: string;
  image_url: string;
  equipped: boolean;
};

export type CardDonor = { name: string; qty: number };

export type GuildCardEntry = {
  cardId: string;
  name: string;
  grade: string;
  imageUrl: string | null;
  guildCount: number;
  donors: CardDonor[];
};

export type MyCard = {
  cardId: string;
  name: string;
  grade: string;
  imageUrl: string | null;
  count: number;
};

type Props = {
  guildCode: string;
  guildId: string;
  guildName: string;
  items: InventoryItem[];
  isStaff: boolean;
  equippedMarkId: string | null;
  stickerPacks: StickerPack[];
  megaphoneItems: MegaphoneItem[];
  backgroundItems: BackgroundItem[];
  usedSlots: number;
  vaultSlots: number;
  cards: GuildCardEntry[];
  myCards: MyCard[];
};

type TabKey = "all" | "background" | "sticker" | "cosmetic" | "megaphone" | "cards";

function megaStatus(item: MegaphoneItem): "ready" | "active" | "expired" {
  if (!item.activated_at) return "ready";
  if (item.expires_at && new Date(item.expires_at).getTime() > Date.now()) return "active";
  return "expired";
}

function starCount(n: number): number {
  return Math.min(5, Math.floor(n / 5));
}

function gradeStyle(g: string): { label: string; color: string; bg: string } {
  if (g === "epic") return { label: "에픽", color: "#b45309", bg: "#fef3c7" };
  if (g === "unique") return { label: "유니크", color: "#7c3aed", bg: "#ede9fe" };
  if (g === "rare") return { label: "레어", color: "#2563eb", bg: "#dbeafe" };
  return { label: "커먼", color: "#64748b", bg: "#f1f5f9" };
}

export default function GuildInventory({
  guildCode, guildId, items, isStaff, equippedMarkId, stickerPacks, megaphoneItems, backgroundItems, usedSlots, vaultSlots, cards, myCards,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [packPending, setPackPending] = useState<string | null>(null);
  const [bgPending, setBgPending] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InventoryItem | null>(null);
  const [slotPending, setSlotPending] = useState(false);
  const [tab, setTab] = useState<TabKey>("all");

  const [megaModalId, setMegaModalId] = useState<string | null>(null);
  const [megaMessage, setMegaMessage] = useState("");
  const [megaPending, setMegaPending] = useState(false);

  const [showDonate, setShowDonate] = useState(false);
  const [donateQty, setDonateQty] = useState<{ [cardId: string]: number }>({});
  const [donatePending, setDonatePending] = useState<string | null>(null);

  const cosmetics = items.filter(
    (i) => i.item_category !== "확성기" && i.item_category !== "이모티콘팩" && i.item_category !== "길드배경"
  );
  const megaCount = megaphoneItems.length;
  const bgCount = backgroundItems.length;

  // 카드 보관함 집계
  const totalDonated = cards.reduce((s, c) => s + c.guildCount, 0);
  const totalStars = cards.reduce((s, c) => s + starCount(c.guildCount), 0);
  const weeklyPoints = Math.floor(totalDonated / 10) + totalStars;
  const collectedTypes = cards.filter((c) => c.guildCount > 0).length;

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "전체", count: bgCount + stickerPacks.length + cosmetics.length + megaCount },
    { key: "cards", label: "카드 보관함", count: collectedTypes },
    { key: "background", label: "길드 배경", count: bgCount },
    { key: "sticker", label: "이모티콘팩", count: stickerPacks.length },
    { key: "cosmetic", label: "코스메틱", count: cosmetics.length },
    { key: "megaphone", label: "확성기", count: megaCount },
  ];

  const showBg = tab === "all" || tab === "background";
  const showSticker = tab === "all" || tab === "sticker";
  const showCosmetic = tab === "all" || tab === "cosmetic";
  const showMegaphone = tab === "all" || tab === "megaphone";

  const slotPercent = vaultSlots > 0 ? Math.min(100, Math.round((usedSlots / vaultSlots) * 100)) : 0;
  const isFull = usedSlots >= vaultSlots;

  const emptyCount = tab === "all" ? Math.max(0, vaultSlots - usedSlots) : 0;
  const emptySlots = Array.from({ length: emptyCount });

  const handleBuySlot = () => {
    if (slotPending || !isStaff) return;
    setSlotPending(true);
    startTransition(async () => {
      const result = await buyGuildCapacity(guildCode, "vault");
      setSlotPending(false);
      if (result.success) { toast.success("보관함 슬롯이 1칸 늘었어요!"); router.refresh(); }
      else { toast.error(result.error ?? "확장에 실패했어요"); }
    });
  };

  const handleEquipMark = (item: InventoryItem, isEquipped: boolean) => {
    startTransition(async () => {
      const result = await equipGuildMark(guildCode, isEquipped ? null : item.id, guildId);
      if (result.success) { toast.success(isEquipped ? "장착 해제됨" : `'${item.item_name}' 장착 완료!`); router.refresh(); }
      else { toast.error(result.error ?? "장착에 실패했습니다"); }
    });
  };

  const handleTogglePack = async (pack: StickerPack) => {
    if (packPending) return;
    setPackPending(pack.shop_item_id);
    const result = await toggleStickerPack(guildCode, guildId, pack.shop_item_id);
    setPackPending(null);
    if (result.success) { toast.success(pack.equipped ? "장착 해제됨" : `'${pack.name}' 장착 완료!`); router.refresh(); }
    else { toast.error(result.error ?? "장착에 실패했습니다"); }
  };

  const handleToggleBg = async (bg: BackgroundItem) => {
    if (bgPending) return;
    setBgPending(bg.image_url);
    const result = await toggleGuildBackground(guildCode, guildId, bg.image_url);
    setBgPending(null);
    if (result.success) { toast.success(bg.equipped ? "배경 해제됨" : `'${bg.name}' 배경 적용 완료!`); router.refresh(); }
    else { toast.error(result.error ?? "적용에 실패했습니다"); }
  };

  const handleDelete = async () => {
    if (!confirmDelete || deletePending) return;
    const item = confirmDelete;
    setDeletePending(item.id);
    const result = await deleteGuildPurchase(guildCode, guildId, item.id);
    setDeletePending(null);
    setConfirmDelete(null);
    if (result.success) { toast.success("삭제되었습니다"); router.refresh(); }
    else { toast.error(result.error ?? "삭제에 실패했습니다"); }
  };

  const handleDeleteMega = async (item: MegaphoneItem) => {
    if (deletePending) return;
    setDeletePending(item.id);
    const result = await deleteGuildPurchase(guildCode, guildId, item.id);
    setDeletePending(null);
    if (result.success) { toast.success("삭제되었습니다"); router.refresh(); }
    else { toast.error(result.error ?? "삭제에 실패했습니다"); }
  };

  const handleActivateMega = () => {
    if (!megaModalId) return;
    if (!megaMessage.trim()) { toast.error("확성기 문구를 입력하세요"); return; }
    setMegaPending(true);
    startTransition(async () => {
      const result = await activateMegaphone(guildCode, megaModalId, megaMessage.trim());
      setMegaPending(false);
      if (result.success) { toast.success("확성기가 광장에 노출됩니다!"); setMegaModalId(null); setMegaMessage(""); router.refresh(); }
      else { toast.error(result.error ?? "사용에 실패했습니다"); }
    });
  };

  const handleDonate = (cardId: string, qty: number) => {
    if (donatePending) return;
    setDonatePending(cardId);
    startTransition(async () => {
      const res = await donateCard(guildCode, cardId, qty);
      setDonatePending(null);
      if (res.ok) { toast.success("카드를 기증했어요!"); router.refresh(); }
      else { toast.error(res.error ?? "기증에 실패했어요"); }
    });
  };

  const totalCount = bgCount + stickerPacks.length + cosmetics.length + megaCount;

  const gridClass = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3";
  const badge = (label: string, color: string, bg: string) => (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ color, backgroundColor: bg }}>{label}</span>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GUILD STORAGE</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">길드 보관함</h1>
          </div>
        </div>

        {/* 보관함 슬롯 현황 (카드 보관함 탭에서는 숨김) */}
        {tab !== "cards" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#E1F5EE" }}>
                  <Box className="w-6 h-6" style={{ color: "#0F6E56" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">보관함 슬롯</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-bold" style={{ color: isFull ? "#dc2626" : "#0F6E56" }}>{usedSlots}</span>
                    {" / "}{vaultSlots} 칸 사용 중
                  </p>
                </div>
              </div>
              {isStaff && (
                <button type="button" onClick={handleBuySlot} disabled={slotPending}
                  className="h-9 px-4 rounded-[10px] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-60 transition"
                  style={{ backgroundColor: "#0F6E56" }}>
                  {slotPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                  슬롯 늘리기 {GUILD_COSTS.vault}P
                </button>
              )}
            </div>
            <div className="mt-3 h-[7px] rounded-full overflow-hidden bg-slate-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${slotPercent}%`, backgroundColor: isFull ? "#dc2626" : "#0F6E56" }} />
            </div>
            {isFull && (
              <p className="text-[11px] text-rose-500 mt-2">
                보관함이 가득 찼어요. 새 코스메틱을 사려면 슬롯을 먼저 늘려야 해요. (확성기는 제외)
              </p>
            )}
          </div>
        )}

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

        {!isStaff && tab !== "cards" && (
          <div className="rounded-lg bg-white border border-slate-200 px-4 py-2.5 mb-6">
            <p className="text-xs text-slate-500">
              길드 보관함은 누구나 볼 수 있어요. 아이템 사용·관리는 마스터·부마스터만 가능합니다.
            </p>
          </div>
        )}

        {tab === "cards" ? (
          <div className="space-y-5">
            {/* 도감 진행도 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">길드 카드 도감</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      기증 {totalDonated}장 · 별 {totalStars} · 수집 {collectedTypes}/{cards.length}종
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">다음 수요일 예상</p>
                    <p className="text-sm font-bold text-violet-600">+{weeklyPoints}P</p>
                  </div>
                  <button type="button" onClick={() => setShowDonate(true)} disabled={myCards.length === 0}
                    className="h-9 px-4 rounded-[10px] bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-violet-700 transition">
                    <Gift className="w-4 h-4" />카드 기증
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                같은 카드 5장마다 별 1개(최대 5성). 카드에 마우스를 올리면 기여자가 보여요.
              </p>
            </div>

            {/* 도감 그리드 */}
            {cards.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">등록된 카드가 없어요</p>
                <p className="text-xs text-slate-400 mt-1">관리자가 카드를 추가하면 여기에 도감이 채워져요</p>
              </div>
            ) : (
              <div className={gridClass}>
                {cards.map((c) => {
                  const owned = c.guildCount > 0;
                  const stars = starCount(c.guildCount);
                  const gs = gradeStyle(c.grade);
                  return (
                    <div key={c.cardId}
                      className={"group relative rounded-xl border overflow-hidden flex flex-col " + (owned ? "border-slate-200 shadow-sm bg-white" : "border-slate-200 bg-slate-50")}>
                      <div className="relative aspect-square bg-slate-100">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className={"w-full h-full object-cover " + (owned ? "" : "grayscale opacity-40")} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className={"w-8 h-8 " + (owned ? "text-slate-300" : "text-slate-200")} />
                          </div>
                        )}
                        <span className="absolute top-2 left-2">{badge(gs.label, gs.color, gs.bg)}</span>
                        {owned && stars > 0 && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />{stars}
                          </span>
                        )}
                        {owned && c.donors.length > 0 && (
                          <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition bg-slate-900/75">
                            <div className="w-full p-2">
                              <p className="text-[10px] font-bold text-white/70 mb-1">기여자</p>
                              <div className="space-y-0.5">
                                {c.donors.slice(0, 6).map((d, di) => (
                                  <p key={di} className="text-[11px] text-white flex justify-between gap-2">
                                    <span className="truncate">{d.name}</span>
                                    <span className="shrink-0 text-white/70">{d.qty}장</span>
                                  </p>
                                ))}
                                {c.donors.length > 6 && (
                                  <p className="text-[10px] text-white/60">+{c.donors.length - 6}명</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex flex-col flex-1">
                        <p className={"text-xs font-bold truncate " + (owned ? "text-slate-900" : "text-slate-400")}>{c.name}</p>
                        <p className={"text-[10px] mt-0.5 " + (owned ? "text-slate-500" : "text-slate-400")}>
                          {owned ? `보유 ${c.guildCount}장` : "미보유"}
                        </p>
                        <div className="mt-1 flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={"w-3 h-3 " + (s <= stars ? "text-violet-500 fill-current" : "text-slate-200")} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className={gridClass}>
            {/* 길드 배경 */}
            {showBg && backgroundItems.map((bg) => (
              <div key={bg.purchase_id}
                className={"rounded-xl border overflow-hidden transition flex flex-col " + (bg.equipped ? "border-cyan-400 ring-2 ring-cyan-200" : "border-slate-200 shadow-sm bg-white")}>
                <div className="relative aspect-square bg-slate-100">
                  <img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2">{badge("배경", "#185FA5", "#E6F1FB")}</span>
                  {bg.equipped && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />적용
                    </span>
                  )}
                </div>
                <div className="p-2.5 bg-white flex flex-col flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate mb-2">{bg.name}</p>
                  <button type="button" onClick={() => handleToggleBg(bg)} disabled={bgPending === bg.image_url || !isStaff}
                    className={"mt-auto w-full h-8 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed " + (bg.equipped ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                    {bgPending === bg.image_url ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : bg.equipped ? <><Check className="w-3.5 h-3.5" />해제</>
                      : isStaff ? "적용" : "운영진만"}
                  </button>
                </div>
              </div>
            ))}

            {/* 이모티콘팩 */}
            {showSticker && stickerPacks.map((pack) => (
              <div key={pack.shop_item_id}
                className={"rounded-xl border overflow-hidden transition flex flex-col " + (pack.equipped ? "border-cyan-300 ring-2 ring-cyan-200 bg-cyan-50" : "border-slate-200 shadow-sm bg-white")}>
                <div className="relative aspect-square bg-slate-100 flex items-center justify-center">
                  {pack.cover_url ? <img src={pack.cover_url} alt={pack.name} className="w-full h-full object-cover" /> : <Smile className="w-8 h-8 text-slate-300" />}
                  <span className="absolute top-2 left-2">{badge("이모티콘", "#0F6E56", "#E1F5EE")}</span>
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate mb-2">{pack.name}</p>
                  <button type="button" onClick={() => handleTogglePack(pack)} disabled={packPending === pack.shop_item_id || !isStaff}
                    className={"mt-auto w-full h-8 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed " + (pack.equipped ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                    {packPending === pack.shop_item_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : pack.equipped ? <><Check className="w-3.5 h-3.5" />장착중</>
                      : isStaff ? "채팅에 장착" : "운영진만"}
                  </button>
                </div>
              </div>
            ))}

            {/* 코스메틱 */}
            {showCosmetic && cosmetics.map((item) => {
              const isMark = item.item_category.includes("마크");
              const isEquipped = equippedMarkId === item.id;
              return (
                <div key={item.id}
                  className={"group relative rounded-xl border overflow-hidden transition flex flex-col " + (isEquipped ? "border-cyan-300 ring-2 ring-cyan-200 bg-cyan-50" : "border-slate-200 shadow-sm bg-white")}>
                  <div className="relative aspect-square bg-slate-100 flex items-center justify-center">
                    {item.image_url ? <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-300" />}
                    <span className="absolute top-2 left-2">{badge(item.item_category, "#534AB7", "#EEEDFE")}</span>
                    {isStaff && (
                      <button type="button" onClick={() => setConfirmDelete(item)} disabled={deletePending === item.id}
                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg bg-white/90 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 disabled:opacity-50"
                        aria-label="삭제" title="삭제">
                        {deletePending === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <div className="p-2.5 flex flex-col flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.item_name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5"><Coins className="w-2.5 h-2.5" />{item.price_paid.toLocaleString()}P</p>
                    {isMark && (
                      <button type="button" onClick={() => handleEquipMark(item, isEquipped)} disabled={isPending || !isStaff}
                        className={"mt-2 w-full h-8 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed " + (isEquipped ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEquipped ? <><Check className="w-3.5 h-3.5" />장착중</> : isStaff ? "로고 장착" : "운영진만"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 확성기 */}
            {showMegaphone && megaphoneItems.map((item) => {
              const status = megaStatus(item);
              return (
                <div key={item.id}
                  className="relative rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
                  <div className="relative aspect-square bg-cyan-50 flex flex-col items-center justify-center gap-2 p-3">
                    <span className="absolute top-2 left-2">{badge("확성기", "#0E7490", "#CFFAFE")}</span>
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Megaphone className="w-6 h-6 text-cyan-600" />
                    </div>
                    {status === "active" && <span className="text-[10px] font-bold text-cyan-700">광장 노출중</span>}
                    {status === "expired" && <span className="text-[10px] text-slate-400">사용 완료</span>}
                    {status === "ready" && <span className="text-[10px] text-slate-500">미사용</span>}
                  </div>
                  <div className="p-2.5 flex flex-col flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.item_name}</p>
                    {status === "ready" && (
                      <button type="button" onClick={() => { setMegaModalId(item.id); setMegaMessage(""); }} disabled={!isStaff}
                        className="mt-2 w-full h-8 rounded-lg bg-cyan-600 text-white text-[11px] font-bold hover:bg-cyan-500 disabled:opacity-50 transition">
                        {isStaff ? "사용하기" : "운영진만"}
                      </button>
                    )}
                    {status === "active" && <p className="text-[10px] text-slate-500 truncate mt-1">{item.megaphone_message}</p>}
                    {status === "expired" && isStaff && (
                      <button type="button" onClick={() => handleDeleteMega(item)} disabled={deletePending === item.id}
                        className="mt-2 w-full h-8 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 transition flex items-center justify-center gap-1">
                        {deletePending === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3 h-3" />삭제</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 빈 칸 (전체 탭에서만) */}
            {emptySlots.map((_, i) => (
              <div key={`empty-${i}`}
                className="rounded-xl border-[1.5px] border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center aspect-square">
                <Plus className="w-5 h-5 text-slate-300" />
                <span className="text-[10px] text-slate-300 mt-1">빈 칸</span>
              </div>
            ))}

            {/* 분류 탭에서 비어있을 때 */}
            {((tab === "background" && bgCount === 0) ||
              (tab === "sticker" && stickerPacks.length === 0) ||
              (tab === "cosmetic" && cosmetics.length === 0) ||
              (tab === "megaphone" && megaCount === 0)) && (
              <div className="col-span-full rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">이 분류에 아이템이 없어요</p>
              </div>
            )}

            {/* 전체 탭인데 아이템도 빈 칸도 없을 때(슬롯 0) */}
            {tab === "all" && totalCount === 0 && emptyCount === 0 && (
              <div className="col-span-full rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">아직 구매한 길드 아이템이 없어요</p>
                <p className="text-xs text-slate-400 mt-1">상점에서 길드 포인트로 아이템을 구매해보세요</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 코스메틱 삭제 확인 모달 */}
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

      {/* 확성기 사용 모달 */}
      {megaModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-600" />확성기 문구 작성
              </h3>
              <button type="button" onClick={() => setMegaModalId(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-2">광장 상단에 흐를 문구예요. 사용하면 바로 노출이 시작됩니다.</p>
            <textarea value={megaMessage} onChange={(e) => setMegaMessage(e.target.value.slice(0, 100))}
              placeholder="예: 카제로스 서버 쁘밍 길드 신규 길드원 모집! 디스코드로 문의주세요" rows={3}
              className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none" />
            <div className="flex items-center justify-between mt-1.5 mb-4">
              <span className="text-[11px] text-slate-400">{megaMessage.length}/100</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMegaModalId(null)} className="flex-1 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">취소</button>
              <button type="button" onClick={handleActivateMega} disabled={megaPending}
                className="flex-1 h-10 rounded-lg bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 disabled:opacity-60 transition flex items-center justify-center gap-1.5">
                {megaPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}사용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카드 기증 모달 */}
      {showDonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowDonate(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Gift className="w-4 h-4 text-violet-600" />카드 기증</h3>
              <button type="button" onClick={() => setShowDonate(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-rose-500 mb-4">기증한 카드는 길드 소유가 되며 되돌릴 수 없어요.</p>
            {myCards.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">기증할 카드가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {myCards.map((mc) => {
                  const q = Math.min(donateQty[mc.cardId] ?? 1, mc.count);
                  const gs = gradeStyle(mc.grade);
                  return (
                    <div key={mc.cardId} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        {mc.imageUrl ? <img src={mc.imageUrl} alt={mc.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {badge(gs.label, gs.color, gs.bg)}
                          <p className="text-sm font-bold text-slate-900 truncate">{mc.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">보유 {mc.count}장</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => setDonateQty((p) => ({ ...p, [mc.cardId]: Math.max(1, q - 1) }))}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">-</button>
                        <span className="w-8 text-center text-sm font-bold text-slate-800">{q}</span>
                        <button type="button" onClick={() => setDonateQty((p) => ({ ...p, [mc.cardId]: Math.min(mc.count, q + 1) }))}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">+</button>
                      </div>
                      <button type="button" onClick={() => handleDonate(mc.cardId, q)} disabled={donatePending === mc.cardId}
                        className="h-8 px-3 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50 shrink-0 flex items-center gap-1">
                        {donatePending === mc.cardId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "기증"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
