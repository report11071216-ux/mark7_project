// components/TopGuildsWidget.tsx 교체
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TopGuildsWidget() {
  const supabase = await createClient(); // ← await 추가

  const { data: topGuilds } = await supabase
    .from("guilds")
    .select("id, name, code, logo_url, total_points")
    .order("total_points", { ascending: false })
    .limit(5);

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">🏆 Top 길드</h3>
        <Link
          href="/ranking"
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          전체 보기 →
        </Link>
      </div>
      {!topGuilds || topGuilds.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          아직 길드가 없어요
        </p>
      ) : (
        <div className="space-y-2">
          {topGuilds.map((g, i) => {
            const rank = i + 1;
            const medal =
              rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            return (
              <Link
                key={g.id}
                href={`/g/${g.code}`}
                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50"
              >
                <div className="w-6 text-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400">
                      {rank}
                    </span>
                  )}
                </div>
                {g.logo_url ? (
                  <img
                    src={g.logo_url}
                    alt={g.name}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-sm">
                    🏰
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {g.name}
                  </div>
                  <div className="text-xs text-blue-600">
                    ⭐ {g.total_points.toLocaleString()}P
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
