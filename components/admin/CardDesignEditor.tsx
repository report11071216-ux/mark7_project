"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Loader2, Palette } from "lucide-react";
import { saveCardGradeDesign } from "@/app/admin/shop/actions";
import GuildCard from "@/components/guild/GuildCard";

type EffectConf = { [key: string]: any };
type DesignConf = { [effect: string]: EffectConf };
type GradeDesigns = { [grade: string]: DesignConf };

const GRADES = ["rare", "unique", "epic", "legend"];
const GRADE_LABEL: { [k: string]: string } = { rare: "RARE", unique: "UNIQUE", epic: "EPIC", legend: "LEGEND" };

const PALETTE = ["#fac775", "#ef4444", "#5dcaa5", "#a78bfa", "#3b82f6", "#ec4899", "#f8fafc", "#fde68a"];

// 효과 정의: 어떤 조정 항목을 가지는지
const EFFECTS: { key: string; label: string; fields: string[] }[] = [
  { key: "border", label: "테두리", fields: ["color", "width"] },
  { key: "glow", label: "글로우", fields: ["color", "strength"] },
  { key: "shine", label: "흐르는 광택", fields: ["speed"] },
  { key: "holo", label: "홀로그램", fields: ["speed"] },
  { key: "pulse", label: "테두리 펄스", fields: ["color", "speed"] },
  { key: "sparkle", label: "반짝이 입자", fields: ["density"] },
  { key: "streak", label: "빛줄기 스윕", fields: ["speed"] },
  { key: "borderFlow", label: "테두리 흐름", fields: ["speed"] },
  { key: "breathe", label: "숨쉬는 글로우", fields: ["color", "speed"] },
  { key: "bgShift", label: "그라데이션 이동", fields: ["speed"] },
  { key: "noise", label: "노이즈/질감", fields: ["strength"] },
  { key: "tilt", label: "각도 반사", fields: ["speed"] },
  { key: "glint", label: "모서리 광채", fields: ["color"] },
];

export default function CardDesignEditor({ initial }: { initial: GradeDesigns }) {
  const [grade, setGrade] = useState("epic");
  const [designs, setDesigns] = useState<GradeDesigns>(initial);
  const [isPending, startTransition] = useTransition();

  const d = designs[grade] ?? {};

  function update(effect: string, patch: EffectConf) {
    setDesigns((prev) => {
      const next = { ...prev };
      const cur = { ...(next[grade] ?? {}) };
      cur[effect] = { ...(cur[effect] ?? {}), ...patch };
      next[grade] = cur;
      return next;
    });
  }

  function isOn(effect: string) {
    return d[effect] && d[effect].on === true;
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveCardGradeDesign(grade, designs[grade] ?? {});
      if (res.success) {
        toast.success(GRADE_LABEL[grade] + " 디자인을 저장했어요");
      } else {
        toast.error(res.error ?? "저장에 실패했어요");
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Palette className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">명함 등급 디자인</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            등급별 효과를 켜고 색·속도를 조정해요. 저장하면 모든 카드에 반영됩니다. (효과는 2~4개 조합을 권장)
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGrade(g)}
            className={
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition " +
              (grade === g
                ? "bg-violet-600 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300")
            }
          >
            {GRADE_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        <div>
          <div className="rounded-xl overflow-hidden">
            <GuildCard
              guildName="미리보기 길드"
              server="루페온 서버"
              grade={grade}
              tierLabel="마스터"
              tierColor="#9333ea"
              statText="미리보기"
              design={designs[grade] ?? null}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            오른쪽 설정대로 실시간으로 바뀌어요. 저장 전이라도 미리보기에는 반영됩니다.
          </p>
        </div>

        <div className="space-y-2">
          {EFFECTS.map((eff) => {
            const on = isOn(eff.key);
            return (
              <div key={eff.key} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{eff.label}</span>
                  <button
                    type="button"
                    onClick={() => update(eff.key, { on: !on })}
                    className={
                      "relative w-10 h-6 rounded-full transition " +
                      (on ? "bg-violet-600" : "bg-slate-300")
                    }
                  >
                    <span
                      className={
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all " +
                        (on ? "left-5" : "left-1")
                      }
                    />
                  </button>
                </div>

                {on ? (
                  <div className="mt-3 space-y-2.5">
                    {eff.fields.includes("color") ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => update(eff.key, { color: c })}
                            className={
                              "w-6 h-6 rounded-md transition " +
                              ((d[eff.key]?.color ?? "") === c ? "ring-2 ring-offset-1 ring-slate-900" : "")
                            }
                            style={{ background: c }}
                            aria-label={"색상 " + c}
                          />
                        ))}
                      </div>
                    ) : null}

                    {eff.fields.includes("speed") ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-12 shrink-0">속도</span>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          step={0.5}
                          value={d[eff.key]?.speed ?? 3}
                          onChange={(e) => update(eff.key, { speed: parseFloat(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">
                          {(d[eff.key]?.speed ?? 3).toFixed(1)}s
                        </span>
                      </div>
                    ) : null}

                    {eff.fields.includes("width") ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-12 shrink-0">두께</span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={d[eff.key]?.width ?? 2}
                          onChange={(e) => update(eff.key, { width: parseInt(e.target.value, 10) })}
                          className="flex-1"
                        />
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">
                          {d[eff.key]?.width ?? 2}px
                        </span>
                      </div>
                    ) : null}

                    {eff.fields.includes("strength") ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-12 shrink-0">세기</span>
                        <input
                          type="range"
                          min={1}
                          max={40}
                          step={1}
                          value={d[eff.key]?.strength ?? 16}
                          onChange={(e) => update(eff.key, { strength: parseInt(e.target.value, 10) })}
                          className="flex-1"
                        />
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">
                          {d[eff.key]?.strength ?? 16}
                        </span>
                      </div>
                    ) : null}

                    {eff.fields.includes("density") ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-12 shrink-0">밀도</span>
                        <input
                          type="range"
                          min={1}
                          max={6}
                          step={1}
                          value={d[eff.key]?.density ?? 3}
                          onChange={(e) => update(eff.key, { density: parseInt(e.target.value, 10) })}
                          className="flex-1"
                        />
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">
                          {d[eff.key]?.density ?? 3}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full h-11 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {GRADE_LABEL[grade]} 디자인 저장
          </button>
        </div>
      </div>
    </div>
  );
}
