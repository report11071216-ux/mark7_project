"use client";

import { useState } from "react";
import { Palette, ImageIcon, Award, ShoppingBag, Lock, Pencil, X } from "lucide-react";

const NICKNAME_COLORS = [
  { label: "기본", hex: "#1e293b" },
  { label: "골드", hex: "#f59e0b" },
  { label: "바이올렛", hex: "#8b5cf6" },
  { label: "사이안", hex: "#06b6d4" },
  { label: "로즈", hex: "#f43f5e" },
  { label: "에메랄드", hex: "#10b981" },
  { label: "스카이", hex: "#0ea5e9" },
  { label: "오렌지", hex: "#f97316" },
];

type Props = {
  username: string;
};

export default function ProfileEdit({ username }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#1e293b");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-bold transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        프로필 수정
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-sm font-bold text-slate-900">프로필 수정</h2>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                  Edit Profile
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">

              {/* 닉네임 색상 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    닉네임 색상
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <p className="text-sm font-bold" style={{ color: selectedColor }}>
                      {username || "닉네임"}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">미리보기</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {NICKNAME_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setSelectedColor(c.hex)}
                        title={c.label}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          selectedColor === c.hex
                            ? "border-blue-500 scale-125 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">
                    * 추가 색상은 포인트샵에서 구매 후 적용됩니다
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

              {/* 포인트샵 버튼 */}
              <button
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                포인트샵 오픈 예정
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
          {label}
        </p>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 hover:border-slate-300 transition">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{description}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{hint}</p>
        </div>
      </div>
    </div>
  );
}
