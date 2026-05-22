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
  ColosseumInfo: unknown | null;
  CollectiblePoints: unknown[] | null;
};

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

// ─── Extract combat power from stats ───
export function extractCombatPower(stats: LostarkStat[] | null): number {
  if (!stats) return 0;
  const found = stats.find(
    (s) => s.Type.includes("전투력") || s.Type === "최대 전투력"
  );
  if (!found) return 0;
  return parseInt(found.Value.replace(/,/g, ""), 10) || 0;
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
