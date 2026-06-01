import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GuildAppearanceEditor from "@/components/guild/GuildAppearanceEditor";
import DeleteGuildSection from "@/components/guild/DeleteGuildSection";
import WebhookSettings from "@/components/guild/WebhookSettings";
import CardStyleSelector from "@/components/guild/CardStyleSelector";
import RecruitEditor from "@/components/guild/RecruitEditor";
import { Megaphone } from "lucide-react";
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
    .select("id, code, name, notification_settings, is_recruiting, description, recruit_tags, recruit_discord_url, recruit_message")
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

  const recruitInitial = {
    isRecruiting: guild.is_recruiting === true,
    description: guild.description ?? "",
    tags: (guild.recruit_tags ?? []) as string[],
    discordUrl: guild.recruit_discord_url ?? "",
    recruitMessage: guild.recruit_message ?? "",
  };

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

      {/* 모집 공고 */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">길드원 모집</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              모집 공고를 작성하면 광장 모집 게시판에 우리 길드가 노출돼요.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <RecruitEditor guildCode={guild.code} initial={recruitInitial} />
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${recruitInitial.isRecruiting ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
            {recruitInitial.isRecruiting ? "● 모집중" : "○ 모집 안 함"}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <CardStyleSelector
          guildId={guild.id}
          guildCode={guild.code}
          initialStyle={theme?.card_style ?? "solid"}
          hasBackground={!!theme?.equipped_background_url}
        />
      </div>
      <div className="mt-6">
        <WebhookSettings guildId={guild.id} initial={webhookInitial} />
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
