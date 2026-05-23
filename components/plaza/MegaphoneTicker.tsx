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

  // 길드 이름 붙이기
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

  // 마퀴가 끊김 없이 흐르도록 2배 복제
  const loop = [...items, ...items];

  return (
    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="flex items-center gap-1.5 px-4 py-2 bg-black/15 shrink-0">
          <Megaphone className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider hidden sm:block">
            LIVE
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-12 py-2 whitespace-nowrap animate-marquee">
            {loop.map((item, i) => (
              <span key={`${item.id}-${i}`} className="inline-flex items-center gap-2 text-sm text-white">
                {item.guildName && (
                  <span className="font-bold text-cyan-100">[{item.guildName}]</span>
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
