import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User, Calendar, FileText, Crown,
  ChevronRight, LogOut, Shield, Eye,
} from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import CharacterCard from "@/components/mypage/CharacterCard";
import CharacterSync from "@/components/mypage/CharacterSync";
import { signOut } from "@/app/actions/auth";

const ROLE_LABEL: { [key: string]: string } = {
  master: "마스터",
  submaster: "부마스터",
  member: "길드원",
};

const ROLE_COLOR: { [key: string]: string } = {
  master: "text-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20",
  submaster: "text-violet-400 bg-violet-500/10 ring-1 ring-violet-500/20",
  member: "text-zinc-400 bg-zinc-800 ring-1 ring-zinc-700",
};

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, membershipsResult, postsResult, attendanceResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url, main_character_name, lostark_character_name, character_class, item_level, combat_power, server_name, expedition_level, character_image_url, lostark_synced_at")
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
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte(
          "attendance_date",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split("T")[0]
        ),
    ]);

  const profile = profileResult.data;
  const memberships = (membershipsResult.data ?? []) as any[];
  const posts = postsResult.data ?? [];
  const attendanceCount = attendanceResult.count ?? 0;
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  const hasSynced = !!profile?.main_character_name;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* 헤더 */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <Link href="/plaza" className="text-zinc-500 hover:text-zinc-300 transition">광장</Link>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-zinc-300 font-bold">마이페이지</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ① 프로필 */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username ?? ""}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center ring-2 ring-amber-500/30">
                <span className="text-xl font-bold text-white">
                  {(profile?.username ?? "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-[0.2em] mb-1">
                Player
              </p>
              <h1 className="text-2xl font-bold text-white">
                {profile?.username ?? "이름없음"}
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
        </section>

        {/* ② 내 길드 목록 */}
        {memberships.length > 0 && (
          <section>
            <SectionTitle icon={Shield} title="내 길드" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {memberships
                .filter((m) => m.guilds)
                .map((m) => (
                  <Link
                    key={m.guilds.id}
                    href={`/guild/${m.guilds.code}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-800/60 transition group"
                  >
                    {m.guilds.logo_url ? (
                      <img
                        src={m.guilds.logo_url}
                        alt={m.guilds.name}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-zinc-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {m.guilds.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
                          {m.guilds.name}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ROLE_COLOR[m.role] ?? ROLE_COLOR.member}`}>
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-amber-400">
                        {(m.points ?? 0).toLocaleString()} P
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition shrink-0" />
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* ③ 로스트아크 캐릭터 */}
        <section>
          <SectionTitle icon={Crown} title="로스트아크 캐릭터" />
          <div className="space-y-4">
            <CharacterSync
              currentName={profile?.lostark_character_name ?? null}
              syncedAt={profile?.lostark_synced_at ?? null}
            />
            {hasSynced ? (
              <CharacterCard
                name={profile!.main_character_name!}
                characterClass={profile?.character_class ?? ""}
                serverName={profile?.server_name ?? ""}
                itemLevel={profile?.item_level ?? 0}
                combatPower={profile?.combat_power ?? 0}
                expeditionLevel={profile?.expedition_level ?? 0}
                imageUrl={profile?.character_image_url ?? null}
                syncedAt={profile?.lostark_synced_at ?? null}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
                <Crown className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">
                  캐릭터명을 입력하면 자동으로 정보를 가져와요
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ④ 출석 현황 */}
        <section>
          <SectionTitle icon={Calendar} title="이번 달 출석" />
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold font-mono text-white">
                  {attendanceCount}
                  <span className="text-lg text-zinc-500 ml-1">/ {daysInMonth}일</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  출석률{" "}
                  <span className="text-amber-400 font-bold">
                    {Math.round((attendanceCount / daysInMonth) * 100)}%
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  획득 포인트
                </p>
                <p className="text-xl font-bold font-mono text-amber-400">
                  +{attendanceCount} P
                </p>
              </div>
            </div>
            {/* 출석 프로그레스 바 */}
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all"
                style={{ width: `${Math.min((attendanceCount / daysInMonth) * 100, 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* ⑤ 내 게시글 */}
        {posts.length > 0 && (
          <section>
            <SectionTitle icon={FileText} title="내 게시글" />
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/plaza/board/${post.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition group"
                  >
                    {post.category && (
                      <span className="text-[10px] font-bold font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                        {post.category}
                      </span>
                    )}
                    <p className="text-sm text-zinc-300 truncate flex-1 group-hover:text-white transition">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-600 shrink-0">
                      <Eye className="w-3 h-3" />
                      {post.view_count ?? 0}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-600 shrink-0">
                      {getRelativeTime(post.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-zinc-800">
                <Link
                  href="/plaza/board?mine=true"
                  className="text-[11px] font-mono text-zinc-500 hover:text-amber-400 transition"
                >
                  전체 보기 →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 게시글 없을 때 */}
        {posts.length === 0 && (
          <section>
            <SectionTitle icon={FileText} title="내 게시글" />
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
              <FileText className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-600">아직 작성한 글이 없어요</p>
              <Link
                href="/plaza/board/new"
                className="inline-block mt-3 text-xs font-bold text-amber-500 hover:text-amber-400 transition"
              >
                첫 글 작성하기 →
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-amber-500" />
      <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider font-mono">
        {title}
      </h2>
      <div className="flex-1 h-px bg-zinc-800 ml-1" />
    </div>
  );
}
