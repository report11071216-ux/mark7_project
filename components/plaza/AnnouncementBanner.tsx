import { createClient } from "@/lib/supabase/server";
import { Megaphone } from "lucide-react";

export default async function AnnouncementBanner() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "plaza_announcement")
    .maybeSingle();

  const value = data?.value as { message: string; link: string; active: boolean } | null;

  if (!value?.active || !value.message?.trim()) return null;

  const inner = (
    <div className="flex items-center gap-3 max-w-7xl mx-auto px-6 py-2.5">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
          <Megaphone className="w-3 h-3 text-white" />
        </div>
        <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest hidden sm:block">
          Notice
        </span>
      </div>
      <p className="text-sm font-medium text-white truncate flex-1">
        {value.message}
      </p>
      {value.link && (
        <span className="text-[11px] font-bold text-white/80 underline underline-offset-2 shrink-0 hidden sm:block">
          자세히 보기 →
        </span>
      )}
    </div>
  );

  if (value.link) {
    return (
      <div className="bg-blue-600 w-full">
        
          href={value.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:bg-blue-700 transition-colors"
        >
          {inner}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-blue-600 w-full">
      {inner}
    </div>
  );
}
