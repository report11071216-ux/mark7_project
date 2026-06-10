"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createGuildCard, toggleGuildCard, deleteGuildCard } from "@/app/admin/guild-cards/actions";
import { Upload, Loader2, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import toast from "react-hot-toast";
import ImageCropModal from "@/components/ImageCropModal";
import GuildCard from "@/components/guild/GuildCard";

type EffectConf = { [key: string]: any };
type DesignConf = { [effect: string]: EffectConf };

export type CardRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  design: DesignConf;
  price: number;
  is_active: boolean;
};

const PALETTE = ["#fac775", "#ef4444", "#5dcaa5", "#a78bfa", "#3b82f6", "#ec4899", "#f8fafc", "#fde68a"];

const EFFECTS: { key: string; label: string; fields: string[] }[] = [
  { key: "border", label: "테두리", fields: ["color", "width"] },
  { key: "glow", label: "글로우", fields: ["color", "strength"] },
  { key: "shine", label: "흐르는 광택", fields: ["speed"] },
  { key: "holo", label: "홀로그램", fields: ["speed"] },
  { key: "pulse", label: "테두리 펄스", fields: ["color", "speed"] },
  { key: "sparkle", label: "반짝이 입자", fields: ["density"] },
  { key: "streak", label: "빛줄기 스윕", fields: ["speed"] },
  { key: "borderFlow", label: "테두리 흐름", fields: ["speed"] },
  { key: "breathe", label: "숨쉬는 글로우", fields: ["color", "speed"] },
  { key: "bgShift", label: "그라데이션 이동", fields: ["speed"] },
  { key: "noise", label: "노이즈/질감", fields: ["strength"] },
  { key: "tilt", label: "각도 반사", fields: ["speed"] },
  { key: "glint", label: "모서리 광채", fields: ["color"] },
];

export default function GuildCardBuilder({ cards }: { cards: CardRow[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [design, setDesign] = useState<DesignConf>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function update(effect: string, patch: EffectConf) {
    setDesign((prev) => {
      const next = { ...prev };
      next[effect] = { ...(next[effect] ?? {}), ...patch };
      return next;
    });
  }
  function isOn(effect: string) {
    return design[effect] && design[effect].on === true;
  }

  const uploadBlob = async (blob: Blob, ext = "jpg", contentType = "image/jpeg") => {
    setUploading(true);
    const supabase = createClient();
    const fileName = `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("shop-items").upload(fileName, blob, { contentType });
    if (error) {
      toast.error("업로드 실패: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("shop-items").getPublicUrl(fileName);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("배경 이미지 업로드 완료");
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있어요");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("20MB 이하만 업로드할 수 있어요");
      return;
    }
    if (file.type === "image/gif") {
      toast("GIF는 자르지 않고 원본 그대로 올라가요. 가로형(16:6.5) GIF를 권장해요.", { icon: "🎬" });
      uploadBlob(file, "gif", "image/gif");
      e.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    e.target.value = "";
  };

  const handleCropped = async (blob: Blob) => {
    await uploadBlob(blob);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };
  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("카드 이름을 입력하세요");
      return;
    }
    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("가격을 올바르게 입력하세요");
      return;
    }
    setSubmitting(true);
    const res = await createGuildCard({
      name,
      description,
      image_url: imageUrl,
      design,
      price: priceNum,
    });
    setSubmitting(false);
    if (res.success) {
      toast.success("카드를 등록했어요");
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setDesign({});
      router.refresh();
    } else {
      toast.error(res.error ?? "등록 실패");
    }
  };

  const handleToggle = async (c: CardRow) => {
    const res = await toggleGuildCard(c.id, !c.is_active);
    if (res.success) {
      toast.success(c.is_active ? "숨김 처리됨" : "판매중으로 전환됨");
      router.refresh();
    } else {
      toast.error(res.error ?? "변경 실패");
    }
  };

  const handleDelete = async (c: CardRow) => {
    if (!confirm(`'${c.name}' 카드를 삭제할까요?`)) return;
    const res = await deleteGuildCard(c.id);
    if (res.success) {
      toast.success("삭제되었습니다");
      router.refresh();
    } else {
      toast.error(res.error ?? "삭제 실패");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="bg-white rounded-xl ring-1 ring-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">새 카드 만들기</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">카드 이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 불꽃 레전드"
                className="w-full h-10 px-3 rounded-lg ring-1 ring-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">가격 (P)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="3000"
                inputMode="numeric"
                className="w-full h-10 px-3 rounded-lg ring-1 ring-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">설명 (선택)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="카드 설명"
              className="w-full h-10 px-3 rounded-lg ring-1 ring-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              배경 이미지 <span className="text-slate-400 font-normal">(가로 16:6.5 · GIF 가능)</span>
            </label>
            <label className={`flex items-center justify-center gap-2 h-10 rounded-lg ring-1 ring-slate-200 text-sm cursor-pointer transition ${uploading ? "bg-slate-100 text-slate-400" : "hover:bg-slate-50 text-slate-600"}`}>
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />업로드 중...</>
              ) : (
                <><Upload className="w-4 h-4" />{imageUrl ? "배경 변경" : "배경 이미지 선택 (20MB 이하)"}</>
              )}
              <input type="file" accept="image/*" onChange={pickFile} disabled={uploading} className="hidden" />
            </label>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-500 mb-2">효과 (2~4개 조합 권장)</p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {EFFECTS.map((eff) => {
                const on = isOn(eff.key);
                return (
                  <div key={eff.key} className="rounded-lg border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{eff.label}</span>
                      <button
                        type="button"
                        onClick={() => update(eff.key, { on: !on })}
                        className={"relative w-10 h-6 rounded-full transition " + (on ? "bg-violet-600" : "bg-slate-300")}
                      >
                        <span className={"absolute top-1 w-4 h-4 rounded-full bg-white transition-all " + (on ? "left-5" : "left-1")} />
                      </button>
                    </div>
                    {on ? (
                      <div className="mt-2.5 space-y-2">
                        {eff.fields.includes("color") ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {PALETTE.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => update(eff.key, { color: c })}
                                className={"w-6 h-6 rounded-md transition " + ((design[eff.key]?.color ?? "") === c ? "ring-2 ring-offset-1 ring-slate-900" : "")}
                                style={{ background: c }}
                                aria-label={"색 " + c}
                              />
                            ))}
                          </div>
                        ) : null}
                        {eff.fields.includes("speed") ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-10 shrink-0">속도</span>
                            <input type="range" min={1} max={10} step={0.5} value={design[eff.key]?.speed ?? 3} onChange={(e) => update(eff.key, { speed: parseFloat(e.target.value) })} className="flex-1" />
                            <span className="text-xs font-bold text-slate-700 w-10 text-right">{(design[eff.key]?.speed ?? 3).toFixed(1)}s</span>
                          </div>
                        ) : null}
                        {eff.fields.includes("width") ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-10 shrink-0">두께</span>
                            <input type="range" min={1} max={5} step={1} value={design[eff.key]?.width ?? 2} onChange={(e) => update(eff.key, { width: parseInt(e.target.value, 10) })} className="flex-1" />
                            <span className="text-xs font-bold text-slate-700 w-10 text-right">{design[eff.key]?.width ?? 2}px</span>
                          </div>
                        ) : null}
                        {eff.fields.includes("strength") ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-10 shrink-0">세기</span>
                            <input type="range" min={1} max={40} step={1} value={design[eff.key]?.strength ?? 16} onChange={(e) => update(eff.key, { strength: parseInt(e.target.value, 10) })} className="flex-1" />
                            <span className="text-xs font-bold text-slate-700 w-10 text-right">{design[eff.key]?.strength ?? 16}</span>
                          </div>
                        ) : null}
                        {eff.fields.includes("density") ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-10 shrink-0">밀도</span>
                            <input type="range" min={1} max={6} step={1} value={design[eff.key]?.density ?? 3} onChange={(e) => update(eff.key, { density: parseInt(e.target.value, 10) })} className="flex-1" />
                            <span className="text-xs font-bold text-slate-700 w-10 text-right">{design[eff.key]?.density ?? 3}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="w-full h-11 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:bg-slate-300 transition flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            카드 등록
          </button>
        </div>

        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">미리보기</p>
          <div className="rounded-xl overflow-hidden">
            <GuildCard
              guildName={name || "미리보기 길드"}
              server="루페온 서버"
              grade="custom"
              imageUrl={imageUrl || null}
              tierLabel="마스터"
              tierColor="#9333ea"
              statText={price ? parseInt(price, 10).toLocaleString() + "P" : "미리보기"}
              design={design}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            왼쪽 효과·배경이 실시간으로 반영돼요.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-900">
            등록된 카드 <span className="text-slate-400">({cards.length})</span>
          </h2>
        </div>
        {cards.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">아직 만든 카드가 없어요</div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c.id} className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
                <GuildCard
                  guildName={c.name}
                  server=" "
                  grade="custom"
                  imageUrl={c.image_url}
                  statText={c.price.toLocaleString() + "P"}
                  design={c.design}
                />
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                    <span className={"text-xs font-bold " + (c.is_active ? "text-emerald-600" : "text-slate-400")}>
                      {c.is_active ? "판매중" : "숨김"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleToggle(c)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title={c.is_active ? "숨기기" : "판매하기"}>
                      {c.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button type="button" onClick={() => handleDelete(c)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" title="삭제">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cropSrc ? (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={16 / 6.5}
          title="배경 자르기 (가로 16:6.5)"
          processing={uploading}
          onCropped={handleCropped}
          onCancel={handleCropCancel}
        />
      ) : null}
    </div>
  );
}
