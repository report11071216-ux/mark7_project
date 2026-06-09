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
    { data: latestPatch },
  ] = await Promise.all([
    supabase.from("guild_members").select("role").eq("guild_id", guild.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("username, avatar_url, equipped_mark_id, last_patch_seen_at").eq("id", user.id).maybeSingle(),
    supabase.from("guild_themes").select("equipped_mark_id, primary_color, background_color").eq("guild_id", guild.id).maybeSingle(),
    supabase.from("guild_members").select("user_id, profiles(id, username, avatar_url)").eq("guild_id", guild.id),
    supabase.from("guild_messages").select("id, user_id, content, created_at").eq("guild_id", guild.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("patch_notes").select("created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(1),
  ]);

  if (!membership) {
    redirect("/onboarding/join");
  }

  // 접속 시각 갱신 (온라인 판정용) — await 안 함: 렌더를 막지 않게 백그라운드 처리
  supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id)
    .then(() => {});

  // 길드 마크 + 개인 마크 purchase를 한 번에 조회 (순차 4연속 → 병렬 2단계)
  const guildMarkPurchaseId = themeRow?.equipped_mark_id ?? null;
  const userMarkPurchaseId = profile?.equipped_mark_id ?? null;
  const markPurchaseIds = Array.from(
    new Set([guildMarkPurchaseId, userMarkPurchaseId].filter(Boolean))
  ) as string[];

  let guildLogoUrl = guild.logo_url;
  let userAvatarUrl = profile?.avatar_url ?? null;

  if (markPurchaseIds.length > 0) {
    const { data: purchaseRows } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", markPurchaseIds);

    const itemIds = Array.from(
      new Set((purchaseRows ?? []).map((p) => p.item_id).filter(Boolean))
    ) as string[];

    let itemImageMap = new Map<string, string | null>();
    if (itemIds.length > 0) {
      const { data: itemRows } = await supabase
        .from("shop_items")
        .select("id, image_url")
        .in("id", itemIds);
      itemImageMap = new Map((itemRows ?? []).map((it) => [it.id, it.image_url]));
    }

    const purchaseToItem = new Map((purchaseRows ?? []).map((p) => [p.id, p.item_id]));

    if (guildMarkPurchaseId) {
      const itemId = purchaseToItem.get(guildMarkPurchaseId);
      const img = itemId ? itemImageMap.get(itemId) : null;
      if (img) guildLogoUrl = img;
    }
    if (userMarkPurchaseId) {
      const itemId = purchaseToItem.get(userMarkPurchaseId);
      const img = itemId ? itemImageMap.get(itemId) : null;
      if (img) userAvatarUrl = img;
    }
  }

  const primaryColor = themeRow?.primary_color ?? "#7c3aed";
  const backgroundColor = themeRow?.background_color ?? "#09090b";

  // 신규 패치노트 여부 (최신 글 시각 > 내가 마지막으로 본 시각)
  const latestPatchAt = latestPatch?.[0]?.created_at ?? null;
  const lastSeenAt = profile?.last_patch_seen_at ?? null;
  const hasNewPatch = latestPatchAt
    ? !lastSeenAt || new Date(latestPatchAt).getTime() > new Date(lastSeenAt).getTime()
    : false;

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
        hasNewPatch={hasNewPatch}
      />
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
