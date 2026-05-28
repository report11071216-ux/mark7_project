"use client";
import { useState } from "react";
import {
  saveNotificationSettings,
  sendTestNotification,
  type WebhookSettingsInput,
} from "@/app/actions/guild-actions";
import type { NotificationType } from "@/lib/discord";

type ChannelRow = {
  key: NotificationType;
  emoji: string;
  label: string;
  desc: string;
};

const ROWS: ChannelRow[] = [
  { key: "notice", emoji: "📢", label: "공지 알림", desc: "공지글을 올리면 전송" },
  { key: "raid", emoji: "⚔️", label: "레이드 알림", desc: "레이드 일정이 열리면 전송" },
  { key: "welcome", emoji: "👋", label: "환영 알림", desc: "새 길드원이 들어오면 전송" },
];

export default function WebhookSettings({
  guildId,
  initial,
}: {
  guildId: string;
  initial: WebhookSettingsInput;
}) {
  const [defaultUrl, setDefaultUrl] = useState(initial.default_url);
  const [notice, setNotice] = useState(initial.notice);
  const [raid, setRaid] = useState(initial.raid);
  const [welcome, setWelcome] = useState(initial.welcome);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const stateMap = { notice, raid, welcome };
  const setterMap = { notice: setNotice, raid: setRaid, welcome: setWelcome };

  function buildInput(): WebhookSettingsInput {
    return {
      default_url: defaultUrl,
      notice,
      raid,
      welcome,
    };
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const result = await saveNotificationSettings(guildId, buildInput());
    setSaving(false);
    if (result.error) {
      setMsg({ type: "err", text: result.error });
    } else {
      setMsg({ type: "ok", text: "저장됐어요." });
    }
  }

  async function handleTest(type: NotificationType) {
    setTesting(type);
    setMsg(null);
    // 테스트는 저장된 설정 기준이므로, 먼저 저장하고 보냄
    const saveResult = await saveNotificationSettings(guildId, buildInput());
    if (saveResult.error) {
      setTesting(null);
      setMsg({ type: "err", text: saveResult.error });
      return;
    }
    const result = await sendTestNotification(guildId, type);
    setTesting(null);
    if (result.error) {
      setMsg({ type: "err", text: result.error });
    } else {
      setMsg({
        type: "ok",
        text: "테스트 메시지를 보냈어요! 디스코드를 확인해보세요.",
      });
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">디스코드 알림 연동</h2>
      <p className="mt-1 text-sm text-zinc-500">
        알림 종류마다 다른 채널로 보낼 수 있어요. 칸을 비워두면 기본 채널로
        전송됩니다.
      </p>

      <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">
        <strong className="text-zinc-700">웹훅 주소 얻는 법</strong>
        <br />
        디스코드 채널 → 설정(톱니) → 연동 → 웹훅 → 새 웹훅 → 웹훅 URL 복사
      </div>

      {/* 기본 채널 */}
      <div className="mt-5">
        <label className="text-sm font-semibold text-zinc-800">
          기본 채널 <span className="font-normal text-zinc-400">(필수 권장)</span>
        </label>
        <p className="text-xs text-zinc-500">
          종류별 채널을 비워두면 모두 이 채널로 갑니다.
        </p>
        <input
          type="text"
          value={defaultUrl}
          onChange={(e) => setDefaultUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500"
        />
      </div>

      {/* 종류별 채널 */}
      <div className="mt-5 space-y-4 border-t border-zinc-100 pt-5">
        {ROWS.map((row) => {
          const val = stateMap[row.key];
          const setVal = setterMap[row.key];
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-zinc-800">
                    {row.emoji} {row.label}
                  </span>
                  <p className="text-xs text-zinc-500">{row.desc}</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={val.enabled}
                    onChange={(e) =>
                      setVal({ ...val, enabled: e.target.checked })
                    }
                    className="h-4 w-4 accent-violet-600"
                  />
                  <span className="text-xs text-zinc-500">
                    {val.enabled ? "켜짐" : "꺼짐"}
                  </span>
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={val.url}
                  onChange={(e) => setVal({ ...val, url: e.target.value })}
                  placeholder="비우면 기본 채널로 전송"
                  disabled={!val.enabled}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                />
                <button
                  onClick={() => handleTest(row.key)}
                  disabled={testing !== null || !val.enabled}
                  className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {testing === row.key ? "발송 중..." : "테스트"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "전체 저장"}
        </button>
        {msg ? (
          <span
            className={`text-sm ${
              msg.type === "ok" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}
