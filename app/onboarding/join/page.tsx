"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { joinGuild } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuroraBackground } from "@/components/landing/AuroraBackground";
import { ArrowLeft, Hash, AlertCircle, ArrowRight } from "lucide-react";

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
      {pending ? "참여 중..." : "길드 참여하기"}
      {!pending && <ArrowRight />}
    </Button>
  );
}

export default function JoinGuildPage() {
  const [state, formAction] = useFormState(joinGuild, initialState);

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
          <p className="mono-label mb-3">JOIN GUILD</p>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
            길드 코드로 참여
          </h1>
          <p className="text-muted-foreground">
            마스터에게 받은 6자리 코드를 입력하세요
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-semibold text-white mb-2"
            >
              길드 코드 <span className="text-rose-400">*</span>
            </label>
            <Input
              id="code"
              name="code"
              type="text"
              required
              maxLength={8}
              variant="mono"
              placeholder="X4FQGR"
              autoComplete="off"
              autoFocus
              className="text-center text-2xl h-16"
            />
            <p className="mt-2 text-xs text-muted-foreground font-mono tracking-wider text-center">
              영문 대문자 + 숫자 6자리
            </p>
          </div>

          {state.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <SubmitButton />
        </form>

        <div className="mt-8 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">
                길드 코드가 없나요?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                길드 마스터에게 6자리 코드를 받아주세요. 또는{" "}
                <Link
                  href="/onboarding/create"
                  className="text-cyan-300 hover:underline"
                >
                  직접 길드를 만들 수도 있어요
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
