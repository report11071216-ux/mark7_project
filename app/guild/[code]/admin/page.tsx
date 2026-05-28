import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GuildAppearanceEditor from "@/components/guild/GuildAppearanceEditor";
import DeleteGuildSection from "@/components/guild/DeleteGuildSection";
import WebhookSettings from "@/components/guild/WebhookSettings";

export default async function GuildAdminPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: guild } = await supabase
    .from("guilds")
    .select("id, code, name, discord_webhook_url")
    .eq("code", code)
    .maybeSingle();
  if (!guild) notFound();
  const { data: member } = await supabase
    .from("guild_members")
    .select("role")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !["master", "submaster"].includes(member.role)) {
    redirect(`/guild/${code}`);
  }
  const isMaster = member.role === "master";
  const { data: theme } = await supabase
    .from("guild_themes")
    .select("primary_color, background_color, welcome_message, banner_url")
    .eq("guild_id", guild.id)
    .maybeSingle();
  return (
    <>
      <GuildAppearanceEditor
        guildId={guild.id}
        guildCode={guild.code}
        initialPrimary={theme?.primary_color ?? "#7c3aed"}
        initialBg={theme?.background_color ?? "#09090b"}
        initialWelcome={theme?.welcome_message ?? ""}
        initialBanner={theme?.banner_url ?? ""}
      />
      <div className="mt-6">
        <WebhookSettings
          guildId={guild.id}
          initialUrl={guild.discord_webhook_url ?? ""}
        />
      </div>
      {isMaster ? (
        <DeleteGuildSection
          guildId={guild.id}
          guildCode={guild.code}
          guildName={guild.name}
        />
      ) : null}
    </>
  );
}
