import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMarketItemPrice } from "@/lib/lostark";

export const dynamic = "force-dynamic";

// 거래소에서 가져올 강화재료 (정렬 순서 포함)
const TARGET_ITEMS = [
  { itemName: "운명의 파괴석 결정", sortOrder: 1 },
  { itemName: "운명의 파괴석", sortOrder: 2 },
  { itemName: "운명의 돌파석", sortOrder: 3 },
  { itemName: "상급 아비도스 융화 재료", sortOrder: 4 },
  { itemName: "아비도스 융화 재료", sortOrder: 5 },
];

export async function GET(request: Request) {
  // CRON_SECRET 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // service_role 클라이언트 (RLS 우회 — 시세 쓰기 전용)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

  const results: {
    itemName: string;
    found: boolean;
    price: number | null;
  }[] = [];

  for (const target of TARGET_ITEMS) {
    const market = await getMarketItemPrice(target.itemName);

    if (!market) {
      results.push({ itemName: target.itemName, found: false, price: null });
      // 못 찾으면 가격은 건드리지 않고 넘어감 (기존 값 유지)
      continue;
    }

    const { error } = await supabase
      .from("market_prices")
      .update({
        display_name: target.itemName,
        icon_url: market.iconUrl || null,
        current_min_price: market.currentMinPrice,
        yday_avg_price: market.ydayAvgPrice,
        sort_order: target.sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("item_name", target.itemName);

    results.push({
      itemName: target.itemName,
      found: !error,
      price: market.currentMinPrice,
    });

    // API 호출 제한 보호용 간격 (재료 5개라 부담 적지만 안전하게)
    await new Promise((r) => setTimeout(r, 250));
  }

  return NextResponse.json({ ok: true, results });
}
