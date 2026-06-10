"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Loader2, Lock, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GuildCard from "@/components/guild/GuildCard";

type Props = {
  guildId: string;
  guildName: string;
  server: string | null;
  currentGrade: string;
  guildPoints: number;
  prices: { [key: string]: number };
  canBuy: boolean;
};

const GRADES = [
  { key: "rare", label: "RARE", desc: "단색 테두리" },
  { key: "unique", label: "UNIQUE", desc: "그라데이션 테두리 + 글로우" },
  { key: "epic", label: "EPIC", desc: "흐르는 광택" },
  { key: "legend", label: "LEGEND", desc: "유리광택 + 홀로그램 + 펄스" },
];

export default function CardGradeShop(props: Props) {
  const { guildId, guildName, server, currentGrade, guildPoints, prices, canBuy } = props;
  const router = useRouter();

  const [preview, setPreview] = useState(currentGrade);
  const [buying, setBuying] = useState<string | null>(null);

  async function handleBuy(grade: string) {
    const price = prices[grade] ?? 0;
    if (grade === currentGrade) {
      toast("이미 적용된 등급이에요");
      return;
    }
    if (guildPoints < price) {
      toast.error("길드 포인트가 부족해요");
      return;
    }
    const ok = window.confirm(
      GRADES.find((g) => g.key === grade)?.label +
        " 등급을 " +
        price.toLocaleString("ko-KR") +
        "P에 구매할까요? (영구 적용)"
    );
    if (!ok) return;

    setBuying(grade);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("buy_card_grade", {
      p_guild_id: guildId,
      p_grade: grade,
    });
    setBuying(null);

    if (error) {
      toast.error("구매 중 오류가 났어요");
      return;
    }
    const res = data as any;
    if (res?.success) {
      toast.success("명함 등급이 적용됐어요!");
      router.refresh();
    } else {
      toast.error(res?.error ?? "구매에 실패했어요");
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-cyan-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900">길드 명함 등급</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            길드 포인트로 명함을 꾸미면 모집·광장에서 더 화려하게 노출돼요.
          </p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden mb-4" style={{ maxWidth: 360 }}>
        <GuildCard
          guildName={guildName}
          server={server ? server + " 서버" : undefined}
          grade={preview}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {GRADES.map((g) => {
          const price = prices[g.key] ?? 0;
          const isCurrent = currentGrade === g.key;
          const canAfford = guildPoints >= price;
          return (
            <div
              key={g.key}
              onMouseEnter={() => setPreview(g.key)}
              onMouseLeave={() => setPreview(currentGrade)}
              className={
                "rounded-xl border p-3 transition " +
                (isCurrent ? "border-cyan-300 bg-cyan-50/40" : "border-slate-200 bg-white")
              }
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-900">{g.label}</span>
                {isCurrent ? (
                  <span className="text-[11px] font-bold text-cyan-600 inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 적용중
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-700">{price.toLocaleString("ko-KR")}P</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5 leading-snug min-h-[28px]">{g.desc}</p>

              {!canBuy ? (
                <div className="w-full h-8 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> 마스터·부마만
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isCurrent || buying !== null}
                  onClick={() => handleBuy(g.key)}
                  className={
                    "w-full h-8 rounded-lg text-xs font-bold transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50 " +
                    (isCurrent
                      ? "bg-slate-100 text-slate-400"
                      : canAfford
                      ? "bg-cyan-600 text-white hover:bg-cyan-500"
                      : "bg-slate-100 text-slate-400")
                  }
                >
                  {buying === g.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isCurrent ? (
                    "적용중"
                  ) : canAfford ? (
                    "구매"
                  ) : (
                    "포인트 부족"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
        한 번 구매하면 영구 적용돼요. 더 높은 등급을 사면 해당 등급의 전체 가격이 차감되고 등급이 교체됩니다.
      </p>
    </div>
  );
}
