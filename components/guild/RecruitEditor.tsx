"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import toast from "react-hot-toast";
import { saveRecruitInfo, type RecruitInput } from "@/app/guild/[code]/admin/recruit-actions";

const ALL_TAGS = ["레이드", "친목", "입문환영", "고인물", "매너"];

type Props = {
  guildCode: string;
  initial: {
    isRecruiting: boolean;
    description: string;
    tags: string[];
    discordUrl: string;
    recruitMessage: string;
  };
};

export default function RecruitEditor({ guildCode, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isRecruiting, setIsRecruiting] = useState(initial.isRecruiting);
  const [description, setDescription] = useState(initial.description ?? "");
  const [tags, setTags] = useState<string[]>(initial.tags ?? []);
  const [discordUrl, setDiscordUrl] = useState(initial.discordUrl ?? "");
  const [recruitMessage, setRecruitMessage] = useState(initial.recruitMessage ?? "");

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    setSaving(true);
    const input: RecruitInput = { isRecruiting, description, tags, discordUrl, recruitMessage };
    const res = await saveRecruitInfo(guildCode, input);
    setSaving(false);
    if (res.success) {
      toast.success("모집 공고가 저장되었어요");
      setOpen(false);
    } else {
      toast.error(res.error ?? "저장 실패");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
      >
        <Speakerphone className="w-4 h-4" />
        모집 공고 작성
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Speakerphone className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-slate-900">모집 공고 작성</p>
                <p className="text-xs text-slate-400">광장 모집 게시판에 노출돼요</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* 모집중 토글 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">모집 중</p>
                  <p className="text-xs text-slate-400">끄면 게시판에서 숨겨져요</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecruiting((v) => !v)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${isRecruiting ? "bg-violet-600" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isRecruiting ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>

              {/* 한줄 소개 */}
              <div>
                <label className="text-sm font-bold text-slate-900 block mb-1.5">한줄 소개</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={40}
                  placeholder="우리 길드를 한 줄로 소개해주세요"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <p className="text-[11px] text-slate-400 mt-1">카드에 보이는 대표 문구 ({description.length}/40)</p>
              </div>

              {/* 성향 태그 */}
              <div>
                <label className="text-sm font-bold text-slate-900 block mb-1.5">
                  성향 태그 <span className="text-slate-400 font-normal">(중복 선택)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => {
                    const active = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          active ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 상세 모집 글 */}
              <div>
                <label className="text-sm font-bold text-slate-900 block mb-1.5">
                  상세 모집 글 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <textarea
                  value={recruitMessage}
                  onChange={(e) => setRecruitMessage(e.target.value)}
                  maxLength={500}
                  placeholder="모집 대상, 활동 시간, 분위기 등을 자유롭게 적어주세요."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              {/* 디스코드 */}
              <div>
                <label className="text-sm font-bold text-slate-900 block mb-1.5">
                  디스코드 링크 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                  placeholder="discord.gg/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex gap-2 p-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? "저장 중..." : "공고 저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
