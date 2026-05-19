import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* 왼쪽: 로고 */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-900 hover:text-blue-600"
        >
          🎮 길드패스
        </Link>

        {/* 가운데: 메뉴 */}
        <div className="hidden gap-6 md:flex">
          <Link
            href="/"
            className="text-gray-700 hover:text-blue-600"
          >
            🏛️ 광장
          </Link>
          <Link
            href="/ranking"
            className="text-gray-700 hover:text-blue-600"
          >
            🏆 랭킹
          </Link>
          {user && (
            <Link
              href="/my-guilds"
              className="text-gray-700 hover:text-blue-600"
            >
              🏰 내 길드
            </Link>
          )}
        </div>

        {/* 오른쪽: 프로필 / 로그인 */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                {profile?.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt="프로필"
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                  {profile?.username || "User"}
                </span>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-[#5865F2] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#4752C4]"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
