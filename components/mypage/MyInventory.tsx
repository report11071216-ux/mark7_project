import { Package, Calendar, Coins } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

export type MyInventoryItem = {
  id: string;
  item_name: string;
  item_category: string;
  price_paid: number;
  created_at: string;
};

export default function MyInventory({ items }: { items: MyInventoryItem[] }) {
  return (
    <div className="plaza-card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-blue-600" />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
          My Items
        </p>
        <span className="text-[10px] font-mono text-slate-400">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <Package className="w-6 h-6 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">아직 구매한 아이템이 없어요</p>
          <p className="text-xs text-slate-400 mt-1">
            길드 상점 활동샵에서 활동 포인트로 구매할 수 있어요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-slate-50 border border-slate-100 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-600 ring-1 ring-violet-200">
                  {item.item_category}
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5">
                  <Coins className="w-3 h-3" />
                  {item.price_paid.toLocaleString()}P
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">{item.item_name}</p>
              <p className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5 mt-1.5">
                <Calendar className="w-3 h-3" />
                {getRelativeTime(item.created_at)} 구매
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
