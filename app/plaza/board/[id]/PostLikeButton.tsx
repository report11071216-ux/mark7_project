"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { togglePostLike } from "../actions";
import toast from "react-hot-toast";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
};

export default function PostLikeButton({ postId, initialLiked, initialCount, isLoggedIn }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    if (!isLoggedIn) {
      toast.error("로그인이 필요해요");
      return;
    }
    // 낙관적 토글
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setPending(true);

    const result = await togglePostLike(postId);
    setPending(false);

    if (!result.success) {
      // 롤백
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
      toast.error(result.error ?? "실패했어요");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition disabled:opacity-60 " +
        (liked
          ? "bg-rose-50 text-rose-500 ring-1 ring-rose-200"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200")
      }
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={"w-4 h-4 " + (liked ? "fill-rose-500" : "")} />
      )}
      {count}
    </button>
  );
}
