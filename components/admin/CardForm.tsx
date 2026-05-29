"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCard } from "@/app/admin/cards/actions";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";

const GRADES = [
  { value: "common", label: "커먼 (+1P, 기본색)" },
  { value: "rare", label: "레어 (+2P, 파랑)" },
  { value: "unique", label: "유니크 (+3P, 보라)" },
  { value: "epic", label: "에픽 (+4P, 빨강)" },
];

export default function CardForm() {
  const router = useRouter();
  const [grade, setGrade] = useState("common");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${grade}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("attendance-cards")
        .upload(path, file, { upsert: false });
      if (error) {
        toast.error(`업로드 실패: ${error.message}`);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from("attendance-cards").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success("이미지 업로드 완료");
    } catch (err: any) {
      toast.error("업로드 중 오류");
    }
    setUploading(false);
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!name.trim()) {
      toast.error("카드 이름을 입력하세요");
      return;
    }
    if (!imageUrl) {
      toast.error("이미지를 업로드하세요");
      return;
    }
    setSubmitting(true);
    const result = await createCard({ grade, name: name.trim(), imageUrl });
    setSubmitting(false);
    if (result.ok) {
      toast.success("카드 등록 완료!");
      setName("");
      setImageUrl("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      {/* 등급 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">등급</label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white"
        >
          {GRADES.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">카드 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 불꽃의 모코코"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
        />
      </div>

      {/* 이미지 업로드 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">카드 이미지</label>
        {imageUrl ? (
          <div className="relative w-32">
            <div className="aspect-[3/4] rounded-lg overflow-hidden border border-slate-200">
              <img src={imageUrl} alt="미리보기" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="mt-1 text-xs text-red-500 hover:underline"
            >
              제거
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-32 aspect-[3/4] rounded-lg border-2 border-dashed border-slate-200 cursor-pointer hover:border-violet-300 transition">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-300 mb-1" />
                <span className="text-[10px] text-slate-400">업로드</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || uploading}
        className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        카드 등록
      </button>
    </div>
  );
}
