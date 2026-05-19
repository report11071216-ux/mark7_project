"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateGuildTheme } from "@/app/actions/theme";

type Props = {
  guildId: string;
  guildCode: string;
  initialTheme: {
    primary_color: string | null;
    background_color: string | null;
    banner_url: string | null;
    welcome_message: string | null;
  } | null;
};

export default function ThemeEditForm({
  guildId,
  guildCode,
  initialTheme,
}: Props) {
  const router = useRouter();
  const [primaryColor, setPrimaryColor] = useState(
    initialTheme?.primary_color || "#3b82f6"
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initialTheme?.background_color || "#ffffff"
  );
  const [bannerUrl, setBannerUrl] = useState(initialTheme?.banner_url || "");
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialTheme?.welcome_message || ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateGuildTheme({
      guildId,
      guildCode,
      primaryColor,
      backgroundColor,
      bannerUrl: bannerUrl.trim(),
      welcomeMessage: welcomeMessage.trim(),
    });

    setSaving(false);

    if (result.success) {
      toast.success("테마가 저장됐어요!");
      router.refresh();
    } else {
      toast.error(result.error || "저장에 실패했어요.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 미리보기 박스 */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">미리보기</p>
        <div
          className="overflow-hidden rounded-xl border border-gray-200"
          style={{ backgroundColor }}
        >
          <div
            className="h-32 w-full"
            style={{
              background: bannerUrl
                ? `url(${bannerUrl}) center/cover`
                : `linear-gradient(135deg, ${primaryColor}, #8b5cf6)`,
            }}
          />
          <div className="p-4">
            <div
              className="inline-block rounded-md px-3 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              버튼 예시
            </div>
            {welcomeMessage && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                {welcomeMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 주 색상 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          주 색상 (버튼·강조)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder="#3b82f6"
          />
        </div>
      </div>

      {/* 배경 색상 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          배경 색상
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300"
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* 배너 URL */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          배너 이미지 URL{" "}
          <span className="text-xs text-gray-500">(선택사항)</span>
        </label>
        <input
          type="url"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          maxLength={500}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
          placeholder="https://example.com/banner.jpg"
        />
        <p className="mt-1 text-xs text-gray-500">
          이미지 호스팅 사이트(예: imgur.com)에서 직접 링크 복사. 7-C에서
          직접 업로드 기능 추가 예정.
        </p>
      </div>

      {/* 환영 메시지 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          길드 환영 메시지{" "}
          <span className="text-xs text-gray-500">(최대 500자)</span>
        </label>
        <textarea
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
          placeholder="우리 길드에 오신 것을 환영합니다!&#10;공지: 매주 토요일 9시 정기 레이드"
        />
        <p className="mt-1 text-right text-xs text-gray-500">
          {welcomeMessage.length}/500
        </p>
      </div>

      {/* 저장 버튼 */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
      >
        {saving ? "저장 중..." : "💾 저장하기"}
      </button>
    </form>
  );
}
