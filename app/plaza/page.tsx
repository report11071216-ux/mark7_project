import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/ranking";
import { Trophy, ShoppingBag, Gamepad2, Megaphone, ArrowRight, Sparkles } from "lucide-react";
import PlazaSidebar from "@/components/plaza/PlazaSidebar";
import MegaphoneTicker from "@/components/plaza/MegaphoneTicker";
import BoardPreview, { type PlazaPost } from "@/components/plaza/BoardPreview";
import RecruitingGuilds, { type RecruitingGuild } from "@/components/plaza/RecruitingGuilds";
import MyProfileCard from "@/components/plaza/MyProfileCard";
import MyGuildsList, { type MyGuildItem } from "@/components/plaza/MyGuildsList";
import TopRankCompact from "@/components/plaza/TopRankCompact";
import type { RankedGuild } from "@/components/plaza/PodiumTop3";
import GameContentWidgets from "@/components/plaza/GameContentWidgets";
import ShopPreview, { type ShopPreviewItem } from "@/components/plaza/ShopPreview";
import GuildShowcaseColumn, { type ShowcaseItem } from "@/components/plaza/GuildShowcaseColumn";

export const revalidate = 60;

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
      <Icon className="w-5 h-5 text-slate-700" />
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
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
    weeklyRankingResult,
    rawPostsResult,
    totalCountResult,
    announcementResult,
    shopItemsResult,
    showcaseResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds_display").select("id, code, name, display_logo_url, member_count, max_members, description").eq("is_recruiting", true).lt("member_count", 50).order("created_at", { ascending: false }).limit(5),
    supabase.from("weekly_guild_ranking").select("id, code, name, logo_url, weekly_points").order("weekly_points", { ascending: false }).limit(5),
    supabase.from("posts").select("id, title, category, is_notice, view_count, created_at, guild_id, author_id").is("guild_id", null).order("created_at", { ascending: false }).limit(20),
    supabase.from("guilds").select("*", { count: "exact", head: true }),
    supabase.from("platform_settings").select("value").eq("key", "plaza_announcement").maybeSingle(),
    supabase.from("shop_items").select("id, shop_type, category, name, price, image_url, duration_hours").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
    supabase.from("guild_showcases").select("id, image_url, guild_id, created_at, guilds(code, name)").order("created_at", { ascending: false }).limit(40),
  ]);

  const user = userResult.data.user;
  const recruitingRaw = recruitingResult.data;
  const weeklyRaw = weeklyRankingResult.data;
  const rawPosts = rawPostsResult.data;
  const totalGuildCount = totalCountResult.count;
  const shopRaw = shopItemsResult.data;
  const showcaseRaw = showcaseResult.data;

  const annRaw = announcementResult.data?.value as { message: string; link: string; active: boolean } | null;
  const annMessage = annRaw?.active ? (annRaw.message ?? "") : "";
  const annLink = annRaw?.link ?? "";

  // 길드 자랑 — 길드별 최신 1장만 (created_at desc 정렬이라 처음 나오는 게 최신)
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

  // 주간 랭킹 길드들의 표시용 로고 가져오기
  const weeklyGuildIds = Array.from(new Set((weeklyRaw ?? []).map((g) => g.id).filter(Boolean)));
  let weeklyLogoMap = new Map<string, string | null>();
  if (weeklyGuildIds.length > 0) {
    const { data: weeklyDisplay } = await supabase
      .from("guilds_display")
      .select("id, display_logo_url")
      .in("id", weeklyGuildIds);
    weeklyLogoMap = new Map((weeklyDisplay ?? []).map((g) => [g.id, g.display_logo_url]));
  }

  const topRankings: RankedGuild[] = (weeklyRaw ?? []).map((g) => ({
    id: g.id, code: g.code, name: g.name,
    logo_url: weeklyLogoMap.get(g.id) ?? g.logo_url,
    points: g.weekly_points ?? 0, member_count: 0, master_name: "",
  }));

  const shopItems: ShopPreviewItem[] = (shopRaw ?? []).map((s) => ({
    id: s.id, shop_type: s.shop_type, category: s.category,
    name: s.name, price: s.price, image_url: s.image_url,
    duration_hours: s.duration_hours,
  }));

  const postGuildIds = Array.from(new Set((rawPosts ?? []).map((p) => p.guild_id).filter(Boolean)));
  const postAuthorIds = Array.from(new Set((rawPosts ?? []).map((p) => p.author_id).filter(Boolean)));

  const [profileResult, membershipsResult, postGuildsResult, postAuthorsResult] = await Promise.all([
    user ? supabase.from("profiles").select("username, avatar_url, is_platform_admin, equipped_mark_id, equipped_card_id").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("guild_members").select("role, points, guild_id").eq("user_id", user.id).limit(5) : Promise.resolve({ data: [] }),
    postGuildIds.length > 0 ? supabase.from("guilds").select("id, name, code, server").in("id", postGuildIds) : Promise.resolve({ data: [] }),
    postAuthorIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", postAuthorIds) : Promise.resolve({ data: [] }),
  ]);

  const myProfile = profileResult.data as {
    username: string | null;
    avatar_url: string | null;
    is_platform_admin: boolean;
    equipped_mark_id: string | null;
    equipped_card_id: string | null;
  } | null;
  const memberships = (membershipsResult.data ?? []) as any[];
  const postGuilds = (postGuildsResult.data ?? []) as any[];
  const postAuthors = postAuthorsResult.data ?? [];

  // 장착한 마크 / 프로필카드 이미지 가져오기
  let equippedMarkUrl: string | null = null;
  let equippedCardFrameUrl: string | null = null;
  if (myProfile && (myProfile.equipped_mark_id || myProfile.equipped_card_id)) {
    const equippedPurchaseIds = [myProfile.equipped_mark_id, myProfile.equipped_card_id].filter(Boolean) as string[];
    const { data: equippedPurchases } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", equippedPurchaseIds);

    const purchaseItemIds = Array.from(
      new Set((equippedPurchases ?? []).map((p) => p.item_id).filter(Boolean))
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

    const purchaseMap = new Map((equippedPurchases ?? []).map((p) => [p.id, p.item_id]));

    if (myProfile.equipped_mark_id) {
      const markItemId = purchaseMap.get(myProfile.equipped_mark_id);
      if (markItemId) equippedMarkUrl = itemImageMap[markItemId]?.image_url ?? null;
    }
    if (myProfile.equipped_card_id) {
      const cardItemId = purchaseMap.get(myProfile.equipped_card_id);
      if (cardItemId) equippedCardFrameUrl = itemImageMap[cardItemId]?.frame_url ?? null;
    }
  }

  // 내 길드들의 표시용 정보 가져오기
  const myGuildIds = Array.from(new Set(memberships.map((m) => m.guild_id).filter(Boolean)));
  let myGuildMap = new Map<string, { id: string; code: string; name: string; display_logo_url: string | null }>();
  if (myGuildIds.length > 0) {
    const { data: myGuildsDisplay } = await supabase
      .from("guilds_display")
      .select("id, code, name, display_logo_url")
      .in("id", myGuildIds);
    myGuildMap = new Map((myGuildsDisplay ?? []).map((g) => [g.id, g]));
  }

  // 서버 이름 조회 — guilds_display 뷰엔 없어서 guilds 테이블에서 추가 조회
  const recruitingIds = Array.from(new Set((recruitingRaw ?? []).map((g) => g.id).filter(Boolean))) as string[];
  const guildIdsForServer = Array.from(new Set([...recruitingIds, ...myGuildIds])) as string[];
  let serverMap = new Map<string, string | null>();
  if (guildIdsForServer.length > 0) {
    const { data: serverRows } = await supabase
      .from("guilds")
      .select("id, server")
      .in("id", guildIdsForServer);
    serverMap = new Map((serverRows ?? []).map((r) => [r.id, (r as any).server ?? null]));
  }

  const recruitingGuilds: RecruitingGuild[] = (recruitingRaw ?? []).map((g) => ({
    id: g.id,
    code: g.code,
    name: g.name,
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
        id: g.id,
        code: g.code,
        name: g.name,
        logo_url: g.display_logo_url,
        role: m.role,
        my_points: m.points ?? 0,
        server: serverMap.get(g.id) ?? null,
      };
    });

  const guildMap = new Map(postGuilds.map((g) => [g.id, g]));
  const authorMap = new Map(postAuthors.map((a: any) => [a.id, a.username]));

  const plazaPosts: PlazaPost[] = (rawPosts ?? []).map((p) => {
    const g = guildMap.get(p.guild_id);
    return {
      id: p.id, title: p.title, category: p.category, is_notice: p.is_notice,
      view_count: p.view_count ?? 0, created_at: p.created_at,
      guild_name: g?.name ?? "Unknown", guild_code: g?.code ?? "",
      guild_server: g?.server ?? null,
      author_name: authorMap.get(p.author_id) ?? "Unknown",
    };
  });

  // 상점 바로가기 — 내 길드 있으면 그 길드 상점으로, 없으면 길드 가입으로
  const hasGuild = myGuilds.length > 0;
  const shopHref = hasGuild ? `/guild/${myGuilds[0].code}/shop` : "/onboarding/join";
  const shopLabel = hasGuild ? "내 길드 상점 가기" : "길드 가입하고 상점 이용";

  const shopButton = (
    <Link
      href={shopHref}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors shrink-0"
    >
      <ShoppingBag className="w-4 h-4" />
      <span>{shopLabel}</span>
      <ArrowRight className="w-4 h-4" />
    </Link>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      <PlazaSidebar shopHref={shopHref} />

      <main className="flex-1 min-w-0">
        {/* 상단 헤더 */}
        <div className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">GUILD PLAZA</p>
                  <h1 className="text-xl font-bold text-slate-900 truncate leading-tight">광장</h1>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-none mb-1">Total</p>
                <p className="text-lg font-bold text-slate-800 leading-none">
                  {totalGuildCount ?? 0}
                  <span className="text-sm text-slate-400 ml-1">개</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 플랫폼 공지 */}
        {annMessage.trim().length > 0 && (
          <div className="bg-slate-800 w-full">
            <div className="flex items-center gap-3 max-w-7xl mx-auto px-6 py-2.5">
              <Megaphone className="w-4 h-4 text-white shrink-0" />
              <p className="text-sm font-medium text-white truncate flex-1">{annMessage}</p>
              {annLink.length > 0 && (
                <a href={annLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white/70 underline underline-offset-2 shrink-0 hidden sm:block">
                  자세히 보기 →
                </a>
              )}
            </div>
          </div>
        )}

        <MegaphoneTicker />

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="space-y-6">

            {/* 길드 랭킹 */}
            <section>
              <SectionHeader icon={Trophy} title="길드 랭킹" />
              <TopRankCompact guilds={topRankings} />
            </section>

            {/* 본문 + 길드 자랑 열 */}
            <div className="flex gap-5">
              <div className="flex-1 min-w-0 space-y-6">
                {/* 게시판 + 사이드 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8">
                    <BoardPreview posts={plazaPosts} />
                  </div>
                  <aside className="lg:col-span-4 space-y-5">
                    <MyProfileCard
                      isLoggedIn={!!user}
                      profile={myProfile}
                      isAdmin={myProfile?.is_platform_admin === true}
                      markUrl={equippedMarkUrl}
                      cardFrameUrl={equippedCardFrameUrl}
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

                {/* 신규 포인트 상품 */}
                <section>
                  <SectionHeader icon={ShoppingBag} title="신규 포인트 상품" action={shopButton} />
                  <ShopPreview items={shopItems} />
                </section>
              </div>

              {/* 길드 자랑 열 */}
              <aside className="hidden xl:block w-36 shrink-0">
                <div className="sticky top-24">
                  <GuildShowcaseColumn items={showcaseItems} />
                </div>
              </aside>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
