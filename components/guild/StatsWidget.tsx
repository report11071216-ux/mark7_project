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
    { label: "멤버", value: `${memberCount}/${maxMembers}`, color: "text-white" },
    { label: "길드 포인트", value: formatNumber(totalPoints), color: "text-violet-300" },
    { label: "내 출석", value: `${myAttendances}일`, color: "text-cyan-300" },
    { label: "연속 출석", value: `${streak}일`, color: "text-orange-300" },
  ];

  return (
    <div className="flex items-center divide-x divide-zinc-700/50 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur overflow-hidden">
      {stats.map((s) => (
        <div key={s.label} className="flex-1 px-4 py-3 text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">{s.label}</p>
          <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
