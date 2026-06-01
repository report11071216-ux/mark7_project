import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GuildAppearanceEditor from "@/components/guild/GuildAppearanceEditor";
import DeleteGuildSection from "@/components/guild/DeleteGuildSection";
import WebhookSettings from "@/components/guild/WebhookSettings";
import CardStyleSelector from "@/components/guild/CardStyleSelector";
import GuildGrowthPanel from "@/components/guild/GuildGrowthPanel";
import type { WebhookSettingsInput } from "@/app/actions/guild-actions";

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
    .select("id, code, name, notification_settings, total_points, total_exp, max_members, vault_slots")
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
  const isStaff = member.role === "master" || member.role === "submaster";
  const { data: theme } = await supabase
    .from("guild_themes")
    .select("primary_color, background_color, welcome_message, banner_url, card_style, equipped_background_url")
    .eq("guild_id", guild.id)
    .maybeSingle();

  const ns = (guild.notification_settings ?? {}) as any;
  const webhookInitial: WebhookSettingsInput = {
    default_url: ns.default_url ?? "",
    notice: {
      url: ns.notice?.url ?? "",
      enabled: ns.notice?.enabled !== false,
    },
    raid: {
      url: ns.raid?.url ?? "",
      enabled: ns.raid?.enabled !== false,
    },
    welcome: {
      url: ns.welcome?.url ?? "",
      enabled: ns.welcome?.enabled !== false,
    },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* 길드 성장 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">GUILD GROWTH</p>
          <GuildGrowthPanel
            guildCode={guild.code}
            totalPoints={guild.total_points ?? 0}
            totalExp={guild.total_exp ?? 0}
            maxMembers={guild.max_members ?? 20}
            vaultSlots={guild.vault_slots ?? 0}
            isStaff={isStaff}
          />
        </div>
      </div>

      <GuildAppearanceEditor
        guildId={guild.id}
        guildCode={guild.code}
        initialPrimary={theme?.primary_color ?? "#7c3aed"}
        initialBg={theme?.background_color ?? "#09090b"}
        initialWelcome={theme?.welcome_message ?? ""}
        initialBanner={theme?.banner_url ?? ""}
      />
      <div className="max-w-2xl mx-auto px-6 space-y-6 pb-8">
        <CardStyleSelector
          guildId={guild.id}
          guildCode={guild.code}
          initialStyle={theme?.card_style ?? "solid"}
          hasBackground={!!theme?.equipped_background_url}
        />
        <WebhookSettings guildId={guild.id} initial={webhookInitial} />
        {isMaster ? (
          <DeleteGuildSection
            guildId={guild.id}
            guildCode={guild.code}
            guildName={guild.name}
          />
        ) : null}
      </div>
    </div>
  );
}
