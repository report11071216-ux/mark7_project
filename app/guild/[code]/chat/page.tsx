import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildChatRoom, { type ChatMessage, type ChatMember } from "@/components/guild/GuildChatRoom";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function GuildChatPage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();

  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("guilds").select("id, name, code").eq("code", code).single(),
  ]);
  if (!user || !guild) notFound();

  const { data: membership } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();

  const [{ data: rawMembers }, { data: rawMessages }] = await Promise.all([
    supabase
      .from("guild_members")
      .select("user_id, profiles(username, avatar_url)")
      .eq("guild_id", guild.id),
    supabase
      .from("guild_messages")
      .select("id, user_id, content, created_at")
      .eq("guild_id", guild.id)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  const members: ChatMember[] = (rawMembers ?? []).map((m: any) => ({
    user_id: m.user_id,
    username: m.profiles?.username ?? "익명",
    avatar_url: m.profiles?.avatar_url ?? null,
  }));

  const messages: ChatMessage[] = (rawMessages ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
  }));

  return (
    <GuildChatRoom
      guildId={guild.id}
      guildCode={guild.code}
      guildName={guild.name}
      currentUserId={user.id}
      members={members}
      initialMessages={messages}
    />
  );
}
