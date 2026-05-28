"use client";
import { useState } from "react";
import { saveWebhookUrl, sendTestWebhook } from "@/app/actions/guild-actions";

export default function WebhookSettings({
  guildId,
  initialUrl,
}: {
  guildId: string;
  initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const result = await saveWebhookUrl(guildId, url);
    setSaving(false);
    if (result.error) {
      setMsg({ type: "err", text: result.error });
    } else {
      setMsg({ type: "ok", text: "저장됐어요." });
    }
  }

  async function handleTest() {
    setTesting(true);
    setMsg(null);
    const result = await sendTestWebhook(guildId);
    setTesting(false);
    if (result.error) {
      setMsg({ type: "err", text: result.error });
    } else {
      setMsg({
        type: "ok",
        text: "테스트 메시지를 보냈어요! 디스코드 채널을 확인해보세요.",
      });
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">디스코드 알림 연동</h2>
      <p className="mt-1 text-sm text-zinc-500">
        디스코드 채널에 웹훅을 만들어 주소를 붙여넣으면, 길드 알림을 그 채널로
        보낼 수 있어요.
      </p>

      <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">
        <strong className="text-zinc-700">웹훅 주소 얻는 법</strong>
        <br />
        디스코드 채널 → 설정(톱니) → 연동 → 웹훅 → 새 웹훅 → 웹훅 URL 복사
      </div>

      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://discord.com/api/webhooks/..."
        className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500"
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {testing ? "발송 중..." : "테스트 발송"}
        </button>
      </div>

      {msg ? (
        <p
          className={`mt-3 text-sm ${
            msg.type === "ok" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
