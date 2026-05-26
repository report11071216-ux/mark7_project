"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Swords, Upload, Loader2, Image } from "lucide-react";
import { createRaid } from "@/app/guild/[code]/raids/actions";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  guildName: string;
};

const DIFFICULTIES = ["노말", "하드", "나이트메어"];
const SKILL_LEVELS = ["트라이", "클경", "반숙", "숙련"];

export default function RaidForm({ guildCode, guildName }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [maxMembers, setMaxMembers] = useState(8);
  const [difficulty, setDifficulty] = useState("노말");
  const [skillLevel, setSkillLevel] = useState("트라이");
  const [raidDate, setRaidDate] = useState("");
  const [raidTime, setRaidTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
    if (!raidDate) {
      toast.error("날짜를 선택하세요");
      return;
    }
    if (!raidTime) {
      toast.error("시간을 선택하세요");
      return;
    }

    startTransition(async () => {
      const result = await createRaid(guildCode, {
        title: title.trim(),
        max_members: maxMembers,
        difficulty,
        skill_level: skillLevel,
        raid_date: raidDate,
        raid_time: raidTime,
        image_url: imageUrl || null,
      });
      if (result.success) {
        toast.success("레이드가 생성되었어요");
        router.push(`/guild/${guildCode}/raids`);
      } else {
        toast.error(result.error ?? "생성에 실패했어요");
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href={`/guild/${guildCode}/raids`}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-violet-300" />
          <h1 className="text-lg font-bold text-white">레이드 생성</h1>
        </div>
        <span className="text-xs text-violet-300 font-mono ml-1">{guildName}</span>
      </div>

      <div className="space-y-4">
        {/* 레이드명 */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">레이드명</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 종막: 최후의 날"
            maxLength={60}
            className="w-full h-11 px-3.5 rounded-lg bg-card/60 ring-1 ring-border text-sm text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>

        {/* 인원 */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">인원</label>
          <div className="flex gap-2">
            {[4, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxMembers(n)}
                className={`flex-1 h-10 rounded-lg text-sm font-bold transition ${
                  maxMembers === n
                    ? "bg-violet-600 text-white"
                    : "bg-card/60 ring-1 ring-border text-muted-foreground hover:text-white"
                }`}
              >
                {n}인
              </button>
            ))}
          </div>
        </div>

        {/* 난이도 */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">난이도</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 h-10 rounded-lg text-sm font-bold transition ${
                  difficulty === d
                    ? "bg-violet-600 text-white"
                    : "bg-card/60 ring-1 ring-border text-muted-foreground hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 숙련도 */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">숙련도</label>
          <div className="flex gap-2">
            {SKILL_LEVELS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkillLevel(s)}
                className={`flex-1 h-10 rounded-lg text-sm font-bold transition ${
                  skillLevel === s
                    ? "bg-cyan-600 text-white"
                    : "bg-card/60 ring-1 ring-border text-muted-foreground hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 · 시간 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">날짜</label>
            <input
              type="date"
              value={raidDate}
              onChange={(e) => setRaidDate(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-card/60 ring-1 ring-border text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">시간</label>
            <input
              type="time"
              value={raidTime}
              onChange={(e) => setRaidTime(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-card/60 ring-1 ring-border text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>

        {/* 이미지 */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            레이드 이미지 <span className="text-muted-foreground">(선택)</span>
          </label>
          <label className={`flex items-center justify-center gap-2 h-11 rounded-lg ring-1 ring-border text-sm cursor-pointer transition ${
            uploading ? "bg-card/40 text-muted-foreground" : "bg-card/60 hover:bg-card text-white"
          }`}>
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />업로드 중...</>
            ) : (
              <><Upload className="w-4 h-4" />{imageUrl ? "이미지 변경" : "이미지 선택 (5MB 이하)"}</>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} className="hidden" />
          </label>
          {imageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden ring-1 ring-border aspect-[4/3]">
              <img src={imageUrl} alt="미리보기" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/guild/${guildCode}/raids`}
            className="flex-1 h-11 rounded-lg bg-white/5 text-sm font-bold text-muted-foreground hover:bg-white/10 transition flex items-center justify-center"
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
            레이드 생성
          </button>
        </div>
      </div>
    </div>
  );
}
