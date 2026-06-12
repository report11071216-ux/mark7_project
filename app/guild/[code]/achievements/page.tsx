import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import AchievementsBoard from "@/components/guild/AchievementsBoard";

export const revalidate = 0;

export default async function AchievementsPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: guild } = await supabase
    .from("guilds")
    .select("id, code, name, member_count, total_exp, total_points")
    .eq("code", params.code)
    .maybeSingle();

  if (!guild) notFound();

  let myRole: string | null = null;
  let myPoints = 0;
  if (user) {
    const { data: membership } = await supabase
      .from("guild_members")
      .select("role, points")
      .eq("guild_id", guild.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myRole = membership?.role ?? null;
    myPoints = membership?.points ?? 0;
  }

  const { count: attendanceCount } = await supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .eq("guild_id", guild.id);

  const { data: claims } = await supabase
    .from("guild_achievement_claims")
    .select("achievement_key")
    .eq("guild_id", guild.id);

  const claimedKeys = (claims ?? []).map((c) => c.achievement_key as string);

  const current = {
    memberCount: guild.member_count ?? 0,
    attendanceCount: attendanceCount ?? 0,
    totalExp: guild.total_exp ?? 0,
  };

  const canClaim = myRole === "master" || myRole === "submaster";
  const isMember = myRole !== null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-5">
          <p className="text-[11px] font-mono text-violet-600 uppercase tracking-[0.15em] mb-1">GUILD ACHIEVEMENTS</p>
          <h1 className="text-2xl font-bold text-slate-900">길드 업적</h1>
          <p className="text-sm text-slate-500 mt-1">
            목표를 달성하고 마스터·부마스터가 보상을 수령하세요
          </p>
        </div>

        <AchievementsBoard
          guildId={guild.id}
          guildCode={guild.code}
          achievements={ALL_ACHIEVEMENTS}
          current={current}
          claimedKeys={claimedKeys}
          canClaim={canClaim}
          guildPoints={guild.total_points ?? 0}
          myPoints={myPoints}
          isMember={isMember}
        />
      </div>
    </div>
  );
}
