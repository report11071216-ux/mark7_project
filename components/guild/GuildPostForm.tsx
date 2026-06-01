"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { ChevronLeft, PenLine, Loader2, ImagePlus, X } from "lucide-react";
import { createGuildPost } from "@/app/guild/[code]/posts/actions";
import { BOARD_CATEGORIES, type BoardCategory } from "@/lib/guild-board";
import toast from "react-hot-toast";

type Props = {
  guildCode: string;
  guildName: string;
  isStaff: boolean;
};

const MAX_IMAGES = 10;

export default function GuildPostForm({ guildCode, guildName, isStaff }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<BoardCategory>("free");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const available = BOARD_CATEGORIES.filter((c) => isStaff || !c.staffOnly);

  function getClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      toast.error(`이미지는 최대 ${MAX_IMAGES}장까지예요`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const supabase = getClient();
    const newUrls: string[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 올릴 수 있어요");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 은 5MB를 넘어요`);
        continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${guildCode}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`업로드 실패: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      if (data?.publicUrl) newUrls.push(data.publicUrl);
    }

    setImageUrls((prev) => prev.concat(newUrls));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력하세요");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력하세요");
      return;
    }
    if (uploading) {
      toast.error("이미지 업로드가 끝날 때까지 기다려주세요");
      return;
    }

    startTransition(async () => {
      const result = await createGuildPost(guildCode, {
        title: title.trim(),
        content: content.trim(),
        category,
        imageUrls,
      });
      if (result.success && result.postId) {
        if ((result as any).imageWarning) {
          toast.error("글은 등록됐지만 일부 이미지가 저장되지 않았어요");
        } else {
          toast.success("글이 등록되었어요");
        }
        router.push(`/guild/${guildCode}/posts/${result.postId}`);
      } else {
        toast.error(result.error ?? "등록에 실패했어요");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-5">
          <Link
            href={`/guild/${guildCode}/posts`}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-violet-500" />
            <h1 className="text-lg font-bold text-slate-900">글쓰기</h1>
          </div>
          <span className="text-xs text-violet-500 font-mono ml-1">{guildName}</span>
        </div>

        <div className="space-y-4">
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">분류</label>
            <div className="flex flex-wrap gap-2">
              {available.map((c) => {
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`px-3.5 h-9 rounded-lg text-sm font-bold transition ${
                      active
                        ? c.activeClass
                        : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            {category === "notice" && (
              <p className="text-[11px] text-amber-600 mt-2">
                공지로 등록하면 게시판 상단에 고정되고 디스코드 알림이 전송돼요
              </p>
            )}
            {(category === "flex" || category === "custom") && (
              <p className="text-[11px] text-violet-600 mt-2">
                이미지를 올리면 갤러리로 멋지게 보여져요
              </p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
              className="w-full px-3.5 py-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-y leading-relaxed"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              이미지 <span className="text-slate-400 font-normal">({imageUrls.length}/{MAX_IMAGES})</span>
            </label>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                {imageUrls.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={url} alt={`이미지 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageUrls.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-20 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-500 transition flex flex-col items-center justify-center gap-1 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-bold">업로드 중...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs font-bold">이미지 추가 (최대 5MB)</span>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <Link
              href={`/guild/${guildCode}/posts`}
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
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
              등록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
