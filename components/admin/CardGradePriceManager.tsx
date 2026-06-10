"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { CreditCard, Loader2 } from "lucide-react";
import { saveCardGradePrices } from "@/app/admin/shop/actions";

type Prices = {
  rare: number;
  unique: number;
  epic: number;
  legend: number;
};

const GRADES: { key: keyof Prices; label: string; desc: string }[] = [
  { key: "rare", label: "RARE", desc: "단색 테두리" },
  { key: "unique", label: "UNIQUE", desc: "그라데이션 + 글로우" },
  { key: "epic", label: "EPIC", desc: "흐르는 광택" },
  { key: "legend", label: "LEGEND", desc: "홀로그램 + 펄스" },
];

export default function CardGradePriceManager({ initial }: { initial: Prices }) {
  const [prices, setPrices] = useState<Prices>(initial);
  const [isPending, startTransition] = useTransition();

  function setOne(key: keyof Prices, value: string) {
    const n = parseInt(value, 10);
    setPrices((prev) => ({ ...prev, [key]: isNaN(n) ? 0 : n }));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveCardGradePrices(prices);
      if (res.success) {
        toast.success("명함 등급 가격을 저장했어요");
      } else {
        toast.error(res.error ?? "저장에 실패했어요");
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-cyan-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">명함 등급 가격</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            길드샵에서 길드 포인트로 구매하는 명함 등급의 가격이에요. 등급은 고정 4종이라 가격만 조정합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {GRADES.map((g) => (
          <div key={g.key} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-900">{g.label}</span>
              <span className="text-[11px] text-slate-400">{g.desc}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={prices[g.key]}
                onChange={(e) => setOne(g.key, e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <span className="text-sm font-bold text-slate-500 shrink-0">P</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full h-11 rounded-lg bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        가격 저장
      </button>
    </div>
  );
}
