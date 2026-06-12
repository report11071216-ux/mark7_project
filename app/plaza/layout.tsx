import { createClient } from "@/lib/supabase/server";
import PlazaSidebar from "@/components/plaza/PlazaSidebar";
import MyGuildButton, { type MyGuildBtnItem } from "@/components/plaza/MyGuildButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "광장",
  description:
    "길드패스 광장 - 길드 랭킹, 게시판, 커뮤니티. 회원가입 없이 둘러볼 수 있어요.",
};

export default async function PlazaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 헤더용 데이터: 프로필(관리자/패치) + 내 길드
  const [profileResult, membershipsResult] = await Promise.all([
    user
      ? supabase.from("profiles").select("is_platform_admin, last_patch_seen_at").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("guild_members").select("role, points, guild_id").eq("user_id", user.id).limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const myProfile = profileResult.data as {
    is_platform_admin: boolean;
    last_patch_seen_at: string | null;
  } | null;
  const memberships = (membershipsResult.data ?? []) as any[];

  const myGuildIds = Array.from(new Set(memberships.map((m) => m.guild_id).filter(Boolean))) as string[];

  // 내 길드 표시 정보 (마크/이름/코드) + 서버
  let myGuildMap = new Map<string, { code: string; name: string; display_logo_url: string | null }>();
  let serverMap = new Map<string, string | null>();
  if (myGuildIds.length > 0) {
    const [displayResult, serverResult] = await Promise.all([
      supabase.from("guilds_display").select("id, code, name, display_logo_url").in("id", myGuildIds),
      supabase.from("guilds").select("id, server").in("id", myGuildIds),
    ]);
    myGuildMap = new Map((displayResult.data ?? []).map((g) => [g.id, g]));
    serverMap = new Map((serverResult.data ?? []).map((r) => [r.id, (r as any).server ?? null]));
  }

  const myGuilds: MyGuildBtnItem[] = memberships
    .filter((m) => myGuildMap.has(m.guild_id))
    .map((m) => {
      const g = myGuildMap.get(m.guild_id)!;
      return {
        code: g.code,
        name: g.name,
        role: m.role,
        myPoints: m.points ?? 0,
        server: serverMap.get(m.guild_id) ?? null,
        logoUrl: g.display_logo_url,
      };
    });

  // 새 패치 여부
  let hasNewPatch = false;
  const { data: latestPatch } = await supabase
    .from("patch_notes")
    .select("created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestPatch?.created_at) {
    const lastSeen = myProfile?.last_patch_seen_at ?? null;
    hasNewPatch = !lastSeen || new Date(latestPatch.created_at).getTime() > new Date(lastSeen).getTime();
  }

  const shopHref = myGuilds.length > 0 ? `/guild/${myGuilds[0].code}/shop` : "/onboarding/join";

  return (
    <div className="plaza-dark min-h-screen bg-plaza-canvas text-plaza-ink">
      {/* 공통 상단 헤더 */}
      <div className="bg-plaza-surface border-b border-plaza-line sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3">
            <a href="/plaza" className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h1
                  className="text-2xl font-extrabold tracking-tight leading-none"
                  style={{
                    backgroundImage: "linear-gradient(95deg, #f5b8e0 0%, #c99af0 50%, #9a7ce8 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  CLAYLOA
                </h1>
                <p className="text-[10px] font-mono text-plaza-ink-dim uppercase tracking-[0.25em] leading-none mt-1">GUILD PLAZA</p>
              </div>
            </a>
            <MyGuildButton isLoggedIn={!!user} guilds={myGuilds} />
          </div>
          <PlazaSidebar shopHref={shopHref} hasNewPatch={hasNewPatch} isAdmin={myProfile?.is_platform_admin === true} />
        </div>
      </div>

      {children}
    </div>
  );
}
