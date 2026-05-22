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

  // 최상위 키 목록 + 각 섹션의 첫번째 아이템만
  const summary = {
    topLevelKeys: Object.keys(data ?? {}),
    ArmoryGem_keys: data?.ArmoryGem ? Object.keys(data.ArmoryGem) : null,
    ArmoryGem_first: data?.ArmoryGem?.Gems?.[0] ?? data?.ArmoryGem?.[0] ?? null,
    ArmoryEngraving_keys: data?.ArmoryEngraving ? Object.keys(data.ArmoryEngraving) : null,
    ArmoryEngraving_first: data?.ArmoryEngraving?.Engravings?.[0] ?? null,
    ArmorySkills_first: data?.ArmorySkills?.[0] ?? null,
    ArkPassive_keys: data?.ArkPassive ? Object.keys(data.ArkPassive) : null,
    raw: data,
  };

  return NextResponse.json(summary);
}
