"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { THEMES, WIDGET_META, type ThemeWidget, type WidgetId } from "@/lib/themes";
import { saveGuildTheme, saveCustomLayout } from "@/app/actions/guild-theme";
import { Palette, X, Loader2, Check, ChevronUp, ChevronDown, ToggleLeft, ToggleRight, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  guildId: string;
  guildCode: string;
  currentThemeId: string;
  currentWidgets: ThemeWidget[];
  isCustom: boolean;
};

const ALL_WIDGET_IDS: WidgetId[] = [
  "attendance", "calendar", "stats", "recentMembers",
  "notice", "guildIntro", "pointRanking", "guardian",
  "raidStatus", "raidSchedule", "raidCalendar", "onlineMembers",
];

export default function ThemeSelector({
  guildId, guildCode, currentThemeId, currentWidgets, isCustom,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"theme" | "widget">("theme");
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(currentThemeId);
  const [widgets, setWidgets] = useState<ThemeWidget[]>(currentWidgets);
  const router = useRouter();

  function handleThemeSelect(themeId: string) {
    if (themeId === selectedId || isPending) return;
    if (themeId === "custom") {
      setTab("widget");
      setSelectedId("custom");
      return;
    }
    startTransition(async () => {
      try {
        await saveGuildTheme(guildId, themeId, guildCode);
        const theme = THEMES.find((t) => t.id === themeId);
        if (theme) setWidgets(theme.widgets);
        setSelectedId(themeId);
        toast.success("테마가 변경됐어요");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("테마 변경에 실패했어요");
      }
    });
  }

  function toggleEnabled(id: WidgetId) {
    setWidgets((prev) => {
      const exists = prev.find((w) => w.id === id);
      if (exists) {
        return prev.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w);
      }
      return [...prev, { id, wide: false, enabled: true }];
    });
  }

  function toggleWide(id: WidgetId) {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, wide: !w.wide } : w));
  }

  function moveUp(id: WidgetId) {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  }

  function moveDown(id: WidgetId) {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  }

  function getWidget(id: WidgetId): ThemeWidget {
    return widgets.find((w) => w.id === id) ?? { id, wide: false, enabled: false };
  }

  function handleSaveCustom() {
    startTransition(async () => {
      try {
        await saveCustomLayout(guildId, guildCode, widgets);
        toast.success("레이아웃이 저장됐어요");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("저장에 실패했어요");
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
          <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                {tab === "widget" && (
                  <button
                    onClick={() => setTab("theme")}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-0.5">
                    {tab === "theme" ? "THEME" : "WIDGET BUILDER"}
                  </p>
                  <h2 className="text-base font-bold text-white">
                    {tab === "theme" ? "테마 선택" : "위젯 구성"}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 전환 버튼 */}
            {tab === "theme" && (
              <div className="flex gap-1 px-6 pt-4 shrink-0">
                <button
                  onClick={() => setTab("theme")}
                  className="px-4 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-bold"
                >
                  테마 프리셋
                </button>
                <button
                  onClick={() => setTab("widget")}
                  className="px-4 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 text-xs font-medium transition-colors"
                >
                  위젯 직접 구성 ✨
                </button>
              </div>
            )}

            {/* 테마 그리드 */}
            {tab === "theme" && (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1">
                {THEMES.filter((t) => t.id !== "custom").map((theme) => {
                  const isSelected = selectedId === theme.id && !isCustom;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
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
                      <p className="text-[10px] font-mono text-zinc-600 mt-1.5">
                        위젯 {theme.widgets.length}개
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 위젯 빌더 */}
            {tab === "widget" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs text-zinc-500 px-1 mb-3">
                  위젯을 켜고 끄거나 순서를 바꿔보세요. 넓게 표시(전체 너비)도 설정 가능해요.
                </p>
                {ALL_WIDGET_IDS.map((id, index) => {
                  const w = getWidget(id);
                  const meta = WIDGET_META[id];
                  const isEnabled = w.enabled;
                  const orderedIdx = widgets.findIndex((ww) => ww.id === id);

                  return (
                    <div
                      key={id}
                      className={
                        "flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors " +
                        (isEnabled
                          ? "bg-zinc-800/60 border-violet-500/20"
                          : "bg-zinc-900/40 border-zinc-800 opacity-50")
                      }
                    >
                      <span className="text-lg shrink-0">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{meta.label}</p>
                        <p className="text-[11px] text-zinc-500">{meta.description}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* 넓게 토글 */}
                        {isEnabled && (
                          <button
                            onClick={() => toggleWide(id)}
                            className={
                              "px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors " +
                              (w.wide
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-zinc-700/50 text-zinc-500 hover:text-zinc-300")
                            }
                          >
                            {w.wide ? "넓게" : "보통"}
                          </button>
                        )}

                        {/* 순서 */}
                        {isEnabled && (
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveUp(id)}
                              disabled={orderedIdx <= 0}
                              className="p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveDown(id)}
                              disabled={orderedIdx >= widgets.length - 1}
                              className="p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* ON/OFF */}
                        <button
                          onClick={() => toggleEnabled(id)}
                          className="ml-1"
                        >
                          {isEnabled
                            ? <ToggleRight className="w-7 h-7 text-violet-400" />
                            : <ToggleLeft className="w-7 h-7 text-zinc-600" />
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 위젯 빌더 저장 버튼 */}
            {tab === "widget" && (
              <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
                <button
                  onClick={handleSaveCustom}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition disabled:opacity-40"
                >
                  {isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" />
                  }
                  레이아웃 저장
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
