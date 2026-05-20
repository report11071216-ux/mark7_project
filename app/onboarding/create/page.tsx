"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createGuild } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuroraBackground } from "@/components/landing/AuroraBackground";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";

const initialState = { error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="gradient"
      size="lg"
      disabled={pending}
      className="w-full"
    >
      <Sparkles />
      {pending ? "생성 중..." : "길드 만들기"}
    </Button>
  );
}

export default function CreateGuildPage() {
  const [state, formAction] = useFormState(createGuild, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <AuroraBackground variant="subtle" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Link>

        <div className="mb-10">
          <p className="mono-label mb-3">CREATE GUILD</p>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
            우리 길드 만들기
          </h1>
          <p className="text-muted-foreground">
            기본 정보만 입력하면 6자리 길드 코드가 자동 생성돼요
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-white mb-2"
            >
              길드 이름 <span className="text-rose-400">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={30}
              placeholder="예: 쁘밍, 달빛 결사대"
              autoComplete="off"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              2~30자, 언제든 변경 가능
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-white mb-2"
            >
              한 줄 소개{" "}
              <span className="text-muted-foreground text-xs font-normal">(선택)</span>
            </label>
            <Input
              id="description"
              name="description"
              type="text"
              maxLength={100}
              placeholder="예: 즐겁게 노는 친목 길드"
              autoComplete="off"
            />
          </div>

          {state.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <SubmitButton />
        </form>

        <div className="mt-8 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-violet-300 font-semibold">💡 안내:</span> 길드를
            만들면 자동으로 <span className="text-white font-semibold">마스터</span>
            가 됩니다. 멤버 초대, 권한 설정, 위젯 배치 등 모든 권한을 가져요.
          </p>
        </div>
      </div>
    </main>
  );
}
