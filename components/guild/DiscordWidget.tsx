// components/guild/DiscordWidget.tsx
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

  // API 실패 또는 위젯 비활성화 → 위젯 자체를 숨김
  if (!data || !data.ok) return null;

  const shown = data.members.slice(0, 10);
  const extra = data.presenceCount - shown.length;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
            <path d="M20.317 4.369A19.79 19.79 0 0 0 15.432 3c-.21.375-.456.88-.625 1.28a18.27 18.27 0 0 0-5.614 0A12.6 12.6 0 0 0 8.56 3a19.74 19.74 0 0 0-4.885 1.37C.61 8.95-.23 13.41.18 17.81a19.93 19.93 0 0 0 6.03 3.04c.49-.665.925-1.37 1.3-2.11a12.93 12.93 0 0 1-2.04-.98c.17-.125.34-.255.5-.39a14.24 14.24 0 0 0 12.06 0c.165.14.335.27.505.39-.65.385-1.34.71-2.045.98.375.74.81 1.445 1.3 2.11a19.86 19.86 0 0 0 6.03-3.04c.48-5.1-.84-9.52-3.51-13.44ZM8.02 15.33c-1.18 0-2.155-1.085-2.155-2.42 0-1.335.955-2.42 2.155-2.42 1.21 0 2.175 1.095 2.155 2.42 0 1.335-.955 2.42-2.155 2.42Zm7.96 0c-1.18 0-2.155-1.085-2.155-2.42 0-1.335.955-2.42 2.155-2.42 1.21 0 2.175 1.095 2.155 2.42 0 1.335-.945 2.42-2.155 2.42Z" />
          </svg>
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
          <>
            <p className="text-[10px] mb-2" style={{ color: textSecondary }}>접속 중인 멤버</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {shown.map((m) => (
                <div key={m.id} className="relative" title={m.game ? `${m.username} · ${m.game}` : m.username}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.username} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: "#5865F2" }}>
                      {m.username.charAt(0)}
                    </div>
                  )}
                  <span
                    className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ backgroundColor: statusColor(m.status), borderColor: cardBg }}
                  />
                </div>
              ))}
              {extra > 0 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: cardBorder, color: textSecondary }}>
                  +{extra}
                </div>
              )}
            </div>
          </>
        )}

        {data.instantInvite ? (
          
            href={data.instantInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#5865F2" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
              <path d="M20.317 4.369A19.79 19.79 0 0 0 15.432 3c-.21.375-.456.88-.625 1.28a18.27 18.27 0 0 0-5.614 0A12.6 12.6 0 0 0 8.56 3a19.74 19.74 0 0 0-4.885 1.37C.61 8.95-.23 13.41.18 17.81a19.93 19.93 0 0 0 6.03 3.04c.49-.665.925-1.37 1.3-2.11a12.93 12.93 0 0 1-2.04-.98c.17-.125.34-.255.5-.39a14.24 14.24 0 0 0 12.06 0c.165.14.335.27.505.39-.65.385-1.34.71-2.045.98.375.74.81 1.445 1.3 2.11a19.86 19.86 0 0 0 6.03-3.04c.48-5.1-.84-9.52-3.51-13.44Z" />
            </svg>
            디스코드 참여
          </a>
        ) : (
          <p className="text-[10px] text-center" style={{ color: textSecondary }}>
            접속 {data.presenceCount}명
          </p>
        )}
      </div>
    </div>
  );
}
