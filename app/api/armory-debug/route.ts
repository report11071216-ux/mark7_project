import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  if (!name) return NextResponse.json({ error: "name required" });

  const encoded = encodeURIComponent(name);
  const res = await fetch(
    `https://developer-lostark.game.onstove.com/armories/characters/${encoded}/profiles`,
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
    Stats: data?.Stats ?? null,
    ItemAvgLevel: data?.ItemAvgLevel,
    ItemMaxLevel: data?.ItemMaxLevel,
  });
}
