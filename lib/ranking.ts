// lib/ranking.ts
// 랭킹 기간 계산 유틸 (KST 기준)
// attendance_date는 이미 오전 6시 리셋 기준으로 저장되므로
// 여기선 단순 날짜 비교만 하면 됨

/**
 * 이번 주의 시작 날짜 (월요일) YYYY-MM-DD
 * 예: 화요일이면 어제 월요일, 일요일이면 6일 전 월요일
 */
export function getWeekStart(date: Date = new Date()): string {
  // KST 기준으로 변환
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay(); // 0=일, 1=월, ..., 6=토
  // 월요일을 시작으로 (일요일이면 6일 전, 그 외엔 day-1일 전)
  const daysToSubtract = day === 0 ? 6 : day - 1;
  const monday = new Date(kst);
  monday.setUTCDate(kst.getUTCDate() - daysToSubtract);
  return formatDate(monday);
}

/**
 * 이번 달의 시작 날짜 (1일) YYYY-MM-DD
 */
export function getMonthStart(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth();
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

/**
 * 이번 주 라벨: "2026년 5월 4주차 (5/18 ~ 5/24)"
 */
export function getWeekLabel(date: Date = new Date()): string {
  const startStr = getWeekStart(date);
  const [y, m, d] = startStr.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return `${start.getUTCMonth() + 1}/${start.getUTCDate()} ~ ${end.getUTCMonth() + 1}/${end.getUTCDate()}`;
}

/**
 * 이번 달 라벨: "2026년 5월"
 */
export function getMonthLabel(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월`;
}

/**
 * 다음 주 리셋까지 남은 시간 (밀리초)
 * 다음 주 월요일 오전 6시 KST
 */
export function getMsUntilNextWeekReset(date: Date = new Date()): number {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay();
  const daysToNextMonday = day === 1 ? 7 : ((8 - day) % 7) || 7;
  const nextMonday = new Date(kst);
  nextMonday.setUTCDate(kst.getUTCDate() + daysToNextMonday);
  nextMonday.setUTCHours(6, 0, 0, 0);
  // 이미 월요일 6시 이전이면 오늘 6시
  if (day === 1 && kst.getUTCHours() < 6) {
    nextMonday.setUTCDate(kst.getUTCDate());
  }
  return nextMonday.getTime() - kst.getTime();
}

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
