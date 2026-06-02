import { MessageCircle } from "lucide-react";
import { getDiscordWidget } from "@/lib/discord-widget";

type Props = {
  widgetId: string | null;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
};

function statusColor(status: string): string {
  if (status === "online") return "#23a55a";
  if (status === "idle") return "#f0b232";
  if (status === "dnd") return "#f23f43";
  return "#80848e";
}

export default async function DiscordWidget({
  widgetId,
  cardBg,
  cardBorder,
  textPrimary,
  textSecondary,
}: Props) {
  if (!widgetId) return null;

  const data = await getDiscordWidget(widgetId);
  if (!data || !data.ok) return null;

  const shown = data.members.slice(0, 10);
  const extra = data.presenceCount - shown.length;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4" style={{ color: "#5865F2" }} />
          <h2 className="text-xs font-bold" style={{ color: textPrimary }}>디스코드</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#23a55a" }} />
          <span className="text-[11px] font-bold" style={{ color: "#23a55a" }}>{data.presenceCount}명</span>
        </div>
      </div>

      <div className="p-3">
        {shown.length === 0 ? (
          <p className="text-[11px] text-center py-3" style={{ color: textSecondary }}>접속 중인 멤버가 없어요</p>
        ) : (
          <div>
            <p className="text-[10px] mb-2" style={{ color: textSecondary }}>접속 중인 멤버</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {shown.map((m) => (
                <div key={m.id} className="relative" title={m.username}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.username} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: "#5865F2" }}>
                      {m.username.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: statusColor(m.status), borderColor: cardBg }} />
                </div>
              ))}
              {extra > 0 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: cardBorder, color: textSecondary }}>
                  +{extra}
                </div>
              )}
            </div>
          </div>
        )}

        {data.instantInvite ? (
          <a href={data.instantInvite} target="_blank" rel="noopener noreferrer" className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold text-white" style={{ backgroundColor: "#5865F2" }}>
            <MessageCircle className="w-3.5 h-3.5" />
            디스코드 참여
          </a>
        ) : (
          <p className="text-[10px] text-center" style={{ color: textSecondary }}>접속 {data.presenceCount}명</p>
        )}
      </div>
    </div>
  );
}
