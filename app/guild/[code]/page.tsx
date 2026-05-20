import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardEyebrow,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Trophy,
  CalendarDays,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default async function GuildHomePage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 길드 정보 (layout에서 검증된 후라 항상 존재)
  const { data: guild } = await supabase
    .from("guilds")
    .select("id, name, description, member_count, total_points, created_at")
    .eq("code", params.code.toUpperCase())
    .single();

  if (!guild) {
    return null;
  }

  // 오늘 출석한 멤버 수
  const today = new Date().toISOString().split("T")[0];
  const { count: todayAttendCount } = await supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .eq("guild_id", guild.id)
    .eq("attendance_date", today);

  // 최근 멤버 (joined_at 최신순 5명)
  const { data: recentMembers } = await supabase
    .from("guild_members")
    .select("user_id, role, joined_at, profiles(username, avatar_url)")
    .eq("guild_id", guild.id)
    .order("joined_at", { ascending: false })
    .limit(5);

  return (
    <div className="container-padded py-10 max-w-6xl">
      {/* 환영 헤더 */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="online" dot>오늘 활동 중</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
          어서오세요,{" "}
          <span className="text-gradient-violet-strong">{guild.name}</span>
        </h1>
        {guild.description && (
          <p className="text-muted-foreground text-lg max-w-2xl">
            {guild.description}
          </p>
        )}
      </div>

      {/* 빠른 통계 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card variant="glass" className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-violet-400" />
            <CardEyebrow>MEMBERS</CardEyebrow>
          </div>
          <div className="font-mono text-3xl font-black text-white">
            {guild.member_count ?? 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">총 멤버</p>
        </Card>

        <Card variant="glass" className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <CardEyebrow>POINTS</CardEyebrow>
          </div>
          <div className="font-mono text-3xl font-black text-white">
            {guild.total_points ?? 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">길드 포인트</p>
        </Card>

        <Card variant="glass" className="p-5">
          <div className="flex items-center justify-between mb-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            <CardEyebrow>TODAY</CardEyebrow>
          </div>
          <div className="font-mono text-3xl font-black text-white">
            {todayAttendCount ?? 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">오늘 출석</p>
        </Card>

        <Card variant="glass" className="p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <CardEyebrow>STATUS</CardEyebrow>
          </div>
          <div className="font-mono text-3xl font-black text-cyan-300">
            LIVE
          </div>
          <p className="text-xs text-muted-foreground mt-1">실시간</p>
        </Card>
      </div>

      {/* 메인 그리드: 출석 위젯 자리 + 최근 활동 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 출석 위젯 자리 (8-C-3에서 채울 예정) */}
        <Card variant="gradient" className="lg:col-span-2 p-8 relative overflow-hidden min-h-[320px] flex items-center justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 text-center">
            <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-4 animate-glow-pulse" />
            <CardEyebrow className="text-cyan-300">COMING SOON</CardEyebrow>
            <CardTitle className="mt-3 mb-2 text-2xl">
              출석 위젯 자리
            </CardTitle>
            <CardDescription className="max-w-md mx-auto">
              곧 이 자리에 출석 체크 + 미니 캘린더 위젯이 들어올 거예요.
              <br />
              연속 출석 보상 시스템과 함께!
            </CardDescription>
          </div>
        </Card>

        {/* 최근 합류 멤버 */}
        <Card variant="glass" className="p-6">
          <div className="mb-4">
            <CardEyebrow>RECENT MEMBERS</CardEyebrow>
            <CardTitle className="mt-2 text-lg">최근 합류</CardTitle>
          </div>
          {recentMembers && recentMembers.length > 0 ? (
            <div className="space-y-3">
              {recentMembers.map((m) => {
                const profile = m.profiles as any;
                const name = profile?.username ?? "익명";
                const avatar = profile?.avatar_url as string | null;
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {name}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
                        {m.role === "master"
                          ? "마스터"
                          : m.role === "submaster"
                            ? "부마스터"
                            : "멤버"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              아직 멤버가 없어요
            </p>
          )}
        </Card>
      </div>

      {/* 안내 박스 (베타 기간) */}
      <div className="mt-10 p-5 rounded-xl border border-violet-500/20 bg-violet-500/5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="text-violet-300 font-semibold">💜 베타 안내:</span>{" "}
          공지, 레이드 캘린더, 채팅 페이지는 곧 추가됩니다. 출석 위젯은
          다음 업데이트에서 만나보실 수 있어요!
        </p>
      </div>
    </div>
  );
}
