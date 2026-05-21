import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/guild/Sidebar";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { code: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/guild/${params.code}`);
  }

  // 길드 조회
  const { data: guild, error: guildError } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count")
    .eq("code", params.code.toUpperCase())
    .maybeSingle();

  if (guildError || !guild) {
    notFound();
  }

  // 사용자가 이 길드 멤버인지 확인
  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    // 멤버가 아니면 온보딩으로 (길드 코드 입력 권유)
    redirect("/onboarding/join");
  }

  // 사용자 프로필 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        guildCode={guild.code}
        guildName={guild.name}
        guildLogoUrl={guild.logo_url}
        memberCount={guild.member_count ?? 0}
        userRole={membership.role}
        userName={profile?.username ?? "익명"}
        userAvatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
