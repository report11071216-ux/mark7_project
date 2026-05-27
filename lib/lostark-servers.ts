// 로스트아크 서버 목록 — 길드/게시판 등에서 공용으로 사용
export const LOSTARK_SERVERS = [
  "루페온",
  "아브렐슈드",
  "실리안",
  "아만",
  "카제로스",
  "니나브",
] as const;

export type LostarkServer = (typeof LOSTARK_SERVERS)[number];

export function isValidServer(value: string | null | undefined): value is LostarkServer {
  return !!value && (LOSTARK_SERVERS as readonly string[]).includes(value);
}
