"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deletePost } from "@/app/actions/post";

export default function PostDeleteButton({ postId }: { postId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말 이 글을 삭제할까요?")) return;

    const result = await deletePost(postId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("글이 삭제되었습니다");
      router.push("/");
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
    >
      삭제
    </button>
  );
}
