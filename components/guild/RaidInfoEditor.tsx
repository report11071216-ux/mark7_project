"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateRaidEntry, type RaidDetail } from "@/app/guild/[code]/raids/actions";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  raid: RaidDetail;
  onSaved: () => void;
  onCancel: () => void;
};

export default function RaidInfoEditor({ guildCode, raid, onSaved, onCancel }: Props) {
  const [goldNormal, setGoldNormal] = useState(raid.gold_normal ? String(raid.gold_normal) : "");
  const [goldHard, setGoldHard] = useState(raid.gold_hard ? String(raid.gold_hard) : "");
  const [goldNightmare, setGoldNightmare] = useState(raid.gold_nightmare ? String(raid.gold_nightmare) : "");
  const [recLevel, setRecLevel] = useState(raid.rec_item_level ? String(raid.rec_item_level) : "");
  const [recPower, setRecPower] = useState(raid.rec_combat_power ? String(raid.rec_combat_power) : "");
  const [materials, setMaterials] = useState(raid.reward_materials ?? "");
  const [isPending, startTransition] = useTransition();

  const numOnly = (v: string) => v.replace(/[^0-9]/g, "");

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRaidEntry(guildCode, {
        raidId: raid.id,
        gold_normal: parseInt(goldNormal, 10) || 0,
        gold_hard: parseInt(goldHard, 10) || 0,
        gold_nightmare: parseInt(goldNightmare, 10) || 0,
        rec_item_level: recLevel ? parseInt(recLevel, 10) : null,
        rec_combat_power: recPower ? parseInt(recPower, 10) : null,
        reward_materials: materials,
      });
      if (result.success) {
        toast.success("레이드 정보가 수정되었어요");
        onSaved();
      } else {
        toast.error(result.error ?? "수정에 실패했어요");
      }
    });
  };

  const goldRows = [
    { label: "노말", value: goldNormal, set: setGoldNormal, dot: "bg-yellow-500" },
    { label: "하드", value: goldHard, set: setGoldHard, dot: "bg-red-500" },
    { label: "나메", value: goldNightmare, set: setGoldNightmare, dot: "bg-violet-500" },
  ];

  return (
    <div className="space-y-4">
      {/* 골드 */}
      <div>
        <p className="text-xs font-bold text-slate-500 mb-2">난이도별 클리어 골드</p>
        <div className="space-y-2">
          {goldRows.map((g) => (
            <div key={g.label} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 w-14 shrink-0">
                <span className={`w-2 h-2 rounded-full ${g.dot}`} />
                <span className="text-xs font-bold text-slate-600">{g.label}</span>
              </span>
              <input
                value={g.value}
                onChange={(e) => g.set(numOnly(e.target.value))}
                placeholder="0"
                inputMode="numeric"
                className="flex-1 h-9 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
              />
              <span className="text-xs text-slate-400 shrink-0">G</span>
            </div>
          ))}
        </div>
      </div>

      {/* 적정 스펙 */}
      <div>
        <p className="text-xs font-bold text-slate-500 mb-2">적정 스펙</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 w-14 shrink-0">레벨</span>
            <input
              value={recLevel}
              onChange={(e) => setRecLevel(numOnly(e.target.value))}
              placeholder="예: 1700"
              inputMode="numeric"
              className="flex-1 h-9 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 w-14 shrink-0">전투력</span>
            <input
              value={recPower}
              onChange={(e) => setRecPower(numOnly(e.target.value))}
              placeholder="예: 5200"
              inputMode="numeric"
              className="flex-1 h-9 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 획득 재화 */}
      <div>
        <p className="text-xs font-bold text-slate-500 mb-2">획득 재화</p>
        <input
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          placeholder="예: 운명의 돌파석, 명예의 파편"
          maxLength={120}
          className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-10 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          저장
        </button>
      </div>
    </div>
  );
}
