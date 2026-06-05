'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import {
  Plus,
  Pencil,
  CalendarDays,
  Users,
  Shuffle,
  Copy,
  Check,
  Trash2,
  X,
  ChevronDown,
  Heading,
  List,
  Minus,
  Bold,
  Highlighter,
} from 'lucide-react'
import {
  createEvent,
  updateEvent,
  joinEvent,
  leaveEvent,
  setEventStatus,
  deleteEvent,
} from '@/app/guild/[code]/events/actions'

export type EventParticipant = {
  userId: string
  name: string
  avatar: string
  characterClass: string
  itemLevel: number | null
}

export type GuildEvent = {
  id: string
  title: string
  description: string
  eventType: string
  scheduledDate: string
  scheduledTime: string
  status: string
  createdBy: string
  createdByName: string
  participants: EventParticipant[]
}

type Props = {
  guildCode: string
  currentUserId: string
  isStaff: boolean
  events: GuildEvent[]
}

const EVENT_TYPES = ['내전', '레이드', '친목', '경쟁전', '기타']
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const TEAM_LABELS = ['A', 'B', 'C', 'D']

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

function typeBadge(t: string): string {
  if (t === '내전') return 'bg-red-50 text-red-600 border-red-200'
  if (t === '레이드') return 'bg-violet-50 text-violet-600 border-violet-200'
  if (t === '친목') return 'bg-emerald-50 text-emerald-600 border-emerald-200'
  if (t === '경쟁전') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function dateLabel(d: string, t: string): string {
  if (!d) return '일정 미정'
  const p = d.split('-')
  if (p.length !== 3) return d
  const y = Number(p[0])
  const m = Number(p[1])
  const day = Number(p[2])
  if (!y || !m || !day) return d
  const wd = WEEKDAYS[new Date(y, m - 1, day).getDay()]
  return m + '월 ' + day + '일 (' + wd + ')' + (t ? ' ' + t : '')
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// ── 인라인 서식: **굵게**, !!강조!!, URL 링크 ──
function renderInline(text: string, kp: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*\n]+\*\*)|(!![^!\n]+!!)|(https?:\/\/[^\s]+)/
  let rest = text
  let k = 0
  while (rest.length > 0) {
    const m = re.exec(rest)
    if (!m) {
      nodes.push(rest)
      break
    }
    const idx = m.index
    if (idx > 0) nodes.push(rest.slice(0, idx))
    const tok = m[0]
    if (tok.startsWith('**')) {
      nodes.push(
        <strong key={kp + '-' + k} className="font-bold text-slate-900">
          {tok.slice(2, -2)}
        </strong>
      )
    } else if (tok.startsWith('!!')) {
      nodes.push(
        <span key={kp + '-' + k} className="font-bold text-violet-600">
          {tok.slice(2, -2)}
        </span>
      )
    } else {
      nodes.push(
        <a
          key={kp + '-' + k}
          href={tok}
          target="_blank"
          rel="noreferrer"
          className="text-violet-600 underline break-all"
        >
          {tok}
        </a>
      )
    }
    rest = rest.slice(idx + tok.length)
    k++
  }
  return nodes
}

// ── 줄 단위 서식: ■ 제목, • 항목, ─ 구분선 ──
function renderDescription(text: string): ReactNode {
  const lines = text.split('\n')
  const out: ReactNode[] = []
  let bullets: string[] = []
  let bk = 0

  function flush() {
    if (bullets.length > 0) {
      const items = bullets.slice()
      const key = bk
      out.push(
        <ul key={'ul-' + key} className="my-1 space-y-0.5">
          {items.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600">
              <span className="text-violet-500">•</span>
              <span>{renderInline(b, 'b' + key + '-' + i)}</span>
            </li>
          ))}
        </ul>
      )
      bk++
      bullets = []
    }
  }

  lines.forEach((line, i) => {
    const t = line.trim()
    if (t === '') {
      flush()
      out.push(<div key={'sp-' + i} className="h-2" />)
      return
    }
    if (/^─{2,}$/.test(t) || t === '---') {
      flush()
      out.push(<div key={'hr-' + i} className="my-2 border-t border-slate-200" />)
      return
    }
    if (t.startsWith('■')) {
      flush()
      out.push(
        <div key={'h-' + i} className="mt-2 flex items-center gap-2">
          <span className="h-3.5 w-[3px] shrink-0 rounded bg-violet-600" />
          <p className="text-sm font-bold text-slate-900">
            {renderInline(t.replace(/^■\s*/, ''), 'h' + i)}
          </p>
        </div>
      )
      return
    }
    if (t.startsWith('•') || t.startsWith('- ')) {
      bullets.push(t.replace(/^•\s*/, '').replace(/^-\s+/, ''))
      return
    }
    flush()
    out.push(
      <p key={'p-' + i} className="text-sm leading-relaxed text-slate-600">
        {renderInline(line, 'p' + i)}
      </p>
    )
  })
  flush()

  return <div>{out}</div>
}

export default function EventsClient({ guildCode, currentUserId, isStaff, events }: Props) {
  const [openId, setOpenId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState('')
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('내전')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [desc, setDesc] = useState('')
  const descRef = useRef<HTMLTextAreaElement | null>(null)

  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<EventParticipant[][] | null>(null)
  const [copied, setCopied] = useState(false)

  // 설명칸 자동 높이
  useEffect(() => {
    const ta = descRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 360) + 'px'
    }
  }, [desc, showForm])

  function toggleOpen(id: string) {
    setError('')
    setConfirmDeleteId('')
    setTeams(null)
    setCopied(false)
    setOpenId(openId === id ? '' : id)
  }

  function openCreate() {
    setEditId('')
    setTitle('')
    setEventType('내전')
    setDate('')
    setTime('')
    setDesc('')
    setError('')
    setShowForm(true)
  }

  function openEdit(ev: GuildEvent) {
    setEditId(ev.id)
    setTitle(ev.title)
    setEventType(EVENT_TYPES.indexOf(ev.eventType) !== -1 ? ev.eventType : '기타')
    setDate(ev.scheduledDate || '')
    setTime(ev.scheduledTime || '')
    setDesc(ev.description || '')
    setError('')
    setShowForm(true)
  }

  function restoreCursor(s: number, e: number) {
    requestAnimationFrame(() => {
      const ta = descRef.current
      if (!ta) return
      ta.focus()
      ta.setSelectionRange(s, e)
    })
  }

  function applyFormat(kind: string) {
    const ta = descRef.current
    const start = ta ? ta.selectionStart : desc.length
    const end = ta ? ta.selectionEnd : desc.length
    const before = desc.slice(0, start)
    const selected = desc.slice(start, end)
    const after = desc.slice(end)

    if (kind === 'heading' || kind === 'bullet') {
      const marker = kind === 'heading' ? '■ ' : '• '
      const needNL = before.length > 0 && !before.endsWith('\n')
      const mid = (needNL ? '\n' : '') + marker
      setDesc(before + mid + selected + after)
      const pos = before.length + mid.length + selected.length
      restoreCursor(pos, pos)
      return
    }

    if (kind === 'divider') {
      const needNL = before.length > 0 && !before.endsWith('\n')
      const mid = (needNL ? '\n' : '') + '─────────\n'
      setDesc(before + mid + after)
      const pos = before.length + mid.length
      restoreCursor(pos, pos)
      return
    }

    // bold / accent (감싸기)
    const wrap = kind === 'bold' ? '**' : '!!'
    const inner = selected || (kind === 'bold' ? '굵게' : '강조')
    const mid = wrap + inner + wrap
    setDesc(before + mid + after)
    const innerStart = before.length + wrap.length
    restoreCursor(innerStart, innerStart + inner.length)
  }

  async function handleSubmit() {
    if (!title.trim() || busy) return
    setBusy(true)
    setError('')
    const res = editId
      ? await updateEvent({
          eventId: editId,
          guildCode,
          title: title.trim(),
          eventType,
          scheduledDate: date,
          scheduledTime: time,
          description: desc,
        })
      : await createEvent({
          guildCode,
          title: title.trim(),
          eventType,
          scheduledDate: date,
          scheduledTime: time,
          description: desc,
        })
    setBusy(false)
    if (!res.ok) {
      setError(res.error || (editId ? '수정에 실패했습니다.' : '이벤트 생성에 실패했습니다.'))
      return
    }
    window.location.reload()
  }

  async function handleJoin(id: string) {
    if (busy) return
    setBusy(true)
    setError('')
    const res = await joinEvent(id, guildCode)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || '참가 신청에 실패했습니다.')
      return
    }
    window.location.reload()
  }

  async function handleLeave(id: string) {
    if (busy) return
    setBusy(true)
    setError('')
    const res = await leaveEvent(id, guildCode)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || '참가 취소에 실패했습니다.')
      return
    }
    window.location.reload()
  }

  async function handleStatus(id: string, status: string) {
    if (busy) return
    setBusy(true)
    setError('')
    const res = await setEventStatus(id, guildCode, status)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || '상태 변경에 실패했습니다.')
      return
    }
    window.location.reload()
  }

  async function handleDelete(id: string) {
    if (busy) return
    setBusy(true)
    setError('')
    const res = await deleteEvent(id, guildCode)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || '삭제에 실패했습니다.')
      setConfirmDeleteId('')
      return
    }
    window.location.reload()
  }

  function rollTeams(participants: EventParticipant[]) {
    if (participants.length < 2) return
    const shuffled = shuffle(participants)
    const result: EventParticipant[][] = []
    for (let i = 0; i < teamCount; i++) result.push([])
    shuffled.forEach((p, i) => {
      result[i % teamCount].push(p)
    })
    setTeams(result)
    setCopied(false)
  }

  function copyTeams(ev: GuildEvent) {
    if (!teams) return
    const lines = [ev.title + ' 팀 편성']
    teams.forEach((team, i) => {
      const names = team.map((p) => p.name).join(', ')
      lines.push('팀 ' + TEAM_LABELS[i] + ': ' + names)
    })
    const text = lines.join('\n')
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        },
        () => {}
      )
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">총 {events.length}개의 이벤트</span>
        {isStaff ? (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            <Plus className="h-3.5 w-3.5" />
            이벤트 만들기
          </button>
        ) : null}
      </div>

      {error && !showForm ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <p className="text-sm text-slate-400">아직 이벤트가 없어요.</p>
          {isStaff ? (
            <p className="mt-1 text-xs text-slate-400">위 "이벤트 만들기"로 첫 이벤트를 열어보세요.</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const open = openId === ev.id
            const joined = ev.participants.some((p) => p.userId === currentUserId)
            const canManage = isStaff || ev.createdBy === currentUserId
            const recruiting = ev.status === '모집중'

            return (
              <div
                key={ev.id}
                className={cx(
                  'overflow-hidden rounded-xl border bg-white transition',
                  open ? 'border-violet-300' : 'border-slate-200'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(ev.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cx(
                          'rounded-md border px-2 py-0.5 text-[11px] font-bold',
                          typeBadge(ev.eventType)
                        )}
                      >
                        {ev.eventType}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {dateLabel(ev.scheduledDate, ev.scheduledTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        참가 {ev.participants.length}명
                      </span>
                    </div>
                  </div>
                  <span
                    className={cx(
                      'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold',
                      recruiting ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {ev.status}
                  </span>
                  <ChevronDown
                    className={cx(
                      'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                      open ? 'rotate-180' : ''
                    )}
                  />
                </button>

                {open ? (
                  <div className="border-t border-slate-100 px-4 py-4">
                    {ev.description ? (
                      <div className="mb-4">{renderDescription(ev.description)}</div>
                    ) : null}

                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        참가자 {ev.participants.length}명
                      </span>
                      <span className="text-[11px] text-slate-400">주최 · {ev.createdByName}</span>
                    </div>

                    {ev.participants.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 py-5 text-center">
                        <p className="text-xs text-slate-400">아직 참가자가 없어요.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {ev.participants.map((p) => (
                          <div
                            key={p.userId}
                            className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2"
                          >
                            {p.avatar ? (
                              <img
                                src={p.avatar}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-600">
                                {p.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">{p.name}</p>
                              <p className="truncate text-[11px] text-slate-400">
                                {p.characterClass || '직업 미상'}
                                {p.itemLevel != null ? ' · ' + Math.floor(p.itemLevel).toLocaleString() : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {recruiting && !joined ? (
                        <button
                          onClick={() => handleJoin(ev.id)}
                          disabled={busy}
                          className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
                        >
                          참가 신청
                        </button>
                      ) : null}
                      {joined ? (
                        <button
                          onClick={() => handleLeave(ev.id)}
                          disabled={busy}
                          className="flex-1 rounded-lg border border-red-200 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          참가 취소
                        </button>
                      ) : null}
                      {!recruiting && !joined ? (
                        <div className="flex-1 rounded-lg bg-slate-100 py-2.5 text-center text-sm font-medium text-slate-400">
                          모집 마감
                        </div>
                      ) : null}
                    </div>

                    {ev.participants.length >= 2 ? (
                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Shuffle className="h-3.5 w-3.5 text-violet-600" />
                            팀 랜덤 돌리기
                          </span>
                          <span className="text-[11px] text-slate-400">팀 개수</span>
                          <div className="flex gap-1">
                            {[2, 3, 4].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  setTeamCount(n)
                                  setTeams(null)
                                }}
                                className={cx(
                                  'rounded-md px-2.5 py-1 text-xs font-bold transition',
                                  teamCount === n
                                    ? 'bg-violet-600 text-white'
                                    : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                )}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <div className="flex-1" />
                          <button
                            type="button"
                            onClick={() => rollTeams(ev.participants)}
                            className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700"
                          >
                            <Shuffle className="h-3.5 w-3.5" />
                            {teams ? '다시 돌리기' : '랜덤 돌리기'}
                          </button>
                          {teams ? (
                            <button
                              type="button"
                              onClick={() => copyTeams(ev)}
                              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                              {copied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              {copied ? '복사됨' : '복사'}
                            </button>
                          ) : null}
                        </div>

                        {teams ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {teams.map((team, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-slate-200 bg-white p-2.5"
                              >
                                <div className="mb-1.5 flex items-center justify-between">
                                  <span className="text-xs font-bold text-violet-600">
                                    팀 {TEAM_LABELS[i]}
                                  </span>
                                  <span className="text-[11px] text-slate-400">{team.length}명</span>
                                </div>
                                <div className="space-y-1">
                                  {team.map((p) => (
                                    <div key={p.userId} className="flex items-center gap-1.5">
                                      <span className="text-xs font-medium text-slate-800">
                                        {p.name}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        {p.characterClass || ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            "랜덤 돌리기"를 누르면 참가자를 {teamCount}개 팀으로 무작위로 나눠요.
                          </p>
                        )}
                      </div>
                    ) : null}

                    {canManage ? (
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                        {isStaff ? (
                          <button
                            onClick={() => openEdit(ev)}
                            disabled={busy}
                            className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Pencil className="h-3 w-3" />
                            수정
                          </button>
                        ) : null}
                        {recruiting ? (
                          <button
                            onClick={() => handleStatus(ev.id, '마감')}
                            disabled={busy}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            모집 마감
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatus(ev.id, '모집중')}
                            disabled={busy}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            모집 재개
                          </button>
                        )}
                        <div className="flex-1" />
                        {confirmDeleteId === ev.id ? (
                          <>
                            <button
                              onClick={() => setConfirmDeleteId('')}
                              disabled={busy}
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id)}
                              disabled={busy}
                              className="flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              삭제 확인
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(ev.id)}
                            disabled={busy}
                            className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-red-500 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            이벤트 삭제
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editId ? '이벤트 수정' : '이벤트 만들기'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 제1회 길드 내전"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">종류</label>
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEventType(t)}
                      className={cx(
                        'rounded-md border px-3 py-1.5 text-xs font-bold transition',
                        eventType === t
                          ? 'border-violet-400 bg-violet-50 text-violet-600'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold text-slate-500">날짜</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold text-slate-500">시간</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500">설명 (선택)</label>
                  <span className="text-[11px] text-slate-400">{desc.length}자</span>
                </div>

                <div className="mb-1.5 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => applyFormat('heading')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Heading className="h-3 w-3" />
                    제목
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('bullet')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <List className="h-3 w-3" />
                    항목
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('divider')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Minus className="h-3 w-3" />
                    구분선
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Bold className="h-3 w-3" />
                    굵게
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('accent')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-violet-600 transition hover:bg-violet-50"
                  >
                    <Highlighter className="h-3 w-3" />
                    강조
                  </button>
                </div>

                <textarea
                  ref={descRef}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={5}
                  placeholder={'■ 일정 안내\n6월 8일(일) 저녁 9시 집합\n\n• 1부 — 팀 대항전\n**중요** 사항은 굵게, !!필독!! 은 강조'}
                  className="w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder-slate-300 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  버튼을 누르면 서식 기호가 들어가요. 보일 땐 제목·항목·구분선·굵게·강조·링크로 정리돼요.
                </p>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                disabled={busy}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy || !title.trim()}
                className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-40"
              >
                {busy ? (editId ? '수정 중...' : '만드는 중...') : editId ? '수정' : '만들기'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
