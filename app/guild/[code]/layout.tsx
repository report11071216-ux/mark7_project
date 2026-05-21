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

  // 1. 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/guild/${params.code}`);
  }

  const upperCode = params.code.toUpperCase();

  // 2. 길드 조회 (한 번만)
  const { data: guild, error: guildError } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count")
    .eq("code", upperCode)
    .maybeSingle();

  if (guildError || !guild) notFound();

  // 3. membership + profile 병렬 조회
  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from("guild_members")
      .select("role")
      .eq("guild_id", guild.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!membership) {
    redirect("/onboarding/join");
  }

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
