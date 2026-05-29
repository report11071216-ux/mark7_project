import { createClient } from "@/lib/supabase/server";
import { Megaphone } from "lucide-react";

export default async function MegaphoneTicker() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data: active } = await supabase
    .from("purchases")
    .select("id, megaphone_message, guild_id, expires_at")
    .eq("item_category", "확성기")
    .not("activated_at", "is", null)
    .not("megaphone_message", "is", null)
    .gt("expires_at", nowIso)
    .order("activated_at", { ascending: false });
  const messages = (active ?? []).filter((m) => m.megaphone_message);
  if (messages.length === 0) return null;

  const guildIds = Array.from(
    new Set(messages.map((m) => m.guild_id).filter(Boolean))
  ) as string[];
  let guildNameMap: { [key: string]: string } = {};
  if (guildIds.length > 0) {
    const { data: guilds } = await supabase
      .from("guilds")
      .select("id, name")
      .in("id", guildIds);
    for (const g of guilds ?? []) {
      guildNameMap[g.id] = g.name;
    }
  }
  const items = messages.map((m) => ({
    id: m.id,
    guildName: m.guild_id ? guildNameMap[m.guild_id] ?? "" : "",
    message: m.megaphone_message as string,
  }));
  const loop = [...items, ...items];

  return (
    <div className="bg-white border-b border-slate-200 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center">
        <div className="flex items-center gap-1.5 pr-4 py-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600">
            <Megaphone className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">LIVE</span>
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-12 py-2 whitespace-nowrap animate-marquee">
            {loop.map((item, i) => (
              <span key={`${item.id}-${i}`} className="inline-flex items-center gap-2 text-sm text-slate-600">
                {item.guildName && (
                  <span className="font-bold text-cyan-600">[{item.guildName}]</span>
                )}
                <span>{item.message}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
