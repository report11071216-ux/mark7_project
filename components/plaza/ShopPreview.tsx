import Link from "next/link";
import { Sparkles, Clock } from "lucide-react";

export type ShopPreviewItem = {
  id: string;
  shop_type: string;
  category: string;
  name: string;
  price: number;
  image_url: string | null;
  duration_hours: number | null;
};

export default function ShopPreview({ items }: { items: ShopPreviewItem[] }) {
  if (items.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 ring-1 ring-slate-200 flex flex-col items-center justify-center gap-2 text-center p-3"
          >
            <Sparkles className="w-6 h-6 text-slate-300" />
            <p className="text-xs text-slate-400 leading-tight">오픈 예정</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.slice(0, 5).map((item) => (
        <div
          key={item.id}
          className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden hover:ring-blue-300 hover:shadow-sm transition-all"
        >
          <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles className="w-7 h-7 text-slate-300" />
            )}
          </div>
          <div className="p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  item.shop_type === "guild"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {item.shop_type === "guild" ? "길드샵" : "활동샵"}
              </span>
              {item.duration_hours && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700">
                  <Clock className="w-2.5 h-2.5" />
                  {item.duration_hours}h
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
            <p className="text-sm font-bold text-blue-600 mt-0.5">
              {item.price.toLocaleString()}
              <span className="text-[10px] text-slate-400 ml-0.5">P</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
