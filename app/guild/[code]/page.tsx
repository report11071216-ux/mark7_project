import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getAttendanceDate, calculateStreak } from "@/lib/attendance";
import { getLayoutWidgets, type ThemeWidget } from "@/lib/themes";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import StatsWidget from "@/components/guild/StatsWidget";
import RecentMembersWidget from "@/components/guild/RecentMembersWidget";
import NoticeWidget from "@/components/guild/NoticeWidget";
import GuildIntroWidget from "@/components/guild/GuildIntroWidget";
import PointRankingWidget from "@/components/guild/PointRankingWidget";
import GuardianWidget from "@/components/guild/GuardianWidget";
import RaidStatusWidget from "@/components/guild/RaidStatusWidget";
import OnlineMembersWidget from "@/components/guild/OnlineMembersWidget";
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
  ] = await Promise.all([
    supabase.from("attendances").select("attendance_date").eq("guild_id", guild.id).eq("user_id", user.id).order("attendance_date", { ascending: false }).limit(60),
    supabase.from("guild_members").select("user_id, points, role, joined_at, profiles(username, avatar_url, last_seen_at)").eq("guild_id", guild.id).order("joined_at", { ascending: false }),
    supabase.from("posts").select("id, title, created_at, is_notice").eq("guild_id", guild.id).order("is_notice", { ascending: false }).order("created_at", { ascending: false }).limit(5),
    supabase.from("raids").select("id, title, raid_date, raid_time, difficulty, max_members").eq("guild_id", guild.id).gte("raid_date", new Date().toISOString().split("T")[0]).order("raid_date", { ascending: true }).limit(5),
    supabase.from("guild_themes").select("layout_config, welcome_message").eq("guild_id", guild.id).maybeSingle(),
    supabase.from("guild_members").select("role").eq("guild_id", guild.id).eq("user_id", user.id).maybeSingle(),
  ]);

  const attendanceDates = (myAttendances ?? []).map((a) => a.attendance_date);
  const today = getAttendanceDate();
  const alreadyAttended = attendanceDates.includes(today);
  const streak = calculateStreak(attendanceDates);
  const totalAttendances = attendanceDates.length;

  const members = (allMembers ?? []) as any[];
  const isStaff = ["master", "submaster"].includes(myMembership?.role ?? "");

  const layoutConfig = (themeRow?.layout_config ?? {}) as {
    theme?: string;
    custom?: boolean;
    widgets?: ThemeWidget[];
  };
  const themeId = layoutConfig.theme ?? "conquest";
  const isCustom = layoutConfig.custom === true;
  const activeWidgets = getLayoutWidgets(layoutConfig);
  const allWidgets: ThemeWidget[] = layoutConfig.widgets ?? activeWidgets;

  const recentMembers = members.slice(0, 5).map((m) => ({
    user_id: m.user_id, points: m.points ?? 0,
    joined_at: m.joined_at, profiles: m.profiles ?? null,
  }));

  const rankingMembers = [...members]
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .map((m) => ({ user_id: m.user_id, points: m.points ?? 0, role: m.role, profiles: m.profiles ?? null }));

  const onlineMembers = members.map((m) => ({
    user_id: m.user_id,
    last_seen_at: m.profiles?.last_seen_at ?? null,
    profiles: m.profiles ? { username: m.profiles.username ?? null, avatar_url: m.profiles.avatar_url ?? null } : null,
  }));

  const noticePosts = (posts ?? []).map((p) => ({
    id: p.id, title: p.title, created_at: p.created_at,
    is_notice: p.is_notice ?? false, author: null,
  }));

  const raidList = (raids ?? []).map((r) => ({
    id: r.id, title: r.title, raid_date: r.raid_date,
    raid_time: r.raid_time ?? null, difficulty: r.difficulty ?? null,
    max_members: r.max_members ?? 8, members: [],
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            GUILD / {guild.code}
          </p>
          <h1 className="text-2xl font-bold">{guild.name}</h1>
          {guild.description && (
            <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{guild.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeWidgets.map((w) => {
            const cls = w.wide ? "md:col-span-2" : "";
            if (w.id === "attendance") return <div key={w.id} className={cls}><AttendanceWidget guildCode={guild.code} alreadyAttended={alreadyAttended} streak={streak} totalAttendances={totalAttendances} /></div>;
            if (w.id === "calendar") return <div key={w.id} className={cls}><MiniCalendar attendanceDates={attendanceDates} /></div>;
            if (w.id === "stats") return <div key={w.id} className={cls}><StatsWidget memberCount={guild.member_count ?? 0} maxMembers={(guild as any).max_members ?? 50} totalPoints={guild.total_points ?? 0} myAttendances={totalAttendances} streak={streak} /></div>;
            if (w.id === "recentMembers") return <div key={w.id} className={cls}><RecentMembersWidget members={recentMembers} /></div>;
            if (w.id === "notice") return <div key={w.id} className={cls}><NoticeWidget posts={noticePosts} guildCode={guild.code} /></div>;
            if (w.id === "guildIntro") return <div key={w.id} className={cls}><GuildIntroWidget guildName={guild.name} guildCode={guild.code} description={guild.description ?? null} welcomeMessage={themeRow?.welcome_message ?? null} logoUrl={(guild as any).logo_url ?? null} memberCount={guild.member_count ?? 0} maxMembers={(guild as any).max_members ?? 50} isRecruiting={(guild as any).is_recruiting ?? false} /></div>;
            if (w.id === "pointRanking") return <div key={w.id} className={cls}><PointRankingWidget members={rankingMembers} /></div>;
            if (w.id === "guardian") return <div key={w.id} className={cls}><GuardianWidget /></div>;
            if (w.id === "raidStatus") return <div key={w.id} className={cls}><RaidStatusWidget raids={raidList} guildCode={guild.code} /></div>;
            if (w.id === "onlineMembers") return <div key={w.id} className={cls}><OnlineMembersWidget members={onlineMembers} /></div>;
            return null;
          })}
        </div>
      </div>

      {isStaff && (
        <ThemeSelector
          guildId={guild.id}
          guildCode={guild.code}
          currentThemeId={themeId}
          currentWidgets={allWidgets}
          isCustom={isCustom}
        />
      )}
    </div>
  );
}
