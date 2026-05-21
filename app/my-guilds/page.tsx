// app/my-guilds/page.tsx 교체
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import GuildCard from "@/components/GuildCard";

export default async function MyGuildsPage() {
  const supabase = await createClient(); // ← await 추가
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("guild_members")
    .select(
      `
      role,
      guilds (
        id,
        name,
        code,
        description,
        logo_url,
        total_points,
        member_count,
        max_members
      )
    `
    )
    .eq("user_id", user.id);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🏰 내 길드 목록
            </h1>
            <p className="mt-1 text-gray-600">
              내가 가입한 길드들을 확인하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/guild/create"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + 길드 만들기
            </Link>
            <Link
              href="/guild/join"
              className="rounded-lg border-2 border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              코드로 입장
            </Link>
          </div>
        </div>
        {memberships && memberships.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((m: any) => (
              <GuildCard
                key={m.guilds.id}
                guild={m.guilds}
                role={m.role}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center shadow">
            <div className="mb-4 text-6xl">🏜️</div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              아직 가입한 길드가 없어요
            </h2>
            <p className="mb-6 text-gray-600">
              새로운 길드를 만들거나 친구의 길드에 입장해보세요
            </p>
            <div className="flex justify-center gap-3">
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
                🎟️ 코드로 입장
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
