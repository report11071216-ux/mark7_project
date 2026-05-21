// app/plaza/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getWeekStart, getMonthStart } from "@/lib/ranking";
import { Trophy, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import MegaphoneTicker from "@/components/plaza/MegaphoneTicker";
import TopRankCompact from "@/components/plaza/TopRankCompact";
import BoardPreview, { type PlazaPost } from "@/components/plaza/BoardPreview";
import type { RankedGuild } from "@/components/plaza/PodiumTop3";

export default async function PlazaPage() {
  const supabase = createClient();

  // === 1. 길드 기본 정보 (랭킹 + 메타) ===
  const { data: allGuilds } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count, total_points, master_id")
    .limit(200);

  // === 2. 이번 주 출석 집계 (메인은 주간 TOP 5만) ===
  const weekStart = getWeekStart();
  const { data: weeklyAttendances } = await supabase
    .from("attendances")
    .select("guild_id")
    .gte("attendance_date", weekStart);

  // === 3. 마스터 닉네임 ===
  const masterIds = (allGuilds ?? []).map((g) => g.master_id).filter(Boolean);
  const { data: masters } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", masterIds.length > 0 ? masterIds : ["00000000-0000-0000-0000-000000000000"]);
  const masterMap = new Map((masters ?? []).map((m) => [m.id, m.username]));

  // === 4. 주간 TOP 5 집계 ===
  const weekCounts = new Map<string, number>();
  (weeklyAttendances ?? []).forEach((a) => {
    weekCounts.set(a.guild_id, (weekCounts.get(a.guild_id) ?? 0) + 1);
  });
  const weeklyTop5: RankedGuild[] = (allGuilds ?? [])
    .map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      logo_url: g.logo_url,
      member_count: g.member_count,
      master_name: g.master_id ? masterMap.get(g.master_id) ?? null : null,
      points: weekCounts.get(g.id) ?? 0,
    }))
    .filter((g) => g.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // === 5. 광장 게시판 최신 글 (전체 길드 공용) ===
  const { data: rawPosts } = await supabase
    .from("posts")
    .select("id, title, category, is_notice, view_count, created_at, guild_id, author_id")
    .order("created_at", { ascending: false })
    .limit(20);

  // 길드 이름 + 작성자 이름 조회용
  const postGuildIds = Array.from(new Set((rawPosts ?? []).map((p) => p.guild_id).filter(Boolean)));
  const postAuthorIds = Array.from(new Set((rawPosts ?? []).map((p) => p.author_id).filter(Boolean)));

  const { data: postGuilds } = await supabase
    .from("guilds")
    .select("id, name, code")
    .in("id", postGuildIds.length > 0 ? postGuildIds : ["00000000-0000-0000-0000-000000000000"]);
  const guildMap = new Map((postGuilds ?? []).map((g) => [g.id, g]));

  const { data: postAuthors } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", postAuthorIds.length > 0 ? postAuthorIds : ["00000000-0000-0000-0000-000000000000"]);
  const authorMap = new Map((postAuthors ?? []).map((a) => [a.id, a.username]));

  const plazaPosts: PlazaPost[] = (rawPosts ?? []).map((p) => {
    const g = guildMap.get(p.guild_id);
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      is_notice: p.is_notice,
      view_count: p.view_count ?? 0,
      created_at: p.created_at,
      guild_name: g?.name ?? "Unknown",
      guild_code: g?.code ?? "",
      author_name: authorMap.get(p.author_id) ?? "Unknown",
    };
  });

  // === 6. 전체 길드 수 ===
  const { count: totalGuildCount } = await supabase
    .from("guilds")
    .select("*", { count: "exact", head: true });

  return (
    <>
      {/* 컴팩트 헤더 - 화이트 + 블루 액센트 */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(59,130,246,0.3)]">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-blue-600 uppercase tracking-[0.2em] leading-none mb-1">
                  GUILD PLAZA
                </p>
                <h1 className="text-lg font-bold text-slate-900 truncate leading-tight">
                  광장
                </h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-none mb-1">
                Total
              </p>
              <p className="text-base font-bold text-blue-600 font-mono leading-none">
                {totalGuildCount ?? 0}
                <span className="text-xs text-slate-400 ml-1">개</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 확성기 ticker (10%) - 청크 B에서 라이트화 예정 */}
      <MegaphoneTicker />

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* 주간 TOP 5 (20%) - 청크 B에서 라이트화 예정 */}
        <TopRankCompact guilds={weeklyTop5} />

        {/* 메인 그리드: 게시판(50% = 8/12) + 상점(20% = 4/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 게시판 - 청크 B에서 라이트화 예정 */}
          <div className="lg:col-span-8">
            <BoardPreview posts={plazaPosts} />
          </div>
          {/* 상점 placeholder - 라이트톤 완료 */}
          <div className="lg:col-span-4">
            <ShopPreviewPlaceholder />
          </div>
        </div>
      </div>
    </>
  );
}

// 12단계에서 진짜 상점 컴포넌트로 교체 예정
function ShopPreviewPlaceholder() {
  return (
    <div className="plaza-card overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">상점</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Coming Soon
          </span>
        </div>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center mb-3 ring-1 ring-blue-200">
          <Sparkles className="w-6 h-6 text-blue-500" />
        </div>
        <p className="text-sm text-slate-900 font-bold mb-1">
          포인트 상점 준비중
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          길드 마크, 프로필 카드,<br />
          뱃지, 확성기 등<br />
          출석 포인트로 구매
        </p>
        <div className="mt-4 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
          <span className="text-[10px] font-mono text-blue-600 uppercase tracking-wider">
            오픈 예정
          </span>
        </div>
      </div>
    </div>
  );
}
