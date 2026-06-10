import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/ranking";
import { ShoppingBag, Gamepad2, Megaphone, ArrowRight, Sparkles, Plus } from "lucide-react";
import PlazaSidebar from "@/components/plaza/PlazaSidebar";
import MegaphoneTicker from "@/components/plaza/MegaphoneTicker";
import BoardPreview, { type PlazaPost } from "@/components/plaza/BoardPreview";
import RecruitingGuilds, { type RecruitingGuild } from "@/components/plaza/RecruitingGuilds";
import MyProfileCard from "@/components/plaza/MyProfileCard";
import MyGuildsList, { type MyGuildItem } from "@/components/plaza/MyGuildsList";
import GameContentWidgets from "@/components/plaza/GameContentWidgets";
import GuildShowcaseColumn, { type ShowcaseItem } from "@/components/plaza/GuildShowcaseColumn";
import PlazaHero from "@/components/plaza/PlazaHero";
import TrendingGuilds from "@/components/plaza/TrendingGuilds";
import { formatNumber } from "@/lib/utils";

export const revalidate = 300;

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-violet-500" />
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="flex-1 h-px bg-slate-200 ml-2" />
      {action}
    </div>
  );
}

export default async function PlazaPage() {
  const supabase = await createClient();

  const [
    userResult,
    recruitingResult,
    rawPostsResult,
    totalCountResult,
    announcementResult,
    shopItemsResult,
    showcaseResult,
    latestPatchResult,
    heroResult,
    memberCountResult,
    todayAttendanceResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds_display").select("id, code, name, display_logo_url, member_count, max_members, description").eq("is_recruiting", true).lt("member_count", 50).order("created_at", { ascending: false }).limit(5),
    supabase.from("posts").select("id, title, category, is_notice, view_count, created_at, guild_id, author_id").is("guild_id", null).order("created_at", { ascending: false }).limit(30),
    supabase.from("guilds").select("*", { count: "exact", head: true }),
    supabase.from("platform_settings").select("value").eq("key", "plaza_announcement").maybeSingle(),
    supabase.from("shop_items").select("id, shop_type, category, name, price, image_url, duration_hours").eq("is_active", true).order("created_at", { ascending: false }).limit(4),
    supabase.from("guild_showcases").select("id, image_url, guild_id, created_at, guilds(code, name)").order("created_at", { ascending: false }).limit(40),
    supabase.from("patch_notes").select("title, tag, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(1),
    supabase.from("platform_settings").select("value").eq("key", "plaza_hero").maybeSingle(),
    supabase.from("guild_members").select("*", { count: "exact", head: true }),
    supabase.rpc("today_attendance_count"),
  ]);

  const user = userResult.data.user;
  const recruitingRaw = recruitingResult.data;
  const rawPosts = rawPostsResult.data;
  const totalGuildCount = totalCountResult.count;
  const shopRaw = shopItemsResult.data;
  const showcaseRaw = showcaseResult.data;

  const annRaw = announcementResult.data?.value as { message: string; link: string; active: boolean } | null;
  const annMessage = annRaw?.active ? (annRaw.message ?? "") : "";
  const annLink = annRaw?.link ?? "";

  // 히어로 배너 설정 + 통계
  const heroSetting = (heroResult.data?.value ?? null) as {
    active?: boolean;
    image_url?: string;
    title?: string;
    subtitle?: string;
    show_stats?: boolean;
  } | null;
  const memberTotal = memberCountResult.count ?? 0;
  const todayAttendanceCount = (todayAttendanceResult.data as number | null) ?? 0;

  // 길드 자랑 — 길드별 최신 1장만
  const seenShowcaseGuilds = new Set<string>();
  const showcaseItems: ShowcaseItem[] = [];
  for (const row of (showcaseRaw ?? []) as any[]) {
    if (!row.guild_id || seenShowcaseGuilds.has(row.guild_id)) continue;
    const g = Array.isArray(row.guilds) ? row.guilds[0] : row.guilds;
    if (!g) continue;
    seenShowcaseGuilds.add(row.guild_id);
    showcaseItems.push({
      id: row.id,
      guildCode: g.code,
      guildName: g.name,
      imageUrl: row.image_url,
    });
  }

  // 좋아요 카운트
  const plazaPostIds = Array.from(new Set((rawPosts ?? []).map((p) => p.id).filter(Boolean))) as string[];

  const [likeRowsResult] = await Promise.all([
    plazaPostIds.length > 0
      ? supabase.from("post_likes").select("post_id").in("post_id", plazaPostIds)
      : Promise.resolve({ data: [] }),
  ]);

  let likeCountMap: { [key: string]: number } = {};
  for (const row of likeRowsResult.data ?? []) {
    const pid = (row as any).post_id as string;
    likeCountMap[pid] = (likeCountMap[pid] ?? 0) + 1;
  }

  const postAuthorIds = Array.from(new Set((rawPosts ?? []).map((p) => p.author_id).filter(Boolean)));

  const [profileResult, membershipsResult, postAuthorsResult] = await Promise.all([
    user ? supabase.from("profiles").select("username, avatar_url, is_platform_admin, equipped_mark_id, equipped_card_id, last_patch_seen_at").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("guild_members").select("role, points, guild_id").eq("user_id", user.id).limit(5) : Promise.resolve({ data: [] }),
    postAuthorIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", postAuthorIds) : Promise.resolve({ data: [] }),
  ]);

  const myProfile = profileResult.data as {
    username: string | null;
    avatar_url: string | null;
    is_platform_admin: boolean;
    equipped_mark_id: string | null;
    equipped_card_id: string | null;
    last_patch_seen_at: string | null;
  } | null;
  const memberships = (membershipsResult.data ?? []) as any[];
  const postAuthors = postAuthorsResult.data ?? [];

  // 내 길드 정보 + 서버 이름 (멤버십/모집 결과에 의존 → 병렬로 묶음)
  const myGuildIds = Array.from(new Set(memberships.map((m) => m.guild_id).filter(Boolean)));
  const recruitingIds = Array.from(new Set((recruitingRaw ?? []).map((g) => g.id).filter(Boolean))) as string[];
  const guildIdsForServer = Array.from(new Set([...recruitingIds, ...myGuildIds])) as string[];

  // 장착 마크/카드 purchase id
  const equippedPurchaseIds = myProfile
    ? ([myProfile.equipped_mark_id, myProfile.equipped_card_id].filter(Boolean) as string[])
    : [];

  const [myGuildsDisplayResult, serverRowsResult, equippedPurchasesResult] = await Promise.all([
    myGuildIds.length > 0
      ? supabase.from("guilds_display").select("id, code, name, display_logo_url").in("id", myGuildIds)
      : Promise.resolve({ data: [] }),
    guildIdsForServer.length > 0
      ? supabase.from("guilds").select("id, server").in("id", guildIdsForServer)
      : Promise.resolve({ data: [] }),
    equippedPurchaseIds.length > 0
      ? supabase.from("purchases").select("id, item_id").in("id", equippedPurchaseIds)
      : Promise.resolve({ data: [] }),
  ]);

  let myGuildMap = new Map<string, { id: string; code: string; name: string; display_logo_url: string | null }>();
  myGuildMap = new Map((myGuildsDisplayResult.data ?? []).map((g) => [g.id, g]));

  let serverMap = new Map<string, string | null>();
  serverMap = new Map((serverRowsResult.data ?? []).map((r) => [r.id, (r as any).server ?? null]));

  // 장착 마크/카드 이미지 (purchase → shop_items)
  let equippedMarkUrl: string | null = null;
  let equippedCardFrameUrl: string | null = null;
  const equippedPurchases = equippedPurchasesResult.data ?? [];
  if (equippedPurchases.length > 0) {
    const purchaseItemIds = Array.from(
      new Set(equippedPurchases.map((p) => p.item_id).filter(Boolean))
    ) as string[];

    let itemImageMap: { [key: string]: { image_url: string | null; frame_url: string | null } } = {};
    if (purchaseItemIds.length > 0) {
      const { data: shopItemsData } = await supabase
        .from("shop_items")
        .select("id, image_url, frame_url")
        .in("id", purchaseItemIds);
      for (const it of shopItemsData ?? []) {
        itemImageMap[it.id] = { image_url: it.image_url, frame_url: it.frame_url };
      }
    }

    const purchaseMap = new Map(equippedPurchases.map((p) => [p.id, p.item_id]));
    if (myProfile?.equipped_mark_id) {
      const markItemId = purchaseMap.get(myProfile.equipped_mark_id);
      if (markItemId) equippedMarkUrl = itemImageMap[markItemId]?.image_url ?? null;
    }
    if (myProfile?.equipped_card_id) {
      const cardItemId = purchaseMap.get(myProfile.equipped_card_id);
      if (cardItemId) equippedCardFrameUrl = itemImageMap[cardItemId]?.frame_url ?? null;
    }
  }

  const recruitingGuilds: RecruitingGuild[] = (recruitingRaw ?? []).map((g) => ({
    id: g.id, code: g.code, name: g.name,
    logo_url: g.display_logo_url,
    member_count: g.member_count ?? 0,
    max_members: g.max_members ?? 50,
    description: g.description,
    server: serverMap.get(g.id) ?? null,
  }));

  const myGuilds: MyGuildItem[] = memberships
    .filter((m) => myGuildMap.has(m.guild_id))
    .map((m) => {
      const g = myGuildMap.get(m.guild_id)!;
      return {
        id: g.id, code: g.code, name: g.name,
        logo_url: g.display_logo_url,
        role: m.role,
        my_points: m.points ?? 0,
        server: serverMap.get(g.id) ?? null,
      };
    });

  const authorMap = new Map(postAuthors.map((a: any) => [a.id, a.username]));

  const plazaPosts: PlazaPost[] = (rawPosts ?? [])
    .map((p) => ({
      id: p.id, title: p.title, category: p.category, is_notice: p.is_notice,
      view_count: p.view_count ?? 0, created_at: p.created_at,
      guild_name: "", guild_code: "", guild_server: null,
      author_name: authorMap.get(p.author_id) ?? "익명",
      like_count: likeCountMap[p.id] ?? 0,
    }))
    .sort((a, b) => {
      if (b.like_count !== a.like_count) return b.like_count - a.like_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const hasGuild = myGuilds.length > 0;
  const canCreateGuild = myGuilds.length < 2;
  const shopHref = hasGuild ? `/guild/${myGuilds[0].code}/shop` : "/onboarding/join";

  const shopItems = (shopRaw ?? []).map((s) => ({
    id: s.id, name: s.name, price: s.price,
    image_url: s.image_url, category: s.category,
  }));

  // 신규 패치노트 여부 + 최신 패치노트 정보
  const latestPatchRow = latestPatchResult.data?.[0] ?? null;
  const latestPatchAt = latestPatchRow?.created_at ?? null;
  const lastSeenAt = myProfile?.last_patch_seen_at ?? null;
  const hasNewPatch = latestPatchAt
    ? !lastSeenAt || new Date(latestPatchAt).getTime() > new Date(lastSeenAt).getTime()
    : false;
  const latestPatch = latestPatchRow
    ? { title: latestPatchRow.title as string, tag: latestPatchRow.tag as string }
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">GUILD PLAZA</p>
                <h1 className="text-lg font-bold text-slate-900 truncate leading-tight">광장</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-none mb-1">Total</p>
              <p className="text-base font-bold text-slate-800 leading-none">
                {totalGuildCount ?? 0}<span className="text-sm text-slate-400 ml-1">개</span>
              </p>
            </div>
          </div>
          <PlazaSidebar shopHref={shopHref} hasNewPatch={hasNewPatch} isAdmin={myProfile?.is_platform_admin === true} />
        </div>
      </div>

      {/* 플랫폼 공지 */}
      {annMessage.trim().length > 0 && (
        <div className="bg-slate-100 border-b border-slate-200 w-full">
          <div className="flex items-center gap-3 max-w-[1400px] mx-auto px-4 md:px-6 py-2">
            <Megaphone className="w-4 h-4 text-slate-500 shrink-0" />
            <p className="text-sm font-medium text-slate-700 truncate flex-1">{annMessage}</p>
            {annLink.length > 0 && (
              <a href={annLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-500 underline underline-offset-2 shrink-0 hidden sm:block">
                자세히 보기 →
              </a>
            )}
          </div>
        </div>
      )}

      {/* 확성기 ticker */}
      <MegaphoneTicker />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* 히어로 배너 */}
        <PlazaHero
          setting={heroSetting}
          guildCount={totalGuildCount ?? 0}
          memberCount={memberTotal}
          todayAttendance={todayAttendanceCount}
          latestPatch={latestPatch}
          isLoggedIn={!!user}
        />

        {/* 길드 만들기 CTA */}
        {canCreateGuild && (
          <Link
            href="/onboarding/create"
            className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 mb-5 max-w-md hover:from-violet-500 hover:to-indigo-500 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 shrink-0">
                <Plus className="w-4 h-4 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">
                  {hasGuild ? "새 길드 만들기" : "나만의 길드 만들기"}
                </p>
                <p className="text-white/75 text-[11px] leading-tight">출석 · 레이드 · 랭킹 한 곳에서</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* 3단: 좌배너 + 중앙 + 우배너 */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* 좌측: 마이프로필 + 포인트샵 */}
          <div className="w-full lg:w-[200px] shrink-0 space-y-4">
            <MyProfileCard
              isLoggedIn={!!user}
              profile={myProfile}
              isAdmin={myProfile?.is_platform_admin === true}
              markUrl={equippedMarkUrl}
              cardFrameUrl={equippedCardFrameUrl}
            />
            {shopItems.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.1em] mb-2">POINT SHOP</p>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                  {shopItems.map((item) => (
                    <Link
                      key={item.id}
                      href={shopHref}
                      className="block rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden hover:ring-violet-300 transition group"
                    >
                      <div className="aspect-square bg-slate-100 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs font-bold text-violet-600 mt-0.5">{formatNumber(item.price)}P</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 중앙 */}
          <div className="flex-1 min-w-0 space-y-6">
            <Suspense fallback={
              <div className="h-[150px] rounded-xl bg-white ring-1 ring-slate-200 animate-pulse" />
            }>
              <TrendingGuilds />
            </Suspense>

            <BoardPreview posts={plazaPosts} />

            <section>
              <SectionHeader icon={Gamepad2} title="인게임 정보" />
              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 rounded-xl bg-white ring-1 ring-slate-200 animate-pulse" />
                  ))}
                </div>
              }>
                <GameContentWidgets />
              </Suspense>
            </section>
          </div>

          {/* 우측: 내 길드 + 모집중 + 길드 자랑 */}
          <aside className="w-full lg:w-[212px] shrink-0 space-y-4">
            <MyGuildsList isLoggedIn={!!user} guilds={myGuilds} />
            <RecruitingGuilds guilds={recruitingGuilds} />
            <GuildShowcaseColumn items={showcaseItems} />
          </aside>
        </div>
      </div>
    </div>
  );
}
