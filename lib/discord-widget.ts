// lib/discord-widget.ts
export type DiscordWidgetMember = {
  id: string;
  username: string;
  status: string;
  avatar_url: string | null;
  game: string | null;
};

export type DiscordWidgetData = {
  ok: boolean;
  name: string;
  presenceCount: number;
  members: DiscordWidgetMember[];
  instantInvite: string | null;
};

export async function getDiscordWidget(widgetId: string): Promise<DiscordWidgetData | null> {
  const cleaned = (widgetId.match(/\d{17,20}/) ?? [""])[0];
  if (!cleaned) return null;

  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${cleaned}/widget.json`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      // 위젯 비활성화(403) 등
      return { ok: false, name: "", presenceCount: 0, members: [], instantInvite: null };
    }

    const json = await res.json();

    const members: DiscordWidgetMember[] = Array.isArray(json.members)
      ? json.members.map((m: any) => ({
          id: String(m.id ?? ""),
          username: m.username ?? "?",
          status: m.status ?? "online",
          avatar_url: m.avatar_url ?? null,
          game: m.game?.name ?? null,
        }))
      : [];

    return {
      ok: true,
      name: json.name ?? "",
      presenceCount: typeof json.presence_count === "number" ? json.presence_count : members.length,
      members,
      instantInvite: json.instant_invite ?? null,
    };
  } catch {
    return null;
  }
}
