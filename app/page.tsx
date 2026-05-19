import { createClient } from "@/lib/supabase/server";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">
          🎮 길드 플랫폼
        </h1>
        <p className="mb-12 text-xl text-gray-600">
          로스트아크 길드를 위한 최고의 플랫폼
        </p>

        {user ? (
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <p className="text-lg text-gray-700">
              안녕하세요,{" "}
              <span className="font-bold text-blue-600">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email}
              </span>{" "}
              님!
            </p>
            <p className="mt-2 text-sm text-gray-500">
              로그인 성공! Supabase에 정보가 저장되었습니다.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <p className="mb-6 text-gray-700">시작하려면 로그인해주세요</p>
            <div className="flex justify-center">
              <LoginButton />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
