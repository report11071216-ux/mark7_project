"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CreditCard, Check, Loader2, Lock, X, Coins } from "lucide-react";
import { buyNameplateCard } from "@/app/guild/[code]/shop/nameplate-actions";
import GuildCard from "@/components/guild/GuildCard";

export type NameplateProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  design: { [effect: string]: any };
  price: number;
};

type Props = {
  guildId: string;
  guildName: string;
  guildServer: string | null;
  markUrl: string | null;
  memberCount: number;
  maxMembers: number;
  guildPoints: number;
  isStaff: boolean;
  products: NameplateProduct[];
  ownedCardIds: string[];
};

export default function NameplateShop({
  guildId, guildName, guildServer, markUrl, memberCount, maxMembers,
  guildPoints, isStaff, products, ownedCardIds,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<NameplateProduct | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const serverText = guildServer ? guildServer + " 서버" : undefined;

  function doBuy() {
    if (!confirm) return;
    const card = confirm;
    setConfirm(null);
    setBuyingId(card.id);
    startTransition(async () => {
      const res = await buyNameplateCard(guildId, card.id);
      setBuyingId(null);
      if (res.success) {
        toast.success("명함 카드를 구매했어요! 보관함에서 장착하세요");
        router.refresh();
      } else {
        toast.error(res.error ?? "구매에 실패했어요");
      }
    });
  }

  if (products.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900">길드 명함 카드</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            길드 포인트로 명함 카드를 구매하고, 보관함에서 장착하면 모집·광장에 그 카드로 노출돼요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => {
          const owned = ownedCardIds.includes(p.id);
          const canAfford = guildPoints >= p.price;
          return (
            <div key={p.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <GuildCard
                guildName={guildName}
                server={serverText}
                grade="custom"
                markUrl={markUrl}
                imageUrl={p.imageUrl}
                memberCount={memberCount}
                maxMembers={maxMembers}
                design={p.design}
              />
              <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                    {p.description ? (
                      <p className="text-[11px] text-slate-400 truncate">{p.description}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-bold text-violet-600 shrink-0">
                    {p.price.toLocaleString()}<span className="text-[10px] text-slate-400 ml-0.5">P</span>
                  </p>
                </div>

                {owned ? (
                  <div className="w-full h-9 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 보유중
                  </div>
                ) : !isStaff ? (
                  <div className="w-full h-9 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> 마스터·부마만
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirm(p)}
                    disabled={!canAfford || isPending}
                    className={
                      "w-full h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 " +
                      (canAfford ? "bg-violet-600 text-white hover:bg-violet-500" : "bg-slate-100 text-slate-400")
                    }
                  >
                    {buyingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : canAfford ? "구매하기" : "포인트 부족"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 구매 확인 모달 */}
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">명함 카드 구매</h3>
              <button type="button" onClick={() => setConfirm(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="rounded-xl overflow-hidden mb-4">
                <GuildCard
                  guildName={guildName}
                  server={serverText}
                  grade="custom"
                  markUrl={markUrl}
                  imageUrl={confirm.imageUrl}
                  memberCount={memberCount}
                  maxMembers={maxMembers}
                  design={confirm.design}
                />
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{confirm.name}</span>
                  <span className="font-mono font-bold text-violet-600">{confirm.price.toLocaleString()}P</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">길드 포인트</span>
                  <span className="text-slate-900 font-mono">{guildPoints.toLocaleString()}P</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">구매 후</span>
                  <span className="font-mono font-bold text-violet-600">{(guildPoints - confirm.price).toLocaleString()}P</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirm(null)} className="flex-1 h-10 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">취소</button>
                <button type="button" onClick={doBuy} className="flex-1 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition">구매하기</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
