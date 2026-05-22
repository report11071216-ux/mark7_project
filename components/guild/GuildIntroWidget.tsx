import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

type Props = {
  guildName: string;
  guildCode: string;
  description: string | null;
  welcomeMessage: string | null;
  logoUrl: string | null;
  memberCount: number;
  maxMembers: number;
  isRecruiting: boolean;
};

export default function GuildIntroWidget({
  guildName, guildCode, description, welcomeMessage,
  logoUrl, memberCount, maxMembers, isRecruiting,
}: Props) {
  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
        GUILD INFO
      </p>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-glow-violet">
          {logoUrl ? (
            <img src={logoUrl} alt={guildName} className="w-full h-full rounded-xl object-cover" />
          ) : (
            <Shield className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{guildName}</h3>
          <p className="text-[10px] font-mono text-violet-300 tracking-wider">{guildCode}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-400">{memberCount}/{maxMembers}명</span>
            {isRecruiting && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 font-mono">
                모집중
              </span>
            )}
          </div>
        </div>
      </div>
      {welcomeMessage && (
        <div className="mb-3 px-3 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <p className="text-xs text-violet-200 leading-relaxed">{welcomeMessage}</p>
        </div>
      )}
      {description && (
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">{description}</p>
      )}
    </Card>
  );
}
