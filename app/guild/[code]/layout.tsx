import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/guild/Sidebar";
import GuildChatDock from "@/components/guild/GuildChatDock";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { code: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/guild/${params.code}`);
  }
  const upperCode = params.code.toUpperCase();
  const { data: guild, error: guildError } = await supabase
    .from("guilds")
    .select("id, code, name, logo_url, member_count")
    .eq("code", upperCode)
    .maybeSingle();
  if (guildError || !guild) notFound();

  const [
    { data: membership },
    { data: profile },
    { data: themeRow },
    { data: rawMembers },
    { data: rawMessages },
  ] = await Promise.all([
    supabase.from("guild_members").select("role").eq("guild_id", guild.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("username, avatar_url, equipped_mark_id").eq("id", user.id).maybeSingle(),
    supabase.from("guild_themes").select("equipped_mark_id, primary_color, background_color").eq("guild_id", guild.id).maybeSingle(),
    supabase.from("guild_members").select("user_id, profiles(id, username, avatar_url)").eq("guild_id", guild.id),
    supabase.from("guild_messages").select("id, user_id, content, created_at").eq("guild_id", guild.id).order("created_at", { ascending: false }).limit(50),
  ]);

  if (!membership) {
    redirect("/onboarding/join");
  }

  // 접속 시각 갱신 (온라인 멤버 판정용)
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  // 장착한 길드 마크 이미지 찾기 (없으면 원래 logo_url)
  let guildLogoUrl = guild.logo_url;
  if (themeRow?.equipped_mark_id) {
    const { data: guildMarkPurchase } = await supabase
      .from("purchases")
      .select("item_id")
      .eq("id", themeRow.equipped_mark_id)
      .maybeSingle();
    if (guildMarkPurchase?.item_id) {
      const { data: markItem } = await supabase
        .from("shop_items")
        .select("image_url")
        .eq("id", guildMarkPurchase.item_id)
        .maybeSingle();
      if (markItem?.image_url) {
        guildLogoUrl = markItem.image_url;
      }
    }
  }

  // 장착한 개인 마크 이미지 찾기 (없으면 디스코드 아바타)
  let userAvatarUrl = profile?.avatar_url ?? null;
  if (profile?.equipped_mark_id) {
    const { data: markPurchase } = await supabase
      .from("purchases")
      .select("item_id")
      .eq("id", profile.equipped_mark_id)
      .maybeSingle();
    if (markPurchase?.item_id) {
      const { data: markItem } = await supabase
        .from("shop_items")
        .select("image_url")
        .eq("id", markPurchase.item_id)
        .maybeSingle();
      if (markItem?.image_url) {
        userAvatarUrl = markItem.image_url;
      }
    }
  }

  const primaryColor = themeRow?.primary_color ?? "#7c3aed";
  const backgroundColor = themeRow?.background_color ?? "#09090b";

  const chatMembers = (rawMembers ?? []).map((m: any) => ({
    user_id: m.user_id,
    username: m.profiles?.username ?? "익명",
    avatar_url: m.profiles?.avatar_url ?? null,
  }));

  const chatMessages = (rawMessages ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      id: m.id,
      user_id: m.user_id,
      content: m.content,
      created_at: m.created_at,
    }));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        guildCode={guild.code}
        guildName={guild.name}
        guildLogoUrl={guildLogoUrl}
        memberCount={guild.member_count ?? 0}
        userRole={membership.role}
        userName={profile?.username ?? "익명"}
        userAvatarUrl={userAvatarUrl}
        primaryColor={primaryColor}
        backgroundColor={backgroundColor}
      />
      {/* 모바일: 상단 헤더(56px) + 하단 탭(60px) 여백, 데스크탑: 여백 없음 */}
      <main className="flex-1 overflow-x-hidden pt-14 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>

      <GuildChatDock
        guildId={guild.id}
        guildCode={guild.code}
        guildName={guild.name}
        currentUserId={user.id}
        members={chatMembers}
        initialMessages={chatMessages}
        primaryColor={primaryColor}
        backgroundColor={backgroundColor}
      />
    </div>
  );
}
