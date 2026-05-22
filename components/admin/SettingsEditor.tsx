"use client";

import { useState } from "react";
import { updateSetting } from "@/app/admin/settings/actions";
import { Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Setting = { key: string; value: number; description: string };

const KEY_META: {
  [key: string]: {
    label: string;
    unit: string;
    min: number;
    max: number;
    hint: string;
  };
} = {
  attendance_points: {
    label: "출석 포인트",
    unit: "P",
    min: 1,
    max: 100,
    hint: "출석 1회당 개인·길드에 동시 적립되는 포인트",
  },
  attendance_reset_hour: {
    label: "출석 리셋 시간",
    unit: "시 (KST)",
    min: 0,
    max: 23,
    hint: "매일 이 시간 이후 출석이 새로 시작돼요. 현재: 오전 6시",
  },
  max_guild_members: {
    label: "길드 최대 인원",
    unit: "명",
    min: 10,
    max: 500,
    hint: "새 길드 생성 시 기본으로 적용되는 최대 인원",
  },
};

export default function SettingsEditor({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState<{ [key: string]: number }>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSave(key: string) {
    setSaving(key);
    try {
      await updateSetting(key, values[key]);
      toast.success("저장됐어요");
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 divide-y divide-slate-100">
      {settings.map((s) => {
        const meta = KEY_META[s.key];
        if (!meta) return null;
        const current = values[s.key] ?? s.value;
        const isSaving = saving === s.key;
        const isDirty = current !== s.value;

        return (
          <div key={s.key} className="p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-slate-900">{meta.label}</p>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {s.key}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{meta.hint}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          [s.key]: Math.max(meta.min, (prev[s.key] ?? s.value) - 1),
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm transition"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={meta.min}
                      max={meta.max}
                      value={current}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [s.key]: Number(e.target.value),
                        }))
                      }
                      className="w-16 text-center px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                    />
                    <button
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          [s.key]: Math.min(meta.max, (prev[s.key] ?? s.value) + 1),
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm transition"
                    >
                      +
                    </button>
                    <span className="text-xs text-slate-500">{meta.unit}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave(s.key)}
                disabled={isSaving || !isDirty}
                className={
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition shrink-0 mt-1 " +
                  (isDirty
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed")
                }
              >
                {isSaving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />
                }
                저장
              </button>
            </div>

            {/* 범위 표시 */}
            <div className="mt-3">
              <input
                type="range"
                min={meta.min}
                max={meta.max}
                value={current}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [s.key]: Number(e.target.value),
                  }))
                }
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                <span>{meta.min}</span>
                <span>{meta.max}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
