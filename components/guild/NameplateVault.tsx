"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Loader2, CreditCard, Lock } from "lucide-react";
import { equipNameplateCard } from "@/app/guild/[code]/inventory/nameplate-actions";
import GuildCard from "@/components/guild/GuildCard";

export type OwnedNameplate = {
  cardId: string;
  name: string;
  imageUrl: string | null;
  design: { [effect: string]: any };
};

type Props = {
  guildId: string;
  guildName: string;
  guildServer: string | null;
  markUrl: string | null;
  memberCount: number;
  maxMembers: number;
  owned: OwnedNameplate[];
  equippedCardId: string | null;
  isStaff: boolean;
};

export default function NameplateVault({
  guildId, guildName, guildServer, markUrl, memberCount, maxMembers,
  owned, equippedCardId, isStaff,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleEquip(cardId: string | null) {
    if (!isStaff) return;
    setPendingId(cardId ?? "none");
    startTransition(async () => {
      const res = await equipNameplateCard(guildId, cardId);
      setPendingId(null);
      if (res.success) {
        toast.success(cardId ? "명함 카드를 장착했어요!" : "장착을 해제했어요");
        router.refresh();
      } else {
        toast.error(res.error ?? "장착에 실패했어요");
      }
    });
  }

  if (owned.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
        <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-600">아직 보유한 명함 카드가 없어요</p>
        <p className="text-xs text-slate-400 mt-1">상점에서 명함 카드를 구매하면 여기서 장착할 수 있어요</p>
      </div>
    );
  }

  const serverText = guildServer ? guildServer + " 서버" : undefined;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">명함 카드</p>
            <p className="text-xs text-slate-500 mt-0.5">
              보유한 카드 중 하나를 명함으로 장착해요. 모집·광장에 그 카드로 노출됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {owned.map((c) => {
          const equipped = equippedCardId === c.cardId;
          return (
            <div
              key={c.cardId}
              className={"rounded-xl border overflow-hidden transition " + (equipped ? "border-violet-400 ring-2 ring-violet-200" : "border-slate-200 shadow-sm bg-white")}
            >
              <GuildCard
                guildName={guildName}
                server={serverText}
                grade="custom"
                markUrl={markUrl}
                imageUrl={c.imageUrl}
                memberCount={memberCount}
                maxMembers={maxMembers}
                design={c.design}
              />
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                {equipped ? (
                  <button
                    type="button"
                    onClick={() => handleEquip(null)}
                    disabled={!isStaff || isPending}
                    className="h-8 px-3 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition disabled:opacity-50 flex items-center gap-1 shrink-0"
                  >
                    {pendingId === c.cardId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" />장착중</>}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEquip(c.cardId)}
                    disabled={!isStaff || isPending}
                    className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition disabled:opacity-50 flex items-center gap-1 shrink-0"
                  >
                    {pendingId === c.cardId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : !isStaff ? <><Lock className="w-3.5 h-3.5" />운영진만</> : "장착"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
