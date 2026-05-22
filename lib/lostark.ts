const BASE = "https://developer-lostark.game.onstove.com";

export type RewardItem = {
  Name: string;
  Icon: string;
  Grade: string;
};

export type CalendarContent = {
  CategoryName: string;
  ContentsName: string;
  ContentsIcon: string;
  MinItemLevel: number;
  StartTimes: string[] | null;
  Location: string;
  RewardItems: RewardItem[];
};

// 가디언토벌 고정 순서
export const GUARDIAN_ORDER = [
  "루멘칼리고",
  "가르가디스",
  "스콜라키아",
  "크라티오스",
  "아게오로스",
  "드렉탈라스",
  "소나벨",
  "베스칼",
];

export async function getCalendar(): Promise<CalendarContent[]> {
  try {
    const res = await fetch(`${BASE}/gamecontents/calendar`, {
      headers: {
        Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // 1시간 캐시
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// 시간 포맷 (KST 기준)
export function formatKST(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

// 오늘 날짜 체크 (KST 기준)
export function isTodayKST(dateStr: string): boolean {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const today = new Date().toLocaleDateString("ko-KR", opts);
  const target = new Date(dateStr).toLocaleDateString("ko-KR", opts);
  return today === target;
}
