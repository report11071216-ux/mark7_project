// components/guild/WebhookSettings.tsx
"use client";

import { useState } from "react";
import {
  saveNotificationSettings,
  sendTestNotification,
  saveDiscordWidgetId,
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
  { key: "join", emoji: "🙋", label: "가입 신청 알림", desc: "가입 신청이 들어오면 전송" },
];

export default function WebhookSettings({
  guildId,
  initial,
  initialWidgetId,
}: {
  guildId: string;
  initial: WebhookSettingsInput;
  initialWidgetId: string;
}) {
  const [defaultUrl, setDefaultUrl] = useState(initial.default_url);
  const [notice, setNotice] = useState(initial.notice);
  const [raid, setRaid] = useState(initial.raid);
  const [welcome, setWelcome] = useState(initial.welcome);
  const [join, setJoin] = useState(initial.join);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  // 서버 위젯 ID
  const [widgetId, setWidgetId] = useState(initialWidgetId);
  const [savingWidget, setSavingWidget] = useState(false);
  const [widgetMsg, setWidgetMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const stateMap = { notice, raid, welcome, join };
  const setterMap = { notice: setNotice, raid: setRaid, welcome: setWelcome, join: setJoin };

  function buildInput(): WebhookSettingsInput {
    return { default_url: defaultUrl, notice, raid, welcome, join };
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

  async function handleSaveWidget() {
    setSavingWidget(true);
    setWidgetMsg(null);
    const result = await saveDiscordWidgetId(guildId, widgetId);
    setSavingWidget(false);
    if (result.error) {
      setWidgetMsg({ type: "err", text: result.error });
    } else {
      setWidgetId(result.savedId ?? "");
      setWidgetMsg({ type: "ok", text: "저장됐어요." });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pb-2 space-y-6">
      <div>
        <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">DISCORD NOTIFICATION</p>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">디스코드 알림 연동</h2>
          <p className="mt-1 text-sm text-slate-500">
            알림 종류마다 다른 채널로 보낼 수 있어요. 칸을 비워두면 기본 채널로
            전송됩니다.
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs leading-relaxed text-slate-600">
            <strong className="text-slate-700">웹훅 주소 얻는 법</strong>
            <br />
            디스코드 채널 → 설정(톱니) → 연동 → 웹훅 → 새 웹훅 → 웹훅 URL 복사
          </div>

          {/* 기본 채널 */}
          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-800">
              기본 채널 <span className="font-normal text-slate-400">(필수 권장)</span>
            </label>
            <p className="text-xs text-slate-500">
              종류별 채널을 비워두면 모두 이 채널로 갑니다.
            </p>
            <input
              type="text"
              value={defaultUrl}
              onChange={(e) => setDefaultUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* 종류별 채널 */}
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            {ROWS.map((row) => {
              const val = stateMap[row.key];
              const setVal = setterMap[row.key];
              return (
                <div key={row.key}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">
                        {row.emoji} {row.label}
                      </span>
                      <p className="text-xs text-slate-500">{row.desc}</p>
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
                      <span className="text-xs text-slate-500">
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
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-violet-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <button
                      onClick={() => handleTest(row.key)}
                      disabled={testing !== null || !val.enabled}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {testing === row.key ? "발송 중..." : "테스트"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {msg ? (
              <span
                className={`text-sm ${
                  msg.type === "ok" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {msg.text}
              </span>
            ) : null}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "전체 저장"}
            </button>
          </div>
        </div>
      </div>

      {/* ── 서버 위젯 (접속 현황) ── */}
      <div>
        <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">SERVER WIDGET</p>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">디스코드 접속 현황 위젯</h2>
          <p className="mt-1 text-sm text-slate-500">
            서버 ID를 등록하면 길드 홈에 "지금 N명 접속 중" 위젯을 띄울 수 있어요.
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs leading-relaxed text-slate-600">
            <strong className="text-slate-700">준비 (꼭 필요)</strong>
            <br />
            ① 디스코드 서버 설정 → 위젯 → <strong>서버 위젯 활성화</strong> 켜기
            <br />
            ② 그 화면의 <strong>서버 아이디</strong> 복사해서 아래에 붙여넣기
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-800">서버 아이디</label>
            <p className="text-xs text-slate-500">숫자 ID 또는 위젯 JSON 주소를 붙여넣어도 돼요.</p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={widgetId}
                onChange={(e) => setWidgetId(e.target.value)}
                placeholder="예: 1492484355971354677"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                onClick={handleSaveWidget}
                disabled={savingWidget}
                className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {savingWidget ? "저장 중..." : "저장"}
              </button>
            </div>
            {widgetMsg ? (
              <span className={`mt-2 block text-sm ${widgetMsg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>
                {widgetMsg.text}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
