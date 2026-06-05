import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
function createCronClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createCronClient();

  // 1) 주간 랭킹 보상
  const { data, error } = await supabase.rpc("grant_weekly_ranking_rewards");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2) 카드 보관함 주간 길드포인트 (실패해도 랭킹보상은 유지)
  let cardResult: unknown = null;
  let cardError: string | null = null;
  const { data: cardData, error: cardErr } = await supabase.rpc("grant_weekly_card_points");
  if (cardErr) {
    cardError = cardErr.message;
  } else {
    cardResult = cardData;
  }

  return NextResponse.json({
    ok: true,
    result: data,
    cardResult,
    cardError,
    ranAt: new Date().toISOString(),
  });
}
