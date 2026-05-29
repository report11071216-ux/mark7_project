"use client";
import { useState } from "react";
import { Loader2, Package } from "lucide-react";
import { savePackPrice } from "@/app/admin/cards/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  initialPrice: number;
  initialActive: boolean;
};

export default function CardPackSettings({ initialPrice, initialActive }: Props) {
  const router = useRouter();
  const [price, setPrice] = useState(String(initialPrice));
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    const p = parseInt(price, 10);
    if (!Number.isFinite(p) || p < 0) {
      toast.error("가격을 올바르게 입력하세요");
      return;
    }
    setSaving(true);
    const res = await savePackPrice(p, active);
    setSaving(false);
    if (res.ok) {
      toast.success("패키지 설정 저장됨");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-bold text-slate-900">11연 뽑기권 패키지</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        상점에서 포인트로 구매하는 11연 뽑기권의 가격을 정해요. 초반엔 저렴하게, 나중엔 비싸게 조정해서 포인트 인플레이션을 관리할 수 있어요.
      </p>

      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">가격 (포인트)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
              className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
            />
            <span className="text-sm text-slate-500">P</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">판매 상태</label>
          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className={
              "px-4 py-2 rounded-lg text-sm font-bold transition " +
              (active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")
            }
          >
            {active ? "판매 중" : "판매 중지"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          저장
        </button>
      </div>
    </div>
  );
}
