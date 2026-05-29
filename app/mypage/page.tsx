import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User, FileText, Crown, ChevronRight,
  LogOut, Shield, Eye,
} from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import CharacterCard from "@/components/mypage/CharacterCard";
import CharacterSync from "@/components/mypage/CharacterSync";
import SiblingCharacters from "@/components/mypage/SiblingCharacters";
import ProfileEdit from "@/components/mypage/ProfileEdit";
import AttendanceCalendar from "@/components/mypage/AttendanceCalendar";
import MyInventory, { type MyInventoryItem } from "@/components/mypage/MyInventory";
import AttendanceCardCollection from "@/components/mypage/AttendanceCardCollection";
import { signOut } from "@/app/actions/auth";

const ROLE_LABEL: { [key: string]: string } = {
  master: "마스터",
  submaster: "부마스터",
  member: "길드원",
};

const ROLE_COLOR: { [key: string]: string } = {
  master: "text-amber-600 bg-amber-50 ring-1 ring-amber-200",
  submaster: "text-violet-600 bg-violet-50 ring-1 ring-violet-200",
  member: "text-slate-500 bg-slate-100 ring-1 ring-slate-200",
};

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split("T")[0];

  const [profileResult, membershipsResult, postsResult, attendanceResult, purchasesResult, charactersResult, cardDefsResult, userCardsResult, cardStateResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url, main_character_name, lostark_character_name, character_class, item_level, combat_power, server_name, expedition_level, character_image_url, lostark_synced_at, equipped_card_id, equipped_mark_id")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("guild_members")
        .select("role, points, guilds(id, code, name, logo_url)")
        .eq("user_id", user.id),
      supabase
        .from("posts")
        .select("id, title, category, view_count, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("attendances")
        .select("attendance_date")
        .eq("user_id", user.id)
        .gte("attendance_date", firstDay)
        .lte("attendance_date", lastDay),
      supabase
        .from("purchases")
        .select("id, item_id, item_name, item_category, price_paid, created_at")
        .eq("buyer_id", user.id)
        .eq("shop_type", "activity")
        .order("created_at", { ascending: false }),
      supabase
        .from("user_characters")
        .select("character_name, server_name, character_class, item_level, character_level, is_representative")
        .eq("user_id", user.id)
        .order("item_level", { ascending: false }),
      supabase
        .from("attendance_cards")
        .select("grade, name, bonus_points, nickname_color, image_url, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("user_cards")
        .select("grade, count")
        .eq("user_id", user.id),
      supabase
        .from("user_card_state")
        .select("equipped_grade, draw_tickets, total_duplicates")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const profile = profileResult.data;
  const memberships = (membershipsResult.data ?? []) as any[];
  const posts = postsResult.data ?? [];
  const attendedDates = (attendanceResult.data ?? []).map(
    (a) => a.attendance_date as string
  );

  const siblingCharacters = (charactersResult.data ?? []).map((c) => ({
    name: (c.character_name as string) || "",
    characterClass: (c.character_class as string) || "",
    itemLevel: c.item_level == null ? 0 : Number(c.item_level),
    serverName: (c.server_name as string) || "",
  }));

  const rawPurchases = purchasesResult.data ?? [];

  const purchaseItemIds = Array.from(
    new Set(rawPurchases.map((p) => p.item_id).filter(Boolean))
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

  const myItems: MyInventoryItem[] = rawPurchases.map((p) => {
    const img = p.item_id ? itemImageMap[p.item_id] : undefined;
    return {
      id: p.id,
      item_name: p.item_name,
      item_category: p.item_category,
      price_paid: p.price_paid,
      created_at: p.created_at,
      image_url: img?.image_url ?? null,
      frame_url: img?.frame_url ?? null,
    };
  });

  let equippedFrameUrl: string | null = null;
  if (profile?.equipped_card_id) {
    const equippedPurchase = rawPurchases.find((p) => p.id === profile.equipped_card_id);
    if (equippedPurchase?.item_id) {
      equippedFrameUrl = itemImageMap[equippedPurchase.item_id]?.frame_url ?? null;
    }
  }

  let equippedMarkUrl: string | null = null;
  if (profile?.equipped_mark_id) {
    const markPurchase = rawPurchases.find((p) => p.id === profile.equipped_mark_id);
    if (markPurchase?.item_id) {
      equippedMarkUrl = itemImageMap[markPurchase.item_id]?.image_url ?? null;
    }
  }
  const displayAvatarUrl = equippedMarkUrl ?? profile?.avatar_url ?? null;

  const hasSynced = !!profile?.main_character_name;

  // ── 출석 카드 도감 데이터 ──
  const cardDefs = (cardDefsResult.data ?? []) as any[];
  const userCards = (userCardsResult.data ?? []) as any[];
  const cardState = cardStateResult.data as { equipped_grade: string | null; draw_tickets: number; total_duplicates: number } | null;

  const ownedMap: { [key: string]: number } = {};
  for (const uc of userCards) {
    ownedMap[uc.grade] = uc.count ?? 1;
  }

  const collectionCards = cardDefs.map((c) => ({
    grade: c.grade,
    name: c.name,
    bonus_points: c.bonus_points ?? 0,
    nickname_color: c.nickname_color ?? null,
    image_url: c.image_url ?? null,
    owned: ownedMap[c.grade] != null,
    count: ownedMap[c.grade] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <Link href="/plaza" className="text-slate-400 hover:text-blue-600 transition">
              광장
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-700 font-bold">마이페이지</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          <div className="lg:col-span-8 space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">

              <div className="sm:col-span-5">
                <div className="plaza-card p-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      My Profile
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center mb-4">
                    {displayAvatarUrl ? (
                      <img
                        src={displayAvatarUrl}
                        alt={profile?.username ?? ""}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-100 mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center ring-2 ring-blue-100 mb-2">
                        <span className="text-xl font-bold text-white">
                          {(profile?.username ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <p className="text-sm font-bold text-slate-900">
                      {profile?.username ?? "이름없음"}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-full">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex-1">
                    <ProfileEdit username={profile?.username ?? ""} />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-7">
                <div className="plaza-card p-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      My Guilds
                    </p>
                  </div>
                  {memberships.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                      <Shield className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-xs text-slate-400">아직 가입한 길드가 없어요</p>
                      <Link
                        href="/onboarding/join"
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                      >
                        길드 찾기 →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {memberships.filter((m) => m.guilds).map((m) => (
                        <Link
                          key={m.guilds.id}
                          href={`/guild/${m.guilds.code}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition group"
                        >
                          {m.guilds.logo_url ? (
                            <img
                              src={m.guilds.logo_url}
                              alt={m.guilds.name}
                              className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-white">
                                {m.guilds.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition">
                                {m.guilds.name}
                              </p>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  ROLE_COLOR[m.role] ?? ROLE_COLOR.member
                                }`}
                              >
                                {ROLE_LABEL[m.role] ?? m.role}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-blue-600 font-bold">
                              {(m.points ?? 0).toLocaleString()} P
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="plaza-card p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  Character
                </p>
              </div>
              <CharacterSync
                currentName={profile?.lostark_character_name ?? null}
                syncedAt={profile?.lostark_synced_at ?? null}
              />
              {hasSynced ? (
                <>
                  <CharacterCard
                    name={profile!.main_character_name!}
                    characterClass={profile?.character_class ?? ""}
                    serverName={profile?.server_name ?? ""}
                    itemLevel={profile?.item_level ?? 0}
                    combatPower={parseFloat(String(profile?.combat_power ?? 0)) || 0}
                    expeditionLevel={profile?.expedition_level ?? 0}
                    imageUrl={profile?.character_image_url ?? null}
                    syncedAt={profile?.lostark_synced_at ?? null}
                    frameUrl={equippedFrameUrl}
                  />
                  <SiblingCharacters
                    characters={siblingCharacters}
                    repName={profile?.main_character_name ?? ""}
                  />
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Crown className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    캐릭터명을 입력하면 자동으로 정보를 가져와요
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <AttendanceCalendar attendedDates={attendedDates} />
          </div>
        </div>

        {/* 출석 카드 도감 */}
        <AttendanceCardCollection
          cards={collectionCards}
          equippedGrade={cardState?.equipped_grade ?? null}
          drawTickets={cardState?.draw_tickets ?? 0}
          totalDuplicates={cardState?.total_duplicates ?? 0}
        />

        <MyInventory
          items={myItems}
          equippedCardId={profile?.equipped_card_id ?? null}
          equippedMarkId={profile?.equipped_mark_id ?? null}
        />

        <div className="plaza-card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                My Posts
              </p>
            </div>
            <Link
              href="/plaza/board"
              className="text-[11px] font-mono text-blue-600 hover:text-blue-700 transition"
            >
              전체 보기 →
            </Link>
          </div>
          {posts.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-6 h-6 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">아직 작성한 글이 없어요</p>
              <Link
                href="/plaza/board/new"
                className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline"
              >
                첫 글 작성하기 →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/plaza/board/${post.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50 transition group"
                >
                  {post.category && (
                    <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {post.category}
                    </span>
                  )}
                  <p className="text-sm text-slate-700 truncate flex-1 group-hover:text-blue-700 transition">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                    <Eye className="w-3 h-3" />
                    {post.view_count ?? 0}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {getRelativeTime(post.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
