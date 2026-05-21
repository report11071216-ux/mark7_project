// app/ranking/page.tsx 교체
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import RankingTabs from "@/components/RankingTabs";

export const revalidate = 60;

export default async function RankingPage() {
  const supabase = await createClient(); // ← await 추가

  // 3개 병렬 조회
  const [{ data: totalRanking }, { data: weeklyRanking }, { data: monthlyRanking }] =
    await Promise.all([
      supabase
        .from("guilds")
        .select("id, name, code, logo_url, member_count, max_members, total_points")
        .order("total_points", { ascending: false })
        .limit(50),
      supabase
        .from("weekly_guild_ranking")
        .select("*")
        .order("weekly_points", { ascending: false })
        .limit(50),
      supabase
        .from("monthly_guild_ranking")
        .select("*")
        .order("monthly_points", { ascending: false })
        .limit(50),
    ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏆 길드 랭킹</h1>
          <p className="mt-1 text-gray-600">
            로스트아크 길드들의 출석 기반 포인트 경쟁
          </p>
        </div>
        <RankingTabs
          totalRanking={totalRanking || []}
          weeklyRanking={weeklyRanking || []}
          monthlyRanking={monthlyRanking || []}
        />
      </main>
    </>
  );
}
