// app/plaza/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/ranking";
import { Trophy, ShoppingBag, Sparkles, Sword, Anchor, Skull, Gamepad2 } from "lucide-react";
import MegaphoneTicker from "@/components/plaza/MegaphoneTicker";
import BoardPreview, { type PlazaPost } from "@/components/plaza/BoardPreview";
import RecruitingGuilds, { type RecruitingGuild } from "@/components/plaza/RecruitingGuilds";
import MyProfileCard from "@/components/plaza/MyProfileCard";
import MyGuildsList, { type MyGuildItem } from "@/components/plaza/MyGuildsList";
import SideRanking, { type RankedSide } from "@/components/plaza/SideRanking";

export default async function PlazaPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // === 1. 모집중 길드 ===
  const { data: recruitingRaw } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count, max_members, description, is_recruiting")
    .eq("is_recruiting", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const recruitingGuilds: RecruitingGuild[] = (recruitingRaw ?? [])
    .filter((g) => (g.member_count ?? 0) < (g.max_members ?? 50))
    .slice(0, 5)
    .map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      logo_url: g.logo_url,
      member_count: g.member_count ?? 0,
      max_members: g.max_members ?? 50,
      description: g.description,
    }));

  // === 2. 전체 길드 (랭킹용) ===
  const { data: allGuilds } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count, total_points")
    .limit(200);

  const weekStart = getWeekStart();
  const { data: weeklyAttendances } = await supabase
    .from("attendances")
    .select("guild_id")
    .gte("attendance_date", weekStart);

  const weekCounts = new Map<string, number>();
  (weeklyAttendances ?? []).forEach((a) => {
    weekCounts.set(a.guild_id, (weekCounts.get(a.guild_id) ?? 0) + 1);
  });

  const sideRankings: RankedSide[] = (allGuilds ?? [])
    .map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      logo_url: g.logo_url,
      points: weekCounts.get(g.id) ?? 0,
    }))
    .filter((g) => g.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // === 3. 내 프로필 + 내가 속한 길드 ===
  let myProfile: { username: string | null; avatar_url: string | null } | null = null;
  let myGuilds: MyGuildItem[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) myProfile = profile;

    const { data: memberships } = await supabase
      .from("guild_members")
      .select("role, points, guilds(id, code, name, logo_url)")
      .eq("user_id", user.id)
      .limit(5);

    myGuilds = (memberships ?? [])
      .filter((m: any) => m.guilds)
      .map((m: any) => ({
        id: m.guilds.id,
        code: m.guilds.code,
        name: m.guilds.name,
        logo_url: m.guilds.logo_url,
        role: m.role,
        my_points: m.points ?? 0,
      }));
  }

  // === 4. 게시판 글 ===
  const { data: rawPosts } = await supabase
    .from("posts")
    .select("id, title, category, is_notice, view_count, created_at, guild_id, author_id")
    .order("created_at", { ascending: false })
    .limit(20);

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

  // === 5. 전체 길드 수 ===
  const { count: totalGuildCount } = await supabase
    .from("guilds")
    .select("*", { count: "exact", head: true });

  return (
    <>
      {/* 컴팩트 헤더 */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
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

      {/* 메가폰 ticker - 청크 C에서 라이트화 예정 */}
      <MegaphoneTicker />

      {/* 메인 컨테이너 */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-12">
        {/* === 섹션 1: 메인 3컬럼 (모집중 / 게시판 / 사이드) === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-2">
            <RecruitingGuilds guilds={recruitingGuilds} />
          </aside>

          <div className="lg:col-span-7">
            <BoardPreview posts={plazaPosts} />
          </div>

          <aside className="lg:col-span-3 space-y-4">
            <MyProfileCard isLoggedIn={!!user} profile={myProfile} />
            <MyGuildsList isLoggedIn={!!user} guilds={myGuilds} />
            <SideRanking guilds={sideRankings} />
          </aside>
        </div>

        {/* === 섹션 2: 인게임 정보 (full width, 11단계 placeholder) === */}
        <section>
          <SectionHeader icon={Gamepad2} title="인게임 정보" />
          <ApiWidgetsPlaceholder />
        </section>

        {/* === 섹션 3: 신규 포인트 상품 (full width, 12단계 placeholder) === */}
        <section>
          <SectionHeader icon={ShoppingBag} title="신규 포인트 상품" />
          <ShopProductsPlaceholder />
        </section>
      </div>
    </>
  );
}

// === 섹션 헤더 (재사용) ===
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-blue-600" />
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
        Coming Soon
      </span>
      <div className="flex-1 h-px bg-slate-200 ml-2" />
    </div>
  );
}

// 11단계: 로아 API 위젯 placeholder
function ApiWidgetsPlaceholder() {
  const items = [
    { icon: Sword, label: "이번 주 가디언토벌", sub: "API 연동 예정" },
    { icon: Anchor, label: "오늘의 섬", sub: "API 연동 예정" },
    { icon: Skull, label: "필드 보스", sub: "API 연동 예정" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="plaza-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-200 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{it.label}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{it.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 12단계: 포인트샵 신규 상품 placeholder
function ShopProductsPlaceholder() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 ring-1 ring-slate-200 flex flex-col items-center justify-center gap-2 text-center p-3 hover:ring-blue-300 transition-all"
        >
          <Sparkles className="w-6 h-6 text-slate-300" />
          <p className="text-[11px] text-slate-400 leading-tight">오픈 예정</p>
        </div>
      ))}
    </div>
  );
}
