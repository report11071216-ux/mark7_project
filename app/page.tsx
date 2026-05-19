import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PostList from "@/components/PostList";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 길드 랭킹 Top 5
  const { data: topGuilds } = await supabase
    .from("guilds")
    .select("id, name, code, total_points, member_count")
    .order("total_points", { ascending: false })
    .limit(5);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 좌측 + 가운데: 광장 (게시판) */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    🏛️ 광장
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    모든 길드원들의 자유 게시판
                  </p>
                </div>
                {user && (
                  <Link
                    href="/posts/new"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    ✏️ 글쓰기
                  </Link>
                )}
              </div>

              <PostList />
            </div>

            {/* 우측: 사이드바 */}
            <aside className="space-y-4">
              {/* 로그인 안 했으면 로그인 카드 */}
              {!user ? (
                <div className="rounded-2xl bg-white p-6 shadow">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">
                    👋 환영합니다
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    로그인하고 길드에 참여하세요
                  </p>
                  <LoginButton />
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-6 shadow">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">
                    🏰 내 길드
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/guild/create"
                      className="block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      + 길드 만들기
                    </Link>
                    <Link
                      href="/guild/join"
                      className="block rounded-lg border-2 border-blue-600 px-4 py-2 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      🎟️ 코드로 입장
                    </Link>
                    <Link
                      href="/my-guilds"
                      className="block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      내 길드 목록 →
                    </Link>
                  </div>
                </div>
              )}

              {/* 길드 랭킹 Top 5 */}
              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    🏆 랭킹 Top 5
                  </h3>
                  <Link
                    href="/ranking"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    전체보기 →
                  </Link>
                </div>
                {topGuilds && topGuilds.length > 0 ? (
                  <div className="space-y-2">
                    {topGuilds.map((g, i) => (
                      <Link
                        key={g.id}
                        href={`/g/${g.code}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50"
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : i === 1
                              ? "bg-gray-200 text-gray-700"
                              : i === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {g.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ⭐ {g.total_points.toLocaleString()}P
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-gray-500">
                    아직 등록된 길드가 없어요
                  </p>
                )}
              </div>

              {/* 정보 카드 */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white shadow">
                <h3 className="mb-2 text-lg font-bold">
                  🎮 길드패스란?
                </h3>
                <p className="text-sm opacity-90">
                  로스트아크 길드를 위한 올인원 플랫폼.
                  나만의 길드 페이지를 만들고 멤버들과 함께 성장하세요.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
