import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/ranking";
import { Trophy, ShoppingBag, Sparkles, Gamepad2, Megaphone } from "lucide-react";
import MegaphoneTicker from "@/components/plaza/MegaphoneTicker";
import BoardPreview, { type PlazaPost } from "@/components/plaza/BoardPreview";
import RecruitingGuilds, { type RecruitingGuild } from "@/components/plaza/RecruitingGuilds";
import MyProfileCard from "@/components/plaza/MyProfileCard";
import MyGuildsList, { type MyGuildItem } from "@/components/plaza/MyGuildsList";
import TopRankCompact from "@/components/plaza/TopRankCompact";
import type { RankedGuild } from "@/components/plaza/PodiumTop3";
import GameContentWidgets from "@/components/plaza/GameContentWidgets";

export const revalidate = 60;

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5 text-blue-600" />
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="flex-1 h-px bg-slate-200 ml-2" />
    </div>
  );
}

function ShopProductsPlaceholder() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 ring-1 ring-slate-200 flex flex-col items-center justify-center gap-2 text-center p-3 hover:ring-blue-300 transition-all">
          <Sparkles className="w-6 h-6 text-slate-300" />
          <p className="text-xs text-slate-400 leading-tight">오픈 예정</p>
        </div>
      ))}
    </div>
  );
}

export default async function PlazaPage() {
  const supabase = await createClient();

  const [
    userResult,
    recruitingResult,
    weeklyRankingResult,
    rawPostsResult,
    totalCountResult,
    announcementResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, code, name, logo_url, member_count, max_members, description").eq("is_recruiting", true).lt("member_count", 50).order("created_at", { ascending: false }).limit(5),
    supabase.from("weekly_guild_ranking").select("id, code, name, logo_url, weekly_points").order("weekly_points", { ascending: false }).limit(5),
    supabase.from("posts").select("id, title, category, is_notice, view_count, created_at, guild_id, author_id").order("created_at", { ascending: false }).limit(20),
    supabase.from("guilds").select("*", { count: "exact", head: true }),
    supabase.from("platform_settings").select("value").eq("key", "plaza_announcement").maybeSingle(),
  ]);

  const user = userResult.data.user;
  const recruitingRaw = recruitingResult.data;
  const weeklyRaw = weeklyRankingResult.data;
  const rawPosts = rawPostsResult.data;
  const totalGuildCount = totalCountResult.count;

  const annRaw = announcementResult.data?.value as { message: string; link: string; active: boolean } | null;
  const annMessage = annRaw?.active ? (annRaw.message ?? "") : "";
  const annLink = annRaw?.link ?? "";

  const recruitingGuilds: RecruitingGuild[] = (recruitingRaw ?? []).map((g) => ({
    id: g.id, code: g.code, name: g.name, logo_url: g.logo_url,
    member_count: g.member_count ?? 0, max_members: g.max_members ?? 50, description: g.description,
  }));

  const topRankings: RankedGuild[] = (weeklyRaw ?? []).map((g) => ({
    id: g.id, code: g.code, name: g.name, logo_url: g.logo_url, points: g.weekly_points ?? 0,
  }));

  const postGuildIds = Array.from(new Set((rawPosts ?? []).map((p) => p.guild_id).filter(Boolean)));
  const postAuthorIds = Array.from(new Set((rawPosts ?? []).map((p) => p.author_id).filter(Boolean)));

  const [profileResult, membershipsResult, postGuildsResult, postAuthorsResult] = await Promise.all([
    user ? supabase.from("profiles").select("username, avatar_url, is_platform_admin").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("guild_members").select("role, points, guilds(id, code, name, logo_url)").eq("user_id", user.id).limit(5) : Promise.resolve({ data: [] }),
    postGuildIds.length > 0 ? supabase.from("guilds").select("id, name, code").in("id", postGuildIds) : Promise.resolve({ data: [] }),
    postAuthorIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", postAuthorIds) : Promise.resolve({ data: [] }),
  ]);

  const myProfile = profileResult.data as { username: string | null; avatar_url: string | null; is_platform_admin: boolean } | null;
  const memberships = membershipsResult.data ?? [];
  const postGuilds = postGuildsResult.data ?? [];
  const postAuthors = postAuthorsResult.data ?? [];

  const myGuilds: MyGuildItem[] = (memberships as any[])
    .filter((m) => m.guilds)
    .map((m) => ({
      id: m.guilds.id, code: m.guilds.code, name: m.guilds.name,
      logo_url: m.guilds.logo_url, role: m.role, my_points: m.points ?? 0,
    }));

  const guildMap = new Map(postGuilds.map((g) => [g.id, g]));
  const authorMap = new Map(postAuthors.map((a: any) => [a.id, a.username]));

  const plazaPosts: PlazaPost[] = (rawPosts ?? []).map((p) => {
    const g = guildMap.get(p.guild_id);
    return {
      id: p.id, title: p.title, category: p.category, is_notice: p.is_notice,
      view_count: p.view_count ?? 0, created_at: p.created_at,
      guild_name: g?.name ?? "Unknown", guild_code: g?.code ?? "",
      author_name: authorMap.get(p.author_id) ?? "Unknown",
    };
  });

  return (
    <div>
      {/* 헤더 */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(59,130,246,0.3)]">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-blue-600 uppercase tracking-[0.2em] leading-none mb-1">GUILD PLAZA</p>
                <h1 className="text-xl font-bold text-slate-900 truncate leading-tight">광장</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-none mb-1">Total</p>
              <p className="text-lg font-bold text-blue-600 leading-none">
                {totalGuildCount ?? 0}
                <span className="text-sm text-slate-400 ml-1">개</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {annMessage.trim().length > 0 && (
        <div className="bg-blue-600 w-full">
          <div className="flex items-center gap-3 max-w-7xl mx-auto px-6 py-2.5">
            <Megaphone className="w-4 h-4 text-white shrink-0" />
            <p className="text-sm font-medium text-white truncate flex-1">{annMessage}</p>
            {annLink.length > 0 && (
              <a href={annLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white/80 underline underline-offset-2 shrink-0 hidden sm:block">
                자세히 보기 →
              </a>
            )}
          </div>
        </div>
      )}

      <MegaphoneTicker />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* 주간 랭킹 — 풀너비 상단 */}
        <TopRankCompact guilds={topRankings} />

        {/* 게시판(메인) + 우측 사이드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <BoardPreview posts={plazaPosts} />
          </div>
          <aside className="lg:col-span-4 space-y-6">
            <MyProfileCard
              isLoggedIn={!!user}
              profile={myProfile}
              isAdmin={myProfile?.is_platform_admin === true}
            />
            <MyGuildsList isLoggedIn={!!user} guilds={myGuilds} />
            <RecruitingGuilds guilds={recruitingGuilds} />
          </aside>
        </div>

        {/* 인게임 정보 */}
        <section>
          <SectionHeader icon={Gamepad2} title="인게임 정보" />
          <GameContentWidgets />
        </section>

        {/* 포인트 상점 */}
        <section>
          <SectionHeader icon={ShoppingBag} title="신규 포인트 상품" />
          <ShopProductsPlaceholder />
        </section>
      </div>
    </div>
  );
}
