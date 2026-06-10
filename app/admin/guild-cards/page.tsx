import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import GuildCardBuilder, { type CardRow } from "@/components/admin/GuildCardBuilder";
export const dynamic = "force-dynamic";

export default async function AdminGuildCardsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: cards } = await supabase
    .from("guild_cards")
    .select("id, name, description, image_url, design, price, is_active, created_at")
    .order("created_at", { ascending: false });

  const rows: CardRow[] = (cards ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    image_url: c.image_url,
    design: c.design ?? {},
    price: c.price,
    is_active: c.is_active,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">길드 명함 카드</h1>
        <p className="text-sm text-slate-500 mt-1">
          효과와 배경 이미지로 카드를 만들어 길드샵에 판매합니다.
        </p>
      </div>
      <GuildCardBuilder cards={rows} />
    </div>
  );
}
