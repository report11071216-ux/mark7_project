export const LOSTARK_SERVERS = [
  "루페온",
  "실리안",
  "아만",
  "아브렐슈드",
  "카마인",
  "카제로스",
  "니나브",
  "카단",
] as const;

export type LostarkServer = (typeof LOSTARK_SERVERS)[number];

// 커뮤니티(친목방 등 인게임 서버에 안 묶이는 모임)
export const COMMUNITY_SERVER = "커뮤니티";

// 길드 생성 폼·검증에서 쓰는 전체 선택지 (로아 서버 + 커뮤니티)
export const GUILD_SERVER_OPTIONS = [
  ...LOSTARK_SERVERS,
  COMMUNITY_SERVER,
] as const;

// 로아 실제 서버인지 (캐릭터 연동 등에서 필요할 때)
export function isLostarkServer(s: string | null | undefined): boolean {
  if (!s) return false;
  return (LOSTARK_SERVERS as readonly string[]).indexOf(s) !== -1;
}

// 길드 서버로 유효한지 (커뮤니티 포함)
export function isValidServer(s: string | null | undefined): boolean {
  if (!s) return false;
  return (GUILD_SERVER_OPTIONS as readonly string[]).indexOf(s) !== -1;
}
