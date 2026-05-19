"use client";

import { useState } from "react";
import Link from "next/link";

type Guild = {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  member_count: number;
  max_members: number;
  total_points?: number;
  weekly_points?: number;
  monthly_points?: number;
};

type Props = {
  totalRanking: Guild[];
  weeklyRanking: Guild[];
  monthlyRanking: Guild[];
};

type TabType = "total" | "weekly" | "monthly";

export default function RankingTabs({
  totalRanking,
  weeklyRanking,
  monthlyRanking,
}: Props) {
  const [tab, setTab] = useState<TabType>("total");

  const ranking =
    tab === "weekly"
      ? weeklyRanking
      : tab === "monthly"
        ? monthlyRanking
        : totalRanking;

  const getPoints = (g: Guild) => {
    if (tab === "weekly") return g.weekly_points || 0;
    if (tab === "monthly") return g.monthly_points || 0;
    return g.total_points || 0;
  };

  const tabLabel: Record<TabType, string> = {
    total: "전체",
    weekly: "주간 (7일)",
    monthly: "월간 (이번달)",
  };

  const periodLabel: Record<TabType, string> = {
    total: "총 누적",
    weekly: "최근 7일",
    monthly: "이번달",
  };

  // 포인트 0인 길드 제외 (주간/월간 탭에서 활동 없는 길드 숨김)
  const filteredRanking =
    tab === "total" ? ranking : ranking.filter((g) => getPoints(g) > 0);

  return (
    <div>
      {/* 탭 헤더 */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(["total", "weekly", "monthly"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-3 text-sm font-semibold transition ${
              tab === t
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabLabel[t]}
            {tab === t && (
              <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* 랭킹 리스트 */}
      {filteredRanking.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow">
          <div className="mb-3 text-5xl">🏰</div>
          <p className="text-gray-600">
            {tab === "total"
              ? "아직 등록된 길드가 없어요"
              : "이 기간에 활동한 길드가 없어요"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          {filteredRanking.map((g, i) => {
            const rank = i + 1;
            const medal =
              rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

            return (
              <Link
                key={g.id}
                href={`/g/${g.code}`}
                className={`flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50 ${
                  i !== filteredRanking.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                {/* 순위 */}
                <div className="w-12 text-center">
                  {medal ? (
                    <span className="text-3xl">{medal}</span>
                  ) : (
                    <span className="text-xl font-bold text-gray-400">
                      {rank}
                    </span>
                  )}
                </div>

                {/* 로고 */}
                {g.logo_url ? (
                  <img
                    src={g.logo_url}
                    alt={g.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-2xl">
                    🏰
                  </div>
                )}

                {/* 길드 정보 */}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-gray-900">
                    {g.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {g.code} · 👥 {g.member_count}/{g.max_members}
                  </div>
                </div>

                {/* 포인트 */}
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    ⭐ {getPoints(g).toLocaleString()}P
                  </div>
                  <div className="text-xs text-gray-500">{periodLabel[tab]}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-gray-500">
        출석체크와 향후 추가될 활동으로 포인트가 쌓여요
      </p>
    </div>
  );
}
