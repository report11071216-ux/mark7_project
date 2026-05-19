import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PostList from "@/components/PostList";
import CategoryTabs from "@/components/CategoryTabs";
import LoginButton from "@/components/LoginButton";
import TopGuildsWidget from "@/components/TopGuildsWidget";

type Props = {
  searchParams: { category?: string };
};

export default async function Home({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const category = searchParams.category;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 좌측 + 가운데: 광장 */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    🏛️ 광장
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    누구나 자유롭게 소통하는 곳, 길드원을 모집하세요
                  </p>
                </div>
                {user ? (
                  <Link
                    href="/posts/new"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    ✏️ 글쓰기
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    로그인하고 글쓰기
                  </Link>
                )}
              </div>

              {/* 카테고리 탭 (Suspense로 감쌈) */}
              <Suspense fallback={<div className="mb-4 h-10" />}>
                <CategoryTabs />
              </Suspense>

              <PostList category={category} />
            </div>

            {/* 우측: 사이드바 */}
            <aside className="space-y-4">
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

              {/* 🏆 Top 길드 위젯 (6-C) */}
              <TopGuildsWidget />

              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white shadow">
                <h3 className="mb-2 text-lg font-bold">🎮 길드패스란?</h3>
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
