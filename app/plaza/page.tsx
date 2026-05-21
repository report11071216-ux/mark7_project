// app/plaza/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getWeekStart, getMonthStart } from "@/lib/ranking";
import PlazaTabs from "@/components/plaza/PlazaTabs";
import { Trophy } from "lucide-react";
import type { RankedGuild } from "@/components/plaza/PodiumTop3";

export default async function PlazaPage() {
  const supabase = createClient();

  // === 1. 전체 랭킹 (누적 포인트 기준) ===
  const { data: totalRanking } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count, total_points, master_id")
    .order("total_points", { ascending: false })
    .limit(100);

  // === 2. 주간 랭킹 ===
  const weekStart = getWeekStart();
  const { data: weeklyAttendances } = await supabase
    .from("attendances")
    .select("guild_id")
    .gte("attendance_date", weekStart);

  // === 3. 월간 랭킹 ===
  const monthStart = getMonthStart();
  const { data: monthlyAttendances } = await supabase
    .from("attendances")
    .select("guild_id")
    .gte("attendance_date", monthStart);

  // === 4. 마스터 닉네임 ===
  const masterIds = (totalRanking ?? []).map((g) => g.master_id).filter(Boolean);
  const { data: masters } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", masterIds.length > 0 ? masterIds : ["00000000-0000-0000-0000-000000000000"]);
  const masterMap = new Map((masters ?? []).map((m) => [m.id, m.username]));

  // === 5. 집계 함수 ===
  function aggregateRanking(
    attendances: { guild_id: string }[] | null
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
      .filter((g) => g.points > 0)
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

  const weeklyList = aggregateRanking(weeklyAttendances);
  const monthlyList = aggregateRanking(monthlyAttendances);

  const { count: totalGuildCount } = await supabase
    .from("guilds")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* 컴팩트 헤더 */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/20 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            {/* 좌측: 아이콘 + 타이틀 */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(167,139,250,0.3)]">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-violet-400 uppercase tracking-[0.2em] leading-none mb-1">
                  GUILD PLAZA
                </p>
                <h1 className="text-lg font-bold text-white truncate leading-tight">
                  길드 랭킹
                </h1>
              </div>
            </div>

            {/* 우측: 통계 */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider leading-none mb-1">
                  Total
                </p>
                <p className="text-base font-bold text-violet-300 font-mono leading-none">
                  {totalGuildCount ?? 0}
                  <span className="text-xs text-zinc-500 ml-1">개</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 + 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <PlazaTabs
          totalList={totalList}
          weeklyList={weeklyList}
          monthlyList={monthlyList}
        />
      </div>
    </div>
  );
}
