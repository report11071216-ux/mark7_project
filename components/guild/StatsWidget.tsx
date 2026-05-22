import { Card } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, Award } from "lucide-react";
import { formatNumber } from "@/lib/utils";

type Props = {
  memberCount: number;
  maxMembers: number;
  totalPoints: number;
  myAttendances: number;
  streak: number;
};

export default function StatsWidget({ memberCount, maxMembers, totalPoints, myAttendances, streak }: Props) {
  const stats = [
    { icon: Users, label: "멤버", value: `${memberCount}/${maxMembers}`, accent: false },
    { icon: TrendingUp, label: "길드 포인트", value: formatNumber(totalPoints), accent: true },
    { icon: Calendar, label: "내 출석", value: `${myAttendances}일`, accent: false },
    { icon: Award, label: "연속 출석", value: `${streak}일`, accent: false },
  ];

  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
        GUILD STATS
      </p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1.5">
              <s.icon className="w-3.5 h-3.5" />
              <p className="text-[10px] font-mono uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`text-xl font-bold ${s.accent ? "text-violet-300" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
