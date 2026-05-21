// lib/attendance.ts
// 출석 관련 유틸 함수
// 정책: 매일 오전 6시 KST 리셋 (0~6시는 전날로 카운트)

const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // UTC+9
const RESET_HOUR = 6; // 오전 6시

/**
 * 현재 시점 기준 "출석일"을 YYYY-MM-DD 문자열로 반환
 * 예: 5/22 새벽 3시 → "2026-05-21" (전날로 카운트)
 *     5/22 오전 9시 → "2026-05-22"
 */
export function getAttendanceDate(date: Date = new Date()): string {
  const kstTime = new Date(date.getTime() + KST_OFFSET_MS);
  if (kstTime.getUTCHours() < RESET_HOUR) {
    kstTime.setUTCDate(kstTime.getUTCDate() - 1);
  }
  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 다음 리셋 시각까지 남은 시간 (밀리초)
 */
export function getMsUntilNextReset(date: Date = new Date()): number {
  const kstTime = new Date(date.getTime() + KST_OFFSET_MS);
  const nextReset = new Date(kstTime);
  nextReset.setUTCHours(RESET_HOUR, 0, 0, 0);
  if (kstTime.getUTCHours() >= RESET_HOUR) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  }
  return nextReset.getTime() - kstTime.getTime();
}

/**
 * 남은 시간을 "HH시간 MM분" 형식으로
 */
export function formatTimeUntilReset(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

/**
 * 연속 출석일 계산
 * dates: 출석한 날짜 배열 (YYYY-MM-DD, 정렬 무관)
 * 오늘 또는 어제까지 연속이어야 streak 인정
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  // 중복 제거 후 최신순 정렬
  const uniqueDates = Array.from(new Set(dates));
  const sorted = uniqueDates.sort().reverse();
  const today = getAttendanceDate();
  const yesterday = getPreviousDate(today);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  let expected = getPreviousDate(sorted[0]);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === expected) {
      streak++;
      expected = getPreviousDate(expected);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * YYYY-MM-DD 문자열의 전날 반환
 */
export function getPreviousDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/**
 * 특정 월의 모든 날짜 배열 (YYYY-MM-DD)
 */
export function getMonthDates(year: number, month: number): string[] {
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    return `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
  });
}
