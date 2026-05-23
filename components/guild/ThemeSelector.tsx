"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes";
import { saveGuildTheme } from "@/app/actions/guild-theme";
import { Palette, X, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  guildId: string;
  guildCode: string;
  currentThemeId: string;
};

export default function ThemeSelector({ guildId, guildCode, currentThemeId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(currentThemeId);
  const router = useRouter();

  function handleSelect(themeId: string) {
    if (themeId === selectedId || isPending) return;
    startTransition(async () => {
      try {
        await saveGuildTheme(guildId, themeId, guildCode);
        setSelectedId(themeId);
        toast.success("테마가 변경됐어요");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("테마 변경에 실패했어요");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
      >
        <Palette className="w-4 h-4" />
        <span>테마</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div>
                <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-0.5">
                  THEME
                </p>
                <h2 className="text-base font-bold text-white">테마 선택</h2>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {THEMES.map((theme) => {
                const isSelected = selectedId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelect(theme.id)}
                    disabled={isPending}
                    className={
                      "relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] disabled:opacity-60 " +
                      (isSelected
                        ? "border-violet-500 bg-violet-500/15"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-violet-500/50")
                    }
                  >
                    <span className="text-2xl mb-2 block">{theme.icon}</span>
                    <p className="text-sm font-bold text-white mb-0.5">{theme.name}</p>
                    <p className="text-[11px] text-zinc-400 leading-snug">{theme.description}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isPending && isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/70 rounded-xl">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
