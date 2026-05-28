"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Swords, Upload, Loader2, Coins } from "lucide-react";
import { createRaidEntry } from "@/app/guild/[code]/raids/actions";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  guildName: string;
};

export default function RaidEntryForm({ guildCode, guildName }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [goldNormal, setGoldNormal] = useState("");
  const [goldHard, setGoldHard] = useState("");
  const [goldNightmare, setGoldNightmare] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있어요");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("5MB 이하 이미지만 업로드할 수 있어요");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from("raid-images").upload(fileName, file);
    if (error) {
      toast.error("업로드 실패: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("raid-images").getPublicUrl(fileName);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("이미지 업로드 완료");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("레이드명을 입력하세요");
      return;
    }

    startTransition(async () => {
      const result = await createRaidEntry(guildCode, {
        title: title.trim(),
        image_url: imageUrl || null,
        gold_normal: parseInt(goldNormal, 10) || 0,
        gold_hard: parseInt(goldHard, 10) || 0,
        gold_nightmare: parseInt(goldNightmare, 10) || 0,
      });
      if (result.success) {
        toast.success("레이드가 등록되었어요");
        router.push(`/guild/${guildCode}/raids`);
      } else {
        toast.error(result.error ?? "등록에 실패했어요");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-5">
          <Link
            href={`/guild/${guildCode}/raids`}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-violet-500" />
            <h1 className="text-lg font-bold text-slate-900">레이드 등록</h1>
          </div>
          <span className="text-xs text-violet-500 font-mono ml-1">{guildName}</span>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          레이드를 등록하면 레이드 위젯에 카드로 표시돼요. 일정은 캘린더에서 따로 잡을 수 있어요.
        </p>

        <div className="space-y-4">
          {/* 레이드명 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">레이드명</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 종막: 최후의 날"
              maxLength={60}
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>

          {/* 이미지 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              레이드 이미지
            </label>
            <label className={`flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 text-sm cursor-pointer transition ${
              uploading ? "bg-slate-50 text-slate-400" : "bg-white hover:bg-slate-50 text-slate-700"
            }`}>
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />업로드 중...</>
              ) : (
                <><Upload className="w-4 h-4" />{imageUrl ? "이미지 변경" : "이미지 선택 (5MB 이하)"}</>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} className="hidden" />
            </label>
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 aspect-[4/3]">
                <img src={imageUrl} alt="미리보기" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* 난이도별 클리어 골드 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              난이도별 클리어 골드
            </label>
            <div className="space-y-2">
              {[
                { label: "노말", value: goldNormal, set: setGoldNormal, color: "text-slate-600" },
                { label: "하드", value: goldHard, set: setGoldHard, color: "text-rose-500" },
                { label: "나이트메어", value: goldNightmare, set: setGoldNightmare, color: "text-violet-600" },
              ].map((g) => (
                <div key={g.label} className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-16 shrink-0 ${g.color}`}>{g.label}</span>
                  <input
                    value={g.value}
                    onChange={(e) => g.set(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="0"
                    inputMode="numeric"
                    className="flex-1 h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 shrink-0">G</span>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <Link
              href={`/guild/${guildCode}/raids`}
              className="flex-1 h-11 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition flex items-center justify-center"
            >
              취소
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || uploading}
              className="flex-1 h-11 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
              레이드 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
