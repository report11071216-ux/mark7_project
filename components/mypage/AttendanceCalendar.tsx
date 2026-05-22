"use client";

type Props = {
  attendedDates: string[];
};

export default function AttendanceCalendar({ attendedDates }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const attendedSet = new Set(attendedDates);
  const attendCount = attendedDates.length;

  const monthLabel = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="plaza-card p-4 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-mono text-blue-600 uppercase tracking-[0.2em] font-bold mb-0.5">
            Attendance
          </p>
          <p className="text-sm font-bold text-slate-900">{monthLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-blue-600 leading-none">
            {attendCount}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            / {daysInMonth}일
          </p>
        </div>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-mono font-bold py-1 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-0.5 flex-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isAttended = attendedSet.has(dateStr);
          const isToday = day === today;

          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-mono font-bold transition ${
                isAttended
                  ? "bg-blue-600 text-white shadow-sm"
                  : isToday
                  ? "ring-2 ring-blue-400 text-blue-600 bg-blue-50"
                  : day < today
                  ? "text-slate-300"
                  : "text-slate-400"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 프로그레스 */}
      <div className="mt-4 space-y-2">
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all"
            style={{ width: `${Math.min((attendCount / daysInMonth) * 100, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">
            출석률{" "}
            <span className="text-blue-600 font-bold">
              {Math.round((attendCount / daysInMonth) * 100)}%
            </span>
          </span>
          <span className="text-blue-600 font-bold">+{attendCount} P 획득</span>
        </div>
      </div>
    </div>
  );
}
