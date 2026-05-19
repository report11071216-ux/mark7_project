import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import PostList from "@/components/PostList";
import AttendanceButton from "@/components/AttendanceButton";

type Props = {
  params: { code: string };
};

// KST 기준 오늘 날짜 (서버용)
function getKstToday(): string {
  const now = new Date();
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffsetMs);
  return kstNow.toISOString().split("T")[0];
}

export default async function GuildHomePage({ params }: Props) {
  const supabase = createClient();
  const code = params.code.toUpperCase();

  // 길드 정보
  const { data: guild } = await supabase
    .from("guilds")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (!guild) {
    notFound();
  }

  // 길드 테마
  const { data: theme } = await supabase
    .from("guild_themes")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  // 현재 사용자
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 멤버십 정보 (role + 포인트)
  let myRole: string | null = null;
  let myPoints = 0;
  if (user) {
    const { data: membership } = await supabase
      .from("guild_members")
      .select("role, points")
      .eq("guild_id", guild.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myRole = membership?.role || null;
    myPoints = membership?.points || 0;
  }

  // 오늘 출석 여부 (멤버일 때만)
  let alreadyCheckedIn = false;
  if (user && myRole) {
    const today = getKstToday();
    const { data: todayAttendance } = await supabase
      .from("attendances")
      .select("id")
      .eq("guild_id", guild.id)
      .eq("user_id", user.id)
      .eq("attendance_date", today)
      .maybeSingle();
    alreadyCheckedIn = !!todayAttendance;
  }

  // 멤버 목록 (포인트 순)
  const { data: members } = await supabase
    .from("guild_members")
    .select(
      `
      role,
      points,
      joined_at,
      profiles (
        id,
        username,
        avatar_url
      )
    `
    )
    .eq("guild_id", guild.id)
    .order("points", { ascending: false });

  const primaryColor = theme?.primary_color || "#3b82f6";
  const bgColor = theme?.background_color || "#ffffff";
  const isMaster = myRole === "master";
  const isMember = !!myRole;

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ backgroundColor: bgColor }}>
        {/* 길드 헤더 (배너) */}
        <div
          className="relative h-48"
          style={{
            background: theme?.banner_url
              ? `url(${theme.banner_url}) center/cover`
              : `linear-gradient(135deg, ${primaryColor}, #8b5cf6)`,
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-6">
            <div className="flex items-end gap-4">
              {guild.logo_url ? (
                <img
                  src={guild.logo_url}
                  alt={guild.name}
                  className="h-20 w-20 rounded-2xl border-4 border-white object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white text-4xl">
                  🏰
                </div>
              )}
              <div className="text-white">
                <h1 className="text-3xl font-bold">{guild.name}</h1>
                <p className="text-sm opacity-90">코드: {guild.code}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* 상단 정보 바 */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow">
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-gray-500">총 포인트</div>
                <div className="text-lg font-bold text-blue-600">
                  ⭐ {guild.total_points.toLocaleString()}P
                </div>
              </div>
              <div>
                <div className="text-gray-500">멤버</div>
                <div className="text-lg font-bold text-gray-900">
                  👥 {guild.member_count} / {guild.max_members}명
                </div>
              </div>
              <div>
                <div className="text-gray-500">모집</div>
                <div className="text-lg font-bold text-gray-900">
                  {guild.is_recruiting ? "✅ 모집중" : "❌ 마감"}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isMaster && (
                <Link
                  href={`/g/${guild.code}/admin`}
                  className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600"
                >
                  ⚙️ 관리자 패널
                </Link>
              )}
              {!isMember && user && (
                <Link
                  href="/guild/join"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  🎟️ 가입하기
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* 좌측: 소개 + 게시판 */}
            <div className="space-y-6 lg:col-span-2">
              {/* 길드 소개 */}
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  📜 길드 소개
                </h2>
                {theme?.welcome_message && (
                  <div
                    className="mb-4 rounded-lg p-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <p className="whitespace-pre-wrap text-gray-700">
                      {theme.welcome_message}
                    </p>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-gray-700">
                  {guild.description || "아직 소개글이 없습니다."}
                </p>
              </div>

              {/* 길드 게시판 */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    📋 길드 게시판
                  </h2>
                  {isMember && (
                    <Link
                      href={`/posts/new?guild=${guild.code}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      ✏️ 글쓰기
                    </Link>
                  )}
                </div>

                {isMember ? (
                  <PostList guildId={guild.id} />
                ) : (
                  <div className="rounded-xl bg-white p-12 text-center shadow">
                    <div className="mb-3 text-5xl">🔒</div>
                    <p className="text-gray-600">
                      길드 게시판은 멤버만 볼 수 있어요
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 출석체크 + 멤버 목록 */}
            <div className="space-y-6">
              {/* 출석체크 (멤버일 때만) */}
              {isMember && user && (
                <AttendanceButton
                  guildId={guild.id}
                  userId={user.id}
                  alreadyCheckedIn={alreadyCheckedIn}
                  myPoints={myPoints}
                />
              )}

              {/* 멤버 목록 */}
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  👥 멤버 ({members?.length || 0})
                </h2>
                <div className="space-y-3">
                  {members?.map((m: any) => (
                    <div
                      key={m.profiles.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {m.profiles.avatar_url ? (
                          <img
                            src={m.profiles.avatar_url}
                            alt={m.profiles.username}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                            👤
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {m.profiles.username}
                            {m.role === "master" && " 👑"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {m.points}P
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
