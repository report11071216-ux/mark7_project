import { createClient } from "@/lib/supabase/server";
import { GUARDIAN_ORDER } from "@/lib/lostark";
import { Card } from "@/components/ui/card";
import { Swords } from "lucide-react";

export default async function GuardianWidget() {
  const supabase = await createClient();

  const [indexResult, imagesResult, weaknessesResult] = await Promise.all([
    supabase.from("platform_settings").select("value").eq("key", "current_guardian_index").maybeSingle(),
    supabase.from("platform_settings").select("value").eq("key", "guardian_images").maybeSingle(),
    supabase.from("platform_settings").select("value").eq("key", "guardian_weaknesses").maybeSingle(),
  ]);

  const guardianIndex = Number(indexResult.data?.value ?? 0);
  const guardianImages = (imagesResult.data?.value ?? {}) as { [key: string]: string };
  const guardianWeaknesses = (weaknessesResult.data?.value ?? {}) as { [key: string]: { name: string; color: string }[] };
  const currentName = GUARDIAN_ORDER[guardianIndex] ?? null;
  const imageUrl = guardianImages[String(guardianIndex)] ?? null;
  const weaknesses = Array.isArray(guardianWeaknesses[String(guardianIndex)])
    ? guardianWeaknesses[String(guardianIndex)]
    : [];

  return (
    <Card className="p-5 bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4 text-violet-400" />
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
            GUARDIAN RAID
          </p>
          <h3 className="text-sm font-bold text-white">이번 주 가디언</h3>
        </div>
        <span className="ml-auto text-[10px] font-mono text-zinc-500">
          {guardianIndex + 1}/{GUARDIAN_ORDER.length}
        </span>
      </div>

      {!currentName ? (
        <p className="text-xs text-zinc-500 text-center py-4">가디언 정보가 없어요</p>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-3">
            {imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700">
                <img src={imageUrl} alt={currentName} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{currentName}</p>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">매주 수요일 06:00 초기화</p>
            </div>
          </div>

          {weaknesses.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {weaknesses.map((w, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: w.color }}
                >
                  {w.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-1 flex-wrap">
            {GUARDIAN_ORDER.map((name, i) => (
              <span
                key={name}
                className={
                  "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition " +
                  (i === guardianIndex
                    ? "bg-violet-500/30 text-violet-200 border border-violet-500/40"
                    : i < guardianIndex
                    ? "bg-zinc-800/30 text-zinc-600 line-through"
                    : "bg-zinc-800/50 text-zinc-500")
                }
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
