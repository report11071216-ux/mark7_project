// app/plaza/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getWeekStart, getMonthStart } from "@/lib/ranking";
import PlazaTabs from "@/components/plaza/PlazaTabs";
import type { RankedGuild } from "@/components/plaza/PodiumTop3";

export default async function PlazaPage() {
  const supabase = createClient();

  // === 1. 전체 랭킹 (누적 포인트 기준) ===
  const { data: totalRanking } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count, total_points, master_id")
    .order("total_points", { ascending: false })
    .limit(100);

  // === 2. 주간 랭킹 (이번 주 출석 수 집계) ===
  const weekStart = getWeekStart();
  const { data: weeklyAttendances } = await supabase
    .from("attendances")
    .select("guild_id")
    .gte("attendance_date", weekStart);

  // === 3. 월간 랭킹 (이번 달 출석 수 집계) ===
  const monthStart = getMonthStart();
  const { data: monthlyAttendances } = await supabase
    .from("attendances")
    .select("guild_id")
    .gte("attendance_date", monthStart);

  // === 4. 마스터 닉네임 조회용 profiles ===
  const masterIds = (totalRanking ?? []).map((g) => g.master_id).filter(Boolean);
  const { data: masters } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", masterIds.length > 0 ? masterIds : ["00000000-0000-0000-0000-000000000000"]);
  const masterMap = new Map((masters ?? []).map((m) => [m.id, m.username]));

  // === 5. 집계 함수 ===
  function aggregateRanking(
    attendances: { guild_id: string }[] | null,
    metric: "weekly" | "monthly"
  ): RankedGuild[] {
    const counts = new Map<string, number>();
    (attendances ?? []).forEach((a) => {
      counts.set(a.guild_id, (counts.get(a.guild_id) ?? 0) + 1);
    });
    return (totalRanking ?? [])
      .map((g) => ({
        id: g.id,
        code: g.code,
        name: g.name,
        logo_url: g.logo_url,
        member_count: g.member_count,
        master_name: g.master_id ? masterMap.get(g.master_id) ?? null : null,
        points: counts.get(g.id) ?? 0,
      }))
      .filter((g) => g.points > 0) // 출석 0인 길드 제외
      .sort((a, b) => b.points - a.points)
      .slice(0, 100);
  }

  const totalList: RankedGuild[] = (totalRanking ?? []).map((g) => ({
    id: g.id,
    code: g.code,
    name: g.name,
    logo_url: g.logo_url,
    member_count: g.member_count,
    master_name: g.master_id ? masterMap.get(g.master_id) ?? null : null,
    points: g.total_points ?? 0,
  }));

  const weeklyList = aggregateRanking(weeklyAttendances, "weekly");
  const monthlyList = aggregateRanking(monthlyAttendances, "monthly");

  // 전체 길드 수
  const { count: totalGuildCount } = await supabase
    .from("guilds")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* 헤더 */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-violet-950/20 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-xs font-mono text-violet-400 uppercase tracking-[0.2em] mb-2">
            GUILD PLAZA
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">정상에 선 길드들</h1>
          <p className="text-zinc-400">
            전체 <span className="text-violet-300 font-bold font-mono">{totalGuildCount ?? 0}</span>개 길드의 랭킹
          </p>
        </div>
      </div>

      {/* 탭 + 콘텐츠 (클라이언트 컴포넌트) */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <PlazaTabs
          totalList={totalList}
          weeklyList={weeklyList}
          monthlyList={monthlyList}
        />
      </div>
    </div>
  );
}
