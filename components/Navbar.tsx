import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { LayoutGrid, Trophy, Castle, LogIn, ShieldCheck } from "lucide-react";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase
        .from("profiles")
        .select("username, avatar_url, is_platform_admin")
        .eq("id", user.id)
        .single()
      ).data
    : null;

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
        >
          <span className="text-[10px] font-mono text-blue-600 uppercase tracking-[0.2em]">
            GUILDPASS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/plaza"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            광장
          </Link>
          <Link
            href="/ranking"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            랭킹
          </Link>
          {user && (
            <Link
              href="/my-guilds"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Castle className="w-3.5 h-3.5" />
              내 길드
            </Link>
          )}
          {profile?.is_platform_admin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              관리자
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="프로필"
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {(profile?.username ?? "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-xs font-bold text-slate-700">
                  {profile?.username ?? "User"}
                </span>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
