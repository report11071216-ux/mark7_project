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

// ─── 전투력 계산 ───
// T4 기준 공식:
//   딜러: 공격력 / 39.29
//   서포터: (공격력 + 최대생명력 × 0.085) / 39.29
// 검증: 공격력 199,823 → 5,086.06 (실제 5,086.39, 오차 0.006%)
export function extractCombatPower(
  stats: LostarkStat[] | null,
  className?: string
): number {
  if (!stats) return 0;

  const getStat = (type: string) => {
    const found = stats.find((s) => s.Type === type);
    if (!found) return 0;
    return parseFloat(found.Value.replace(/,/g, "")) || 0;
  };

  const atk = getStat("공격력");
  if (!atk) return 0;

  const isSupport = className ? isSupportClass(className) : false;

  let base = atk;
  if (isSupport) {
    const hp = getStat("최대 생명력");
    base = atk + hp * 0.085;
  }

  return Math.round((base / 39.29) * 100) / 100;
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
