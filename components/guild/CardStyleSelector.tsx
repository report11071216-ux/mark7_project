"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Image as ImageIcon } from "lucide-react";
import { saveCardStyle } from "@/app/guild/[code]/admin/actions";
import toast from "react-hot-toast";

type Props = {
  guildId: string;
  guildCode: string;
  initialStyle: string;
  hasBackground: boolean;
};

const STYLES = [
  {
    key: "solid",
    label: "기본",
    desc: "흰색 카드 (깔끔)",
    preview: { card: "#ffffff", text: "#111827", bg: "#e2e8f0", border: "#e5e7eb" },
  },
  {
    key: "glass-light",
    label: "글래스 (밝게)",
    desc: "반투명 유리 · 밝은 배경에 추천",
    preview: { card: "rgba(255,255,255,0.55)", text: "#1a2332", bg: "#a8c89a", border: "rgba(255,255,255,0.7)" },
  },
  {
    key: "glass-dark",
    label: "글래스 (어둡게)",
    desc: "반투명 유리 · 어두운 배경에 추천",
    preview: { card: "rgba(20,28,44,0.55)", text: "#f1f5f9", bg: "#2a3550", border: "rgba(255,255,255,0.14)" },
  },
];

export default function CardStyleSelector({ guildId, guildCode, initialStyle, hasBackground }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialStyle || "solid");
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSelect(styleKey: string) {
    if (saving) return;
    setSelected(styleKey);
    setSaving(styleKey);
    const result = await saveCardStyle(guildId, guildCode, styleKey);
    setSaving(null);
    if (result.success) {
      toast.success("카드 스타일이 저장됐어요!");
      router.refresh();
    } else {
      toast.error(result.error ?? "저장에 실패했어요");
      setSelected(initialStyle || "solid");
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <ImageIcon className="w-4 h-4 text-violet-500" />
        <h2 className="text-base font-bold text-slate-900">카드 스타일</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        길드 배경을 장착했을 때 위젯 카드가 보이는 방식이에요.
      </p>

      {!hasBackground && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 mb-4">
          <p className="text-xs text-amber-700">
            배경을 먼저 장착해야 글래스 효과가 보여요. (보관함 → 길드 배경 → 장착)
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STYLES.map((s) => {
          const active = selected === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleSelect(s.key)}
              disabled={saving !== null}
              className={
                "relative text-left rounded-xl border-2 p-3 transition disabled:opacity-60 " +
                (active ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300 bg-white")
              }
            >
              {/* 미리보기 */}
              <div
                className="rounded-lg h-20 mb-2.5 p-2 flex flex-col gap-1.5 overflow-hidden"
                style={{ backgroundColor: s.preview.bg }}
              >
                <div
                  className="rounded h-5 flex items-center px-2"
                  style={{
                    backgroundColor: s.preview.card,
                    border: `0.5px solid ${s.preview.border}`,
                    backdropFilter: s.key !== "solid" ? "blur(4px)" : undefined,
                  }}
                >
                  <span className="text-[8px] font-bold" style={{ color: s.preview.text }}>카드</span>
                </div>
                <div
                  className="rounded flex-1"
                  style={{
                    backgroundColor: s.preview.card,
                    border: `0.5px solid ${s.preview.border}`,
                    backdropFilter: s.key !== "solid" ? "blur(4px)" : undefined,
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-bold text-slate-900">{s.label}</p>
                {active && (
                  saving === s.key
                    ? <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                    : <Check className="w-4 h-4 text-violet-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{s.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
