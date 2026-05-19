"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CategoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") || "all";

  const tabs = [
    { key: "all", label: "전체" },
    { key: "free", label: "💬 자유" },
    { key: "recruit", label: "🏰 길드모집" },
  ];

  const handleClick = (key: string) => {
    if (key === "all") {
      router.push("/");
    } else {
      router.push(`/?category=${key}`);
    }
  };

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => handleClick(t.key)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
            current === t.key
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
