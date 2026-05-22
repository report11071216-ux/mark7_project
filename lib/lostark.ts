const BASE = "https://developer-lostark.game.onstove.com";

// ─── Calendar Types ───
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

// ─── Character Types ───
export type LostarkStat = {
  Type: string;
  Value: string;
  Tooltip?: string[];
};

export type LostarkProfile = {
  CharacterName: string;
  ServerName: string;
  CharacterClassName: string;
  CharacterLevel: number;
  ItemAvgLevel: string;
  ItemMaxLevel: string;
  ExpeditionLevel: number;
  CharacterImage: string | null;
  Stats: LostarkStat[] | null;
  GuildName: string | null;
  Title: string | null;
};

export type LostarkSibling = {
  ServerName: string;
  CharacterName: string;
  CharacterLevel: number;
  CharacterClassName: string;
  ItemAvgLevel: string;
  ItemMaxLevel: string;
};

// ─── Full Armory Type ───
export type LostarkArmory = {
  ArmoryProfile: LostarkProfile | null;
  ArmoryEquipment: unknown[] | null;
  ArmoryAvatars: unknown[] | null;
  ArmorySkills: unknown[] | null;
  ArmoryEngraving: unknown | null;
  ArmoryCard: unknown | null;
  ArmoryGem: unknown | null;
  ArkPassive: unknown | null;
  ArkGrid: unknown | null;
  ColosseumInfo: unknown | null;
  Collectibles: unknown[] | null;
};

// ─── 서포터 직업 목록 ───
const SUPPORT_CLASSES = ["홀리나이트", "바드", "도화가", "기상술사"];

export function isSupportClass(className: string): boolean {
  return SUPPORT_CLASSES.includes(className);
}

// ─── Guardian Order ───
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

// ─── Calendar API ───
export async function getCalendar(): Promise<CalendarContent[]> {
  try {
    const res = await fetch(`${BASE}/gamecontents/calendar`, {
      headers: {
        Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Character Profile API ───
export async function getCharacterProfile(
  name: string
): Promise<LostarkProfile | null> {
  try {
    const encoded = encodeURIComponent(name);
    const res = await fetch(
      `${BASE}/armories/characters/${encoded}/profiles`,
      {
        headers: {
          Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Siblings API ───
export async function getCharacterSiblings(
  name: string
): Promise<LostarkSibling[]> {
  try {
    const encoded = encodeURIComponent(name);
    const res = await fetch(`${BASE}/characters/${encoded}/siblings`, {
      headers: {
        Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Full Armory API ───
export async function getFullArmory(
  name: string
): Promise<LostarkArmory | null> {
  try {
    const encoded = encodeURIComponent(name);
    const res = await fetch(`${BASE}/armories/characters/${encoded}`, {
      headers: {
        Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── HTML 태그 제거 ───
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

// ─── 전투력 계산 ───
// API에서 제공하는 raw 힘/민/지, 순수무기공격력이 없어 완전한 공식 구현 불가.
// Stats tooltip에서 "순수 기본 공격력"을 파싱해 경험적 나눗수 적용.
//
// 검증:
//   딜러 농낭판치: 기본공격력 183,874 / 36.15 = 5,087.0 (실제 5,086.39, 오차 0.01%)
//   서포터 치유하모니(바드): 기본공격력 123,457 / 56.67 = 2,179.0 (실제 2,178.7, 오차 0.01%)
//
// 총 공격력(공격력+ 포함) 대신 순수 기본 공격력을 쓰는 이유:
//   딜러는 엘릭서/연마 공격력+ 옵션이 많아 총 공격력이 부풀어있어
//   순수 기본 공격력 파싱이 더 일관된 결과를 줌.
export function extractCombatPower(
  stats: LostarkStat[] | null,
  className?: string
): number {
  if (!stats) return 0;

  const getStat = (type: string): number => {
    const found = stats.find((s) => s.Type === type);
    if (!found) return 0;
    return parseFloat(found.Value.replace(/,/g, "")) || 0;
  };

  // tooltip에서 순수 기본 공격력 파싱
  // "힘, 민첩, 지능과 무기 공격력을 기반으로 증가한 기본 공격력은 183874 입니다."
  let baseAtk = 0;
  const atkStat = stats.find((s) => s.Type === "공격력");
  if (atkStat?.Tooltip && Array.isArray(atkStat.Tooltip)) {
    for (const tip of atkStat.Tooltip) {
      const clean = stripHtml(tip);
      const match = clean.match(/기본 공격력은\s*([\d,]+)/);
      if (match) {
        baseAtk = parseFloat(match[1].replace(/,/g, ""));
        break;
      }
    }
  }

  // 파싱 실패 시 총 공격력으로 fallback
  if (!baseAtk) baseAtk = getStat("공격력");
  if (!baseAtk) return 0;

  const isSupport = className ? isSupportClass(className) : false;

  // 딜러: 기본공격력 / 36.15
  // 서포터: 기본공격력 / 56.67
  const divisor = isSupport ? 56.67 : 36.15;

  return Math.round((baseAtk / divisor) * 100) / 100;
}

// ─── Parse item level ───
export function parseItemLevel(levelStr: string | null | undefined): number {
  if (!levelStr) return 0;
  return parseFloat(levelStr.replace(/,/g, "")) || 0;
}

// ─── Time utils ───
export function formatKST(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

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
