import { TrendingUp } from "lucide-react";

export type MarketPriceItem = {
  itemName: string;
  displayName: string;
  iconUrl: string | null;
  currentMinPrice: number | null;
  ydayAvgPrice: number | null;
};

function formatGold(n: number | null): string {
  if (n == null) return "-";
  const rounded = Math.round(n);
  return rounded.toLocaleString("ko-KR");
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return diffMin + "분 전";
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + "시간 전";
  const diffDay = Math.floor(diffHr / 24);
  return diffDay + "일 전";
}

export default function MarketPriceCard({
  items,
  updatedAt,
}: {
  items: MarketPriceItem[];
  updatedAt: string | null;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-plaza-surface rounded-xl ring-1 ring-plaza-line overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600&display=swap');`}</style>

      {/* 헤더 */}
      <div className="px-3 py-2 border-b border-plaza-line bg-plaza-surface-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-plaza-ink-soft" />
            <h3 className="text-xs font-bold text-plaza-ink">강화재료 시세</h3>
          </div>
          {updatedAt ? (
            <span className="text-[10px] font-mono text-plaza-ink-dim">
              {relativeTime(updatedAt)}
            </span>
          ) : null}
        </div>
      </div>

      {/* 재료 리스트 */}
      <div className="p-1.5">
        <div className="space-y-0.5">
          {items.map((it) => (
            <div
              key={it.itemName}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-plaza-surface-2 transition-colors"
            >
              {it.iconUrl ? (
                <img
                  src={it.iconUrl}
                  alt=""
                  className="w-7 h-7 rounded-md object-cover ring-1 ring-plaza-line shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-plaza-surface-2 ring-1 ring-plaza-line shrink-0" />
              )}
              <p className="min-w-0 flex-1 text-[11px] text-plaza-ink-soft truncate">
                {it.displayName}
              </p>
              <span
                className="shrink-0 text-amber-500"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: "15px",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.02em",
                }}
              >
                {formatGold(it.currentMinPrice)}
                <span className="text-[10px] text-amber-600 ml-0.5 font-normal">G</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 푸터 */}
      <div className="px-3 py-2 border-t border-plaza-line">
        <p className="text-[10px] text-plaza-ink-dim text-center">
          거래소 최저가 · 하루 1회 갱신
        </p>
      </div>
    </div>
  );
}
