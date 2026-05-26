import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RaidEntryForm from "@/components/guild/RaidEntryForm";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function NewRaidPage({ params }: Props) {
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
  if (!isStaff) notFound();

  return <RaidEntryForm guildCode={guild.code} guildName={guild.name} />;
}
