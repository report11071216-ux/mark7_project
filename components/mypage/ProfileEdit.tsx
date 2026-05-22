"use client";

import { useState } from "react";
import Link from "next/link";
import { Palette, ImageIcon, Award, ShoppingBag, Lock } from "lucide-react";

const NICKNAME_COLORS = [
  { label: "기본", hex: "#ffffff" },
  { label: "골드", hex: "#fbbf24" },
  { label: "바이올렛", hex: "#a78bfa" },
  { label: "사이안", hex: "#22d3ee" },
  { label: "로즈", hex: "#fb7185" },
  { label: "에메랄드", hex: "#34d399" },
  { label: "스카이", hex: "#38bdf8" },
  { label: "오렌지", hex: "#fb923c" },
];

type Props = {
  username: string;
};

export default function ProfileEdit({ username }: Props) {
  const [selectedColor, setSelectedColor] = useState("#ffffff");

  return (
    <div className="space-y-6">
      {/* 닉네임 색상 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            닉네임 색상
          </p>
          <span className="text-[10px] font-mono text-zinc-600 ml-auto">
            포인트샵 구매 후 적용
          </span>
        </div>
        <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold" style={{ color: selectedColor }}>
              {username}
            </p>
            <span className="text-[10px] font-mono text-zinc-600">미리보기</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {NICKNAME_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c.hex)}
                title={c.label}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  selectedColor === c.hex
                    ? "border-amber-400 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <p className="text-[10px] font-mono text-zinc-600">
            * 색상 아이템은 포인트샵에서 구매 후 실제 적용됩니다
          </p>
        </div>
      </div>

      {/* 프로필 카드 */}
      <ShopItemSlot
        icon={ImageIcon}
        label="프로필 카드"
        description="장착된 카드가 없어요"
        hint="블랙 바이퍼, 네온 레이드 등"
      />

      {/* 아이콘 */}
      <ShopItemSlot
        icon={Award}
        label="프로필 아이콘"
        description="장착된 아이콘이 없어요"
        hint="길드 전용 아이콘, 시즌 아이콘 등"
      />

      {/* 뱃지 */}
      <ShopItemSlot
        icon={Award}
        label="칭호 뱃지"
        description="장착된 뱃지가 없어요"
        hint="랭킹 보상, 이벤트 한정 뱃지 등"
      />

      <Link
        href="/plaza"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-amber-500/30 text-amber-500 text-xs font-bold hover:bg-amber-500/10 transition"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        포인트샵 오픈 예정
      </Link>
    </div>
  );
}

function ShopItemSlot({
  icon: Icon,
  label,
  description,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
          {label}
        </p>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-zinc-600" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">{description}</p>
          <p className="text-[10px] font-mono text-zinc-700 mt-0.5">{hint}</p>
        </div>
      </div>
    </div>
  );
}
