// app/guild/[code]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AttendanceWidget from "@/components/guild/AttendanceWidget";
import MiniCalendar from "@/components/guild/MiniCalendar";
import { Card } from "@/components/ui/card";
import { getAttendanceDate, calculateStreak } from "@/lib/attendance";
import { Users, TrendingUp, Calendar, Award } from "lucide-react";
import { formatNumber, getRelativeTime } from "@/lib/utils";

type Props = {
  params: { code: string };
};

export default async function GuildHomePage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // 길드 조회
  const { data: guild } = await supabase
    .from("guilds")
    .select("id, name, code, description, total_points, member_count, max_members")
    .eq("code", params.code)
    .single();
  if (!guild) notFound();

  // 내 출석 기록 (최근 60일)
  const { data: myAttendances } = await supabase
    .from("attendances")
    .select("attendance_date")
    .eq("guild_id", guild.id)
    .eq("user_id", user.id)
    .order("attendance_date", { ascending: false })
    .limit(60);

  const attendanceDates = (myAttendances ?? []).map((a) => a.attendance_date);
  const today = getAttendanceDate();
  const alreadyAttended = attendanceDates.includes(today);
  const streak = calculateStreak(attendanceDates);
  const totalAttendances = attendanceDates.length;

  // 최근 가입 멤버 5명
  const { data: recentMembers } = await supabase
    .from("guild_members")
    .select("user_id, points, joined_at, profiles(username, avatar_url)")
    .eq("guild_id", guild.id)
    .order("joined_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* 헤더 */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            GUILD / {guild.code}
          </p>
          <h1 className="text-2xl font-bold">{guild.name}</h1>
          {guild.description && (
            <p className="text-sm text-zinc-400 mt-1">{guild.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 통계 카드 4개 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="멤버"
            value={`${guild.member_count ?? 0}/${guild.max_members ?? 100}`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="길드 포인트"
            value={formatNumber(guild.total_points ?? 0)}
            accent
          />
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="내 출석"
            value={`${totalAttendances}일`}
          />
          <StatCard
            icon={<Award className="w-4 h-4" />}
            label="연속 출석"
            value={`${streak}일`}
          />
        </div>

        {/* 위젯 영역: 출석 + 캘린더 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <AttendanceWidget
              guildCode={guild.code}
              alreadyAttended={alreadyAttended}
              streak={streak}
              totalAttendances={totalAttendances}
            />
          </div>
          <div className="lg:col-span-2">
            <MiniCalendar attendanceDates={attendanceDates} />
          </div>
        </div>

        {/* 최근 멤버 */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            RECENT MEMBERS
          </p>
          <h3 className="text-lg font-bold text-white mb-4">최근 가입 멤버</h3>
          <div className="space-y-3">
            {(recentMembers ?? []).map((m: any) => (
              <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  {m.profiles?.avatar_url ? (
                    <img
                      src={m.profiles.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-mono text-violet-300">
                      {m.profiles?.username?.[0] ?? "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-white">
                      {m.profiles?.username ?? "Unknown"}
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">
                      {getRelativeTime(m.joined_at)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-mono text-violet-300">{m.points ?? 0}P</p>
              </div>
            ))}
            {(!recentMembers || recentMembers.length === 0) && (
              <p className="text-sm text-zinc-500 text-center py-4">아직 멤버가 없습니다</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center gap-2 text-zinc-500 mb-2">
        {icon}
        <p className="text-xs font-mono uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-violet-300" : "text-white"}`}>
        {value}
      </p>
    </Card>
  );
}
