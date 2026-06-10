import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import ShopItemManager, { type ShopItem } from "@/components/admin/ShopItemManager";
import CardGradePriceManager from "@/components/admin/CardGradePriceManager";
export const dynamic = "force-dynamic";
export default async function AdminShopPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: items }, { data: priceRow }] = await Promise.all([
    supabase
      .from("shop_items")
      .select("id, shop_type, category, name, description, price, image_url, duration_hours, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "card_grade_prices")
      .maybeSingle(),
  ]);
  const shopItems: ShopItem[] = (items ?? []).map((it) => ({
    id: it.id,
    shop_type: it.shop_type,
    category: it.category,
    name: it.name,
    description: it.description,
    price: it.price,
    image_url: it.image_url,
    duration_hours: it.duration_hours,
    is_active: it.is_active,
  }));

  const pricesRaw = (priceRow?.value ?? {}) as { [key: string]: number };
  const cardGradePrices = {
    rare: pricesRaw.rare ?? 1000,
    unique: pricesRaw.unique ?? 3000,
    epic: pricesRaw.epic ?? 6000,
    legend: pricesRaw.legend ?? 12000,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">상품 관리</h1>
        <p className="text-sm text-slate-500 mt-1">
          포인트 상점에 진열할 상품을 등록하고 관리합니다.
        </p>
      </div>
      <CardGradePriceManager initial={cardGradePrices} />
      <ShopItemManager items={shopItems} />
    </div>
  );
}
