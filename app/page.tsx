import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LoginButton from "@/components/LoginButton";
import Navbar from "@/components/Navbar";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-bold text-gray-900">
              🎮 길드 플랫폼
            </h1>
            <p className="mb-12 text-xl text-gray-600">
              로스트아크 길드를 위한 최고의 플랫폼
            </p>

            {user ? (
              <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
                <p className="mb-6 text-lg text-gray-700">
                  안녕하세요,{" "}
                  <span className="font-bold text-blue-600">
                    {user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email}
                  </span>{" "}
                  님!
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/guild/create"
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    🏰 길드 만들기
                  </Link>
                  <Link
                    href="/guild/join"
                    className="rounded-lg border-2 border-blue-600 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    🎟️ 코드로 길드 입장
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <p className="mb-6 text-gray-700">
                  시작하려면 로그인해주세요
                </p>
                <div className="flex justify-center">
                  <LoginButton />
                </div>
              </div>
            )}
          </div>

          {/* 임시: 기능 안내 카드들 */}
          <div className="mt-20 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="mb-3 text-4xl">⚔️</div>
              <h3 className="mb-2 text-lg font-bold">길드 경쟁</h3>
              <p className="text-sm text-gray-600">
                포인트로 길드 간 순위를 겨뤄보세요
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="mb-3 text-4xl">🎨</div>
              <h3 className="mb-2 text-lg font-bold">나만의 길드 페이지</h3>
              <p className="text-sm text-gray-600">
                관리자 패널로 자유롭게 꾸미세요
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="mb-3 text-4xl">🔥</div>
              <h3 className="mb-2 text-lg font-bold">로스트아크 연동</h3>
              <p className="text-sm text-gray-600">
                캐릭터 정보 자동 동기화
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
