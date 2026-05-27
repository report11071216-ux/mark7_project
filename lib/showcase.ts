// 길드 자랑 하루 1장 리셋 기준: 매일 오전 6시 KST
// "현재 시점이 속한 자랑 가능 구간의 시작 시각"을 ISO 문자열로 반환
export function getShowcaseResetBoundary(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  let y = kst.getUTCFullYear();
  let m = kst.getUTCMonth();
  let d = kst.getUTCDate();
  const h = kst.getUTCHours();
  if (h < 6) {
    const prev = new Date(Date.UTC(y, m, d) - 24 * 3600 * 1000);
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth();
    d = prev.getUTCDate();
  }
  // 해당 날짜 06:00 KST = 그 날짜 (06-09)시 UTC = 전날 21:00 UTC (JS가 자동 정규화)
  return new Date(Date.UTC(y, m, d, 6 - 9, 0, 0)).toISOString();
}
