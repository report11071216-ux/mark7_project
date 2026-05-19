import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ThemeEditForm from "@/components/ThemeEditForm";
import GuildInfoEditForm from "@/components/GuildInfoEditForm";
import MemberManageList from "@/components/MemberManageList";

type Props = {
  params: { code: string };
  searchParams: { tab?: string };
};

const VALID_TABS = ["theme", "info", "members"] as const;
type TabKey = (typeof VALID_TABS)[number];

export default async function GuildAdminPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const code = params.code.toUpperCase();
  const tab: TabKey = VALID_TABS.includes(searchParams.tab as TabKey)
    ? (searchParams.tab as TabKey)
    : "theme";

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 길드 찾기
  const { data: guild } = await supabase
    .from("guilds")
    .select(
      "id, name, code, master_id, description, max_members, is_recruiting, member_count"
    )
    .eq("code", code)
    .maybeSingle();

  if (!guild) {
    notFound();
  }

  // 마스터 권한 체크
  if (guild.master_id !== user.id) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            <div className="mb-4 text-5xl">🔒</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              접근 권한 없음
            </h1>
            <p className="mb-6 text-gray-600">
              이 페이지는 길드 마스터만 접근할 수 있어요.
            </p>
            <Link
              href={`/g/${code}`}
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              길드 페이지로 돌아가기
            </Link>
          </div>
        </main>
      </>
    );
  }

  // 탭별 데이터 조회 (필요한 탭의 데이터만)
  let theme = null;
  let members: Member[] = [];

  if (tab === "theme") {
    const { data } = await supabase
      .from("guild_themes")
      .select("primary_color, background_color, banner_url, welcome_message")
      .eq("guild_id", guild.id)
      .maybeSingle();
    theme = data;
  }

  if (tab === "members") {
    const { data } = await supabase
      .from("guild_members")
      .select(
        `
        user_id,
        role,
        points,
        joined_at,
        profiles (
          username,
          avatar_url
        )
      `
      )
      .eq("guild_id", guild.id)
      .order("role", { ascending: true }) // master 먼저
      .order("points", { ascending: false });

    members = ((data as any[]) || []).map((m) => ({
      user_id: m.user_id,
      username: m.profiles?.username || "Unknown",
      avatar_url: m.profiles?.avatar_url || null,
      role: m.role,
      points: m.points,
      joined_at: m.joined_at,
    }));
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "theme", label: "🎨 꾸미기" },
    { key: "info", label: "📝 길드 정보" },
    { key: "members", label: "👥 멤버 관리" },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                <Link
                  href={`/g/${code}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  ← {guild.name}
                </Link>
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                ⚙️ 관리자 패널
              </h1>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
              👑 마스터
            </span>
          </div>

          {/* 탭 */}
          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={
                  t.key === "theme"
                    ? `/g/${code}/admin`
                    : `/g/${code}/admin?tab=${t.key}`
                }
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold transition ${
                  tab === t.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="rounded-2xl bg-white p-6 shadow sm:p-8">
            {tab === "theme" && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    길드 페이지 디자인
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    색상, 배너, 환영 메시지를 자유롭게 꾸며보세요.
                  </p>
                </div>
                <ThemeEditForm
                  guildId={guild.id}
                  guildCode={guild.code}
                  initialTheme={theme}
                />
              </>
            )}

            {tab === "info" && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    길드 기본 정보
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    이름·소개·인원·모집 상태를 수정할 수 있어요.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    ※ 길드 코드({guild.code})는 변경할 수 없습니다.
                  </p>
                </div>
                <GuildInfoEditForm
                  guildId={guild.id}
                  guildCode={guild.code}
                  currentMemberCount={guild.member_count}
                  initial={{
                    name: guild.name,
                    description: guild.description,
                    max_members: guild.max_members,
                    is_recruiting: guild.is_recruiting,
                  }}
                />
              </>
            )}

            {tab === "members" && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    멤버 관리 ({members.length}명)
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    멤버를 추방하거나 마스터 권한을 위임할 수 있어요.
                  </p>
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ 추방/위임은 되돌릴 수 없으니 신중히 결정하세요.
                  </p>
                </div>
                <MemberManageList
                  guildId={guild.id}
                  guildCode={guild.code}
                  currentUserId={user.id}
                  members={members}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// MemberManageList Props 타입과 맞추기 위한 로컬 타입
type Member = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  points: number;
  joined_at: string;
};
