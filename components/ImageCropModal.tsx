"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Loader2, Check, ZoomIn } from "lucide-react";

type Props = {
  imageSrc: string;          // 원본 미리보기 URL (createObjectURL)
  aspect: number;            // 자를 비율 (예: 16/5, 1, 16/6, 4/3)
  title?: string;
  onCropped: (blob: Blob) => void;
  onCancel: () => void;
  processing?: boolean;      // 업로드 중 표시
};

type Area = { x: number; y: number; width: number; height: number };

export default function ImageCropModal({
  imageSrc, aspect, title, onCropped, onCancel, processing,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!areaPixels) return;
    const blob = await getCroppedBlob(imageSrc, areaPixels);
    if (blob) onCropped(blob);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">{title ?? "이미지 자르기"}</p>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 크롭 영역 */}
        <div className="relative w-full bg-slate-900" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
          />
        </div>

        {/* 줌 슬라이더 */}
        <div className="px-4 py-3 flex items-center gap-3 border-t border-slate-100">
          <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-violet-600"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 p-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 h-10 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={processing || !areaPixels}
            className="flex-1 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

// 원본 이미지에서 선택 영역을 잘라 Blob 반환
async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob | null> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = area.width;
  canvas.height = area.height;

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
