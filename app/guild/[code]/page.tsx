import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getAttendanceDate, calculateStreak } from "@/lib/attendance";
import { getLayoutWidgets, getTheme, type ThemeWidget } from "@/lib/themes";
import { type GuildLayoutData } from "@/lib/guild-layout-types";
import NaverCafeLayout from "@/components/guild/layouts/NaverCafeLayout";
import DiscordLayout from "@/components/guild/layouts/DiscordLayout";
import NotionLayout from "@/components/guild/layouts/NotionLayout";
import SteamLayout from "@/components/guild/layouts/SteamLayout";
import ThemeSelector from "@/components/guild/ThemeSelector";

type Props = { params: { code: string } };

export default async function GuildHomePage({ params }: Props) {
  const supabase = await createClient();
  const code = params.code.toUpperCase();

  const [{ data: { user } }, { data: guild }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("guilds")
      .select("id, name, code, description, total_points, member_count, max_members, logo_url, is_recruiting")
      .eq("code", code)
      .single(),
  ]);

  if (!user || !guild) notFound();

  const [
    { data: myAttendances },
    { data: allMembers },
    { data: posts },
    { data: raids },
    { data: themeRow },
    { data: myMembership },
    indexResult,
    imagesResult,
    weaknessesResult,
  ] = await Promise.all([
    supabase.from("attendances").select("attendance_date").eq("guild_id", guild.id).eq("user_id", user.id).order("attendance_date", { ascending: false }).limit(60),
    supabase.from("guild_members").select("user_id, points, role, joined_at, profiles(username, avatar_url, last_seen_at)").eq("guild_id", guild.id).order("joined_at", { ascending: false }),
    supabase.from("posts").select("id, title, created_at, is_notice, author:profiles(username)").eq("guild_id", guild.id).order("is_notice", { ascending: false }).order("created_at", { ascending: false }).limit(5),
    supabase.from("raids").select("id, title, raid_date, raid_time, difficulty, max_members").eq("guild_id", guild.id).gte("raid_date", new Date().toISOString().split("T")[0]).order("raid_date", { ascending: true }).limit(5),
    supabase.from("guild_themes").select("layout_config, welcome_message, primary_color, background_color, banner_url").eq("guild_id", guild.id).maybeSingle(),
    supabase.from("guild_members").select("role").eq("guild_id", guild.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_settings").select("value").eq("key", "c
