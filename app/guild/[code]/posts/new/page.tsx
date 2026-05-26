import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuildPostForm from "@/components/guild/GuildPostForm";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function NewGuildPostPage({ params }: Props) {
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

  const isStaff = membership.role === "master" || membership.role === "submaster";

  return (
    <GuildPostForm
      guildCode={guild.code}
      guildName={guild.name}
      isStaff={isStaff}
    />
  );
}
