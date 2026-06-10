import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Flame } from "lucide-react";
import GuildCard from "@/components/guild/GuildCard";

const GRADE_RANK: { [key: string]: number } = {
  legend: 5,
  epic: 4,
  unique: 3,
  rare: 2,
  free: 1,
};

function tierOf(exp: number) {
  if (exp >= 12000) return { label: "그랜드마스터", color: "#dc2626" };
  if (exp >= 6000) return { label: "마스터", color: "#9333ea" };
  if (exp >= 3000) return { label: "다이아몬드", color: "#0891b2" };
  if (exp >= 1500) return { label: "에메랄드", color: "#059669" };
  if (exp >= 700) return { label: "플래티넘", color: "#7c3aed" };
  if (exp >= 300) return { label: "골드", color: "#ca8a04" };
  if (exp >= 100) return { label: "실버", color: "#64748b" };
  return { label: "브론즈", color: "#b45309" };
}

export default async function TrendingGuilds() {
  const supabase = await createClient();

  // 최근 7일 출석으로 활동량 집계
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const { data: att } = await supabase
    .from("attendances")
    .select("guild_id")
    .gte("attendance_date", sevenDaysAgo);

  let activityCount = new Map<string, number>();
  for (const a of att ?? []) {
    const gid = (a as any).guild_id as string | null;
    if (!gid) continue;
    activityCount.set(gid, (activityCount.get(gid) ?? 0) + 1);
  }

  const activeIds = Array.from(activityCount.keys());
  if (activeIds.length === 0) return null;

  // 길드 기본 정보 (뷰 → RLS 우회) + 서버/경험치 (guilds) + 테마(등급/마크) 병렬
  const [displayResult, serverExpResult, themeResult] = await Promise.all([
    supabase
      .from("guilds_display")
      .select("id, code, name, display_logo_url, description, member_count, max_members")
      .in("id", activeIds),
    supabase
      .from("guilds")
      .select("id, server, total_exp")
      .in("id", activeIds),
    supabase
      .from("guild_themes")
      .select("guild_id, card_grade, equipped_mark_id")
      .in("guild_id", activeIds),
  ]);

  const displayRows = displayResult.data ?? [];
  if (displayRows.length === 0) return null;

  let serverMap = new Map<string, string | null>();
  let expMap = new Map<string, number>();
  for (const g of serverExpResult.data ?? []) {
    serverMap.set((g as any).id, (g as any).server ?? null);
    expMap.set((g as any).id, (g as any).total_exp ?? 0);
  }

  let gradeMap = new Map<string, string>();
  let markPurchaseMap = new Map<string, string>();
  for (const t of themeResult.data ?? []) {
    const gid = (t as any).guild_id as string;
    gradeMap.set(gid, ((t as any).card_grade as string) ?? "free");
    const mp = (t as any).equipped_mark_id as string | null;
    if (mp) markPurchaseMap.set(gid, mp);
  }

  // 마크 이미지: purchases → shop_items.image_url
  let markUrlByGuild = new Map<string, string | null>();
  const purchaseIds = Array.from(new Set(Array.from(markPurchaseMap.values())));
  if (purchaseIds.length > 0) {
    const { data: purchases } = await supabase
      .from("purchases")
      .select("id, item_id")
      .in("id", purchaseIds);

    const itemIds = Array.from(
      new Set((purchases ?? []).map((p) => p.item_id).filter(Boolean))
    ) as string[];

    let itemImg = new Map<string, string | null>();
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from("shop_items")
        .select("id, image_url")
        .in("id", itemIds);
      itemImg = new Map((items ?? []).map((it) => [it.id, it.image_url]));
    }

    const purchaseToItem = new Map(
      (purchases ?? []).map((p) => [p.id, p.item_id])
    );
    for (const entry of Array.from(markPurchaseMap.entries())) {
      const gid = entry[0];
      const pid = entry[1];
      const itemId = purchaseToItem.get(pid);
      if (itemId) markUrlByGuild.set(gid, itemImg.get(itemId) ?? null);
    }
  }

  // 정렬: 명함 등급 높은순 → 활동량순 → 경험치순
  const sorted = displayRows
    .slice()
    .sort((a, b) => {
      const ga = GRADE_RANK[gradeMap.get(a.id) ?? "free"] ?? 1;
      const gb = GRADE_RANK[gradeMap.get(b.id) ?? "free"] ?? 1;
      if (gb !== ga) return gb - ga;
      const aa = activityCount.get(a.id) ?? 0;
      const ab = activityCount.get(b.id) ?? 0;
      if (ab !== aa) return ab - aa;
      return (expMap.get(b.id) ?? 0) - (expMap.get(a.id) ?? 0);
    })
    .slice(0, 10);

  if (sorted.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-500" />
        <h2 className="text-base font-bold text-slate-900">지금 뜨는 길드</h2>
        <div className="flex-1 h-px bg-slate-200 ml-2" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {sorted.map((g) => {
          const exp = expMap.get(g.id) ?? 0;
          const tier = tierOf(exp);
          const server = serverMap.get(g.id) ?? null;
          const markUrl = markUrlByGuild.get(g.id) ?? g.display_logo_url;
          return (
            <Link
              key={g.id}
              href={"/guild/" + g.code}
              className="w-[300px] shrink-0 group"
            >
              <div className="transition group-hover:-translate-y-0.5">
                <GuildCard
                  guildName={g.name}
                  server={server ? server + " 서버" : undefined}
                  grade={gradeMap.get(g.id)}
                  markUrl={markUrl}
                  tierLabel={tier.label}
                  tierColor={tier.color}
                  memberCount={g.member_count ?? 0}
                  maxMembers={g.max_members ?? 50}
                />
              </div>
              {g.description ? (
                <p className="text-xs text-slate-500 mt-1.5 px-0.5 truncate">
                  {g.description}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
