"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createShopItem, toggleShopItem, deleteShopItem } from "@/app/admin/shop/actions";
import { Upload, Loader2, Trash2, Eye, EyeOff, Plus, Image } from "lucide-react";
import toast from "react-hot-toast";

export type ShopItem = {
  id: string;
  shop_type: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  duration_hours: number | null;
  is_active: boolean;
};

const GUILD_CATEGORIES = ["길드 마크", "길드 프로필카드", "길드 닉네임 효과", "확성기"];
const ACTIVITY_CATEGORIES = ["개인 프로필카드", "개인 마크", "개인 닉네임 효과"];
const MEGAPHONE_DURATIONS = [1, 3, 6, 12];

export default function ShopItemManager({ items }: { items: ShopItem[] }) {
  const router = useRouter();

  const [shopType, setShopType] = useState("guild");
  const [category, setCategory] = useState("길드 마크");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [frameUrl, setFrameUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = shopType === "guild" ? GUILD_CATEGORIES : ACTIVITY_CATEGORIES;
  const isMegaphone = shopType === "guild" && category === "확성기";
  const isProfileCard = category.includes("프로필카드");

  const handleShopTypeChange = (type: string) => {
    setShopType(type);
    setCategory(type === "guild" ? "길드 마크" : "개인 프로필카드");
  };

  const uploadFile = async (
    file: File,
    setUrl: (u: string) => void,
    setBusy: (b: boolean) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있어요");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("5MB 이하 이미지만 업로드할 수 있어요");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("shop-items")
      .upload(fileName, file);

    if (error) {
      toast.error("업로드 실패: " + error.message);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from("shop-items").getPublicUrl(fileName);
    setUrl(data.publicUrl);
    setBusy(false);
    toast.success("이미지 업로드 완료");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, setImageUrl, setUploading);
  };

  const handleFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, setFrameUrl, setUploadingFrame);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("상품명을 입력하세요");
      return;
    }
    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("가격을 올바르게 입력하세요");
      return;
    }

    setSubmitting(true);
    const result = await createShopItem({
      shop_type: shopType,
      category,
      name,
      description,
      price: priceNum,
      image_url: imageUrl,
      frame_url: frameUrl,
      duration_hours: isMegaphone ? durationHours : null,
    });
    setSubmitting(false);

    if (result.success) {
      toast.success("상품이 등록되었습니다");
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setFrameUrl("");
      router.refresh();
    } else {
      toast.error(result.error ?? "등록 실패");
    }
  };

  const handleToggle = async (item: ShopItem) => {
    const result = await toggleShopItem(item.id, !item.is_active);
    if (result.success) {
      toast.success(item.is_active ? "숨김 처리됨" : "판매중으로 전환됨");
      router.refresh();
    } else {
      toast.error(result.error ?? "변경 실패");
    }
  };

  const handleDelete = async (item: ShopItem) => {
    if (!confirm(`'${item.name}' 상품을 삭제할까요?`)) return;
    const result = await deleteShopItem(item.id);
    if (result.success) {
      toast.success("삭제되었습니다");
      router.refresh();
    } else {
      toast.error(result.error ?? "삭제 실패");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
        {/* 폼 */}
        <div className="bg-white rounded-xl ring-1 ring-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">새 상품 등록</h2>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">상점 종류</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleShopTypeChange("guild")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                  shopType === "guild"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                길드샵
              </button>
              <button
                type="button"
                onClick={() => handleShopTypeChange("activity")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                  shopType === "activity"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                활동샵
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg ring-1 ring-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {isMegaphone && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">지속 시간</label>
              <div className="flex gap-2">
                {MEGAPHONE_DURATIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDurationHours(h)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                      durationHours === h
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {h}시간
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">상품명</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 검은 뱀 프로필카드"
              className="w-full h-10 px-3 rounded-lg ring-1 ring-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">설명 (선택)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품 설명"
              className="w-full h-10 px-3 rounded-lg ring-1 ring-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">가격 (P)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="500"
              inputMode="numeric"
              className="w-full h-10 px-3 rounded-lg ring-1 ring-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 썸네일 이미지 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              상점 썸네일 이미지
            </label>
            <label className={`flex items-center justify-center gap-2 h-10 rounded-lg ring-1 ring-slate-200 text-sm cursor-pointer transition ${
              uploading ? "bg-slate-100 text-slate-400" : "hover:bg-slate-50 text-slate-600"
            }`}>
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />업로드 중...</>
              ) : (
                <><Upload className="w-4 h-4" />{imageUrl ? "이미지 변경" : "이미지 선택 (5MB 이하)"}</>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} className="hidden" />
            </label>
          </div>

          {/* 프레임 이미지 — 프로필카드 카테고리일 때만 */}
          {isProfileCard && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                프레임 이미지 <span className="text-blue-500">(프로필카드 적용용 · 비워두면 썸네일 사용)</span>
              </label>
              <label className={`flex items-center justify-center gap-2 h-10 rounded-lg ring-1 ring-blue-200 text-sm cursor-pointer transition ${
                uploadingFrame ? "bg-slate-100 text-slate-400" : "bg-blue-50/50 hover:bg-blue-50 text-blue-600"
              }`}>
                {uploadingFrame ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />업로드 중...</>
                ) : (
                  <><Image className="w-4 h-4" />{frameUrl ? "프레임 변경" : "프레임 이미지 선택 (5MB 이하)"}</>
                )}
                <input type="file" accept="image/*" onChange={handleFrameChange} disabled={uploadingFrame} className="hidden" />
              </label>
              {frameUrl && (
                <div className="mt-2 rounded-lg overflow-hidden ring-1 ring-slate-200">
                  <img src={frameUrl} alt="프레임 미리보기" className="w-full" />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading || uploadingFrame}
            className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-slate-300 transition flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            상품 등록
          </button>
        </div>

        {/* 미리보기 */}
        <div className="bg-slate-50 rounded-xl ring-1 ring-slate-200 p-4 flex flex-col">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">미리보기</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full bg-white rounded-xl ring-1 ring-slate-200 p-4 text-center">
              <div className="w-20 h-20 mx-auto rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden mb-3">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-300 text-xs">이미지</span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">
                {name || "상품명"}
              </p>
              {description && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{description}</p>
              )}
              <p className="text-base font-bold text-blue-600 mt-2">
                {price ? parseInt(price, 10).toLocaleString() : "0"}
                <span className="text-xs text-slate-400 ml-0.5">P</span>
              </p>
              {isMegaphone && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700">
                  {durationHours}시간 지속
                </span>
              )}
              {isProfileCard && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                  프로필카드
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 등록된 상품 목록 */}
      <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-900">
            등록된 상품 <span className="text-slate-400">({items.length})</span>
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            아직 등록된 상품이 없습니다
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[48px_1fr_90px_90px_80px_88px] gap-3 px-5 py-2 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase">
              <span>이미지</span>
              <span>상품명</span>
              <span>상점/구분</span>
              <span>가격</span>
              <span>상태</span>
              <span className="text-right">관리</span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[48px_1fr_90px_90px_80px_88px] gap-3 px-5 py-3 items-center"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-300 text-[9px]">없음</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                  )}
                </div>
                <div className="min-w-0">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    item.shop_type === "guild"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {item.shop_type === "guild" ? "길드샵" : "활동샵"}
                  </span>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.category}</p>
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {item.price.toLocaleString()}P
                </p>
                <span className={`text-xs font-bold ${
                  item.is_active ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {item.is_active ? "판매중" : "숨김"}
                </span>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    title={item.is_active ? "숨기기" : "판매하기"}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition"
                  >
                    {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    title="삭제"
                    className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
