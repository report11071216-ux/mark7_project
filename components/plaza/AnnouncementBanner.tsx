import { createClient } from "@/lib/supabase/server";
import { Megaphone } from "lucide-react";

export default async function AnnouncementBanner() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "plaza_announcement")
    .maybeSingle();

  const value = data?.value as {
    message: string;
    link: string;
    active: boolean;
  } | null;

  if (!value?.active || !value.message?.trim()) {
    return null;
  }

  return (
    <div className="bg-blue-600 w-full">
      <div className="flex items-center gap-3 max-w-7xl mx-auto px-6 py-2.5">
        <Megaphone className="w-4 h-4 text-white shrink-0" />
        <p className="text-sm font-medium text-white truncate flex-1">
          {value.message}
        </p>
        {value.link && (
          
            href={value.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-white/80 underline underline-offset-2 shrink-0 hidden sm:block"
          >
            자세히 보기 →
          </a>
        )}
      </div>
    </div>
  );
}
