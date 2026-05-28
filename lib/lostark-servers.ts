export const LOSTARK_SERVERS = [
  "루페온",
  "실리안",
  "아만",
  "아브렐슈드",
  "카마인",
  "카제로스",
  "니나브",
] as const;

export type LostarkServer = (typeof LOSTARK_SERVERS)[number];

export function isValidServer(s: string | null | undefined): boolean {
  if (!s) return false;
  return (LOSTARK_SERVERS as readonly string[]).indexOf(s) !== -1;
}
