const BASE = "https://developer-lostark.game.onstove.com";

// ─── Calendar Types ───
export type RewardSubItem = {
  Name: string;
  Icon: string;
  Grade: string;
  StartTimes: string[] | null;
};

export type RewardItem = {
  ItemLevel: number;
  Items: RewardSubItem[];
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
  CombatPower: string | null;
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

// ─── 서포터 직업 목록 (발키리·홀리나이트·도화가·바드) ───
const SUPPORT_CLASSES = ["발키리", "홀리나이트", "도화가", "바드"];

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

// ─── 전투력 ───
export function extractCombatPower(profile: LostarkProfile | null): number {
  if (!profile?.CombatPower) return 0;
  const num = parseFloat(profile.CombatPower.replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

// ─── 공격력 (Stats에서 읽기) ───
export function extractAttackPower(stats: LostarkStat[] | null): number {
  if (!stats) return 0;
  const found = stats.find((s) => s.Type === "공격력");
  if (!found) return 0;
  return parseFloat(found.Value.replace(/,/g, "")) || 0;
}

// ─── 최대 생명력 (Stats에서 읽기) ───
export function extractMaxHp(stats: LostarkStat[] | null): number {
  if (!stats) return 0;
  const found = stats.find((s) => s.Type === "최대 생명력");
  if (!found) return 0;
  return parseFloat(found.Value.replace(/,/g, "")) || 0;
}

// ─── Parse item level ───
export function parseItemLevel(levelStr: string | null | undefined): number {
  if (!levelStr) return 0;
  return parseFloat(levelStr.replace(/,/g, "")) || 0;
}

// ─── Time utils ───
function parseKST(dateStr: string): Date {
  const hasOffset = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(dateStr);
  return new Date(hasOffset ? dateStr : dateStr + "+09:00");
}

export function formatKST(dateStr: string): string {
  return parseKST(dateStr).toLocaleTimeString("ko-KR", {
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
  const target = parseKST(dateStr).toLocaleDateString("ko-KR", opts);
  return today === target;
}

// ─────────────────────────────────────────────
// 거래소 (Market) — 강화재료 시세
// ─────────────────────────────────────────────
export type MarketItemResult = {
  name: string;
  iconUrl: string;
  currentMinPrice: number | null;
  ydayAvgPrice: number | null;
};

export async function getMarketItemPrice(
  itemName: string
): Promise<MarketItemResult | null> {
  try {
    const res = await fetch(`${BASE}/markets/items`, {
      method: "POST",
      headers: {
        Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Sort: "GRADE",
        CategoryCode: 50000,
        CharacterClass: "",
        ItemTier: null,
        ItemGrade: "",
        ItemName: itemName,
        PageNo: 0,
        SortCondition: "ASC",
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      Items?: {
        Name?: string;
        Icon?: string;
        CurrentMinPrice?: number | null;
        YDayAvgPrice?: number | null;
        RecentPrice?: number | null;
      }[];
    };

    const items = Array.isArray(data.Items) ? data.Items : [];
    if (items.length === 0) return null;

    const exact = items.find((it) => (it.Name || "").trim() === itemName.trim());
    const picked = exact || items[0];

    return {
      name: (picked.Name || itemName).trim(),
      iconUrl: picked.Icon || "",
      currentMinPrice:
        picked.CurrentMinPrice == null ? null : Number(picked.CurrentMinPrice),
      ydayAvgPrice:
        picked.YDayAvgPrice == null ? null : Number(picked.YDayAvgPrice),
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// 이벤트 (Events) — 로스트아크 공식 진행 이벤트
// ─────────────────────────────────────────────
export type LostarkEvent = {
  title: string;
  thumbnail: string;
  link: string;
  startDate: string | null;
  endDate: string | null;
};

export async function getLostarkEvents(): Promise<LostarkEvent[]> {
  try {
    const res = await fetch(`${BASE}/news/events`, {
      headers: {
        Authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      Title?: string;
      Thumbnail?: string;
      Link?: string;
      StartDate?: string | null;
      EndDate?: string | null;
    }[];

    const arr = Array.isArray(data) ? data : [];

    return arr
      .filter((e) => e && (e.Link || "").trim().length > 0)
      .map((e) => ({
        title: (e.Title || "이벤트").trim(),
        thumbnail: (e.Thumbnail || "").trim(),
        link: (e.Link || "").trim(),
        startDate: e.StartDate || null,
        endDate: e.EndDate || null,
      }));
  } catch {
    return [];
  }
}
