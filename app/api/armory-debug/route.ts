import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  if (!name) return NextResponse.json({ error: "name required" });

  const encoded = encodeURIComponent(name);
  const res = await fetch(
    `https://developer-lostark.game.onstove.com/armories/characters/${encoded}`,
    {
      headers: {
        Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );
  const data = await res.json();

  return NextResponse.json({
    // 보석 Effects 구조 확인
    GemEffects_first: data?.ArmoryGem?.Effects?.[0] ?? null,
    GemEffects_keys: data?.ArmoryGem?.Effects?.[0]
      ? Object.keys(data.ArmoryGem.Effects[0])
      : null,

    // 각인 구조
    EngravingEffects_first: data?.ArmoryEngraving?.Effects?.[0] ?? null,
    ArkPassiveEffects_first: data?.ArmoryEngraving?.ArkPassiveEffects?.[0] ?? null,

    // 아크패시브 구조
    ArkPassive_type: typeof data?.ArkPassive,
    ArkPassive_isArray: Array.isArray(data?.ArkPassive),
    ArkPassive_keys: data?.ArkPassive
      ? Array.isArray(data.ArkPassive)
        ? "ARRAY length=" + data.ArkPassive.length
        : Object.keys(data.ArkPassive)
      : null,
    ArkPassive_first: Array.isArray(data?.ArkPassive)
      ? data.ArkPassive[0]
      : data?.ArkPassive,

    // 아크그리드 구조
    ArkGrid_type: typeof data?.ArkGrid,
    ArkGrid_isArray: Array.isArray(data?.ArkGrid),
    ArkGrid_keys: data?.ArkGrid
      ? Array.isArray(data.ArkGrid)
        ? "ARRAY length=" + data.ArkGrid.length
        : Object.keys(data.ArkGrid)
      : null,
    ArkGrid_first: Array.isArray(data?.ArkGrid)
      ? data.ArkGrid[0]
      : data?.ArkGrid,
  });
}
