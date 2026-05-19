import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ThemeEditForm from "@/components/ThemeEditForm";

type Props = {
  params: { code: string };
};

export default async function GuildAdminPage({ params }: Props) {
  const supabase = createClient();
  const code = params.code.toUpperCase();

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
    .select("id, name, code, master_id")
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

  // 테마 정보 가져오기
  const { data: theme } = await supabase
    .from("guild_themes")
    .select("primary_color, background_color, banner_url, welcome_message")
    .eq("guild_id", guild.id)
    .maybeSingle();

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

          {/* 탭 (7-B에서 활성화) */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button className="border-b-2 border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600">
              🎨 길드 꾸미기
            </button>
            <button
              disabled
              className="cursor-not-allowed px-4 py-2 text-sm text-gray-400"
              title="7-B에서 추가 예정"
            >
              📝 길드 정보 (준비 중)
            </button>
            <button
              disabled
              className="cursor-not-allowed px-4 py-2 text-sm text-gray-400"
              title="7-B에서 추가 예정"
            >
              👥 멤버 관리 (준비 중)
            </button>
          </div>

          {/* 테마 편집 카드 */}
          <div className="rounded-2xl bg-white p-6 shadow sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                길드 페이지 디자인
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                색상, 배너, 환영 메시지를 자유롭게 꾸며보세요. 저장하면 길드
                페이지에 바로 반영돼요.
              </p>
            </div>

            <ThemeEditForm
              guildId={guild.id}
              guildCode={guild.code}
              initialTheme={theme}
            />
          </div>
        </div>
      </main>
    </>
  );
}
