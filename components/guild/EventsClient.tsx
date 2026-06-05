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
  ChevronUp,
  Heading,
  AlignLeft,
  Minus,
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

type DescBlock = { type: 'heading' | 'text' | 'divider'; text?: string }

const EVENT_TYPES = ['내전', '레이드', '친목', '경쟁전', '기타']
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const TEAM_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const TEAM_COUNTS = [2, 3, 4, 5, 6, 7, 8]

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

// ── 설명 파싱/렌더링 ──
function parseDescBlocks(s: string): DescBlock[] | null {
  if (!s) return null
  try {
    const v = JSON.parse(s)
    if (
      Array.isArray(v) &&
      v.every((b) => b && typeof b === 'object' && typeof b.type === 'string')
    ) {
      return v as DescBlock[]
    }
  } catch {
    // JSON 아니면 일반 텍스트로 처리
  }
  return null
}

// URL만 자동 링크
function linkify(text: string, kp: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(https?:\/\/[^\s]+)/
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
    const url = m[0]
    nodes.push(
      <a
        key={kp + '-' + k}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-violet-600 underline break-all"
      >
        {url}
      </a>
    )
    rest = rest.slice(idx + url.length)
    k++
  }
  return nodes
}

function renderDescription(description: string): ReactNode {
  const blocks = parseDescBlocks(description)
  if (blocks) {
    return (
      <div className="space-y-0.5">
        {blocks.map((b, i) => {
          if (b.type === 'divider') {
            return <div key={i} className="my-2 border-t border-slate-200" />
          }
          if (b.type === 'heading') {
            return (
              <div key={i} className="mt-2 mb-1 flex items-center gap-2">
                <span className="h-3.5 w-[3px] shrink-0 rounded bg-violet-600" />
                <p className="text-sm font-bold text-slate-900">{linkify(b.text || '', 'h' + i)}</p>
              </div>
            )
          }
          return (
            <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {linkify(b.text || '', 't' + i)}
            </p>
          )
        })}
      </div>
    )
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
      {linkify(description, 'pf')}
    </p>
  )
}

function descToBlocks(d: string): DescBlock[] {
  if (!d) return []
  const parsed = parseDescBlocks(d)
  if (parsed) return parsed
  return [{ type: 'text', text: d }]
}

function blocksToDesc(bs: DescBlock[]): string {
  const clean = bs
    .filter((b) => b.type === 'divider' || (b.text && b.text.trim() !== ''))
    .map((b) =>
      b.type === 'divider'
        ? { type: 'divider' as const }
        : { type: b.type, text: (b.text || '').trim() }
    )
  if (clean.length === 0) return ''
  return JSON.stringify(clean)
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
  const [blocks, setBlocks] = useState<DescBlock[]>([])

  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<EventParticipant[][] | null>(null)
  const [copied, setCopied] = useState(false)
  const [excludedIds, setExcludedIds] = useState<string[]>([])

  // 슬롯머신 연출
  const [spinning, setSpinning] = useState(false)
  const [reelName, setReelName] = useState('')
  const reelRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function stopReel() {
    if (reelRef.current !== null) {
      clearTimeout(reelRef.current)
      reelRef.current = null
    }
  }

  useEffect(() => {
    return () => stopReel()
  }, [])

  function toggleOpen(id: string) {
    setError('')
    setConfirmDeleteId('')
    stopReel()
    setSpinning(false)
    setTeams(null)
    setCopied(false)
    setExcludedIds([])
    setOpenId(openId === id ? '' : id)
  }

  function resetTeams() {
    stopReel()
    setSpinning(false)
    setTeams(null)
    setCopied(false)
  }

  function toggleExclude(id: string) {
    resetTeams()
    setExcludedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat(id)))
  }

  function openCreate() {
    setEditId('')
    setTitle('')
    setEventType('내전')
    setDate('')
    setTime('')
    setBlocks([])
    setError('')
    setShowForm(true)
  }

  function openEdit(ev: GuildEvent) {
    setEditId(ev.id)
    setTitle(ev.title)
    setEventType(EVENT_TYPES.indexOf(ev.eventType) !== -1 ? ev.eventType : '기타')
    setDate(ev.scheduledDate || '')
    setTime(ev.scheduledTime || '')
    setBlocks(descToBlocks(ev.description || ''))
    setError('')
    setShowForm(true)
  }

  function addBlock(type: 'heading' | 'text' | 'divider') {
    const next = blocks.slice()
    next.push(type === 'divider' ? { type } : { type, text: '' })
    setBlocks(next)
  }

  function updateBlock(i: number, text: string) {
    const next = blocks.slice()
    next[i] = { type: next[i].type, text }
    setBlocks(next)
  }

  function removeBlock(i: number) {
    setBlocks(blocks.filter((_, j) => j !== i))
  }

  function moveBlock(i: number, dir: number) {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = blocks.slice()
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    setBlocks(next)
  }

  async function handleSubmit() {
    if (!title.trim() || busy) return
    setBusy(true)
    setError('')
    const description = blocksToDesc(blocks)
    const res = editId
      ? await updateEvent({
          eventId: editId,
          guildCode,
          title: title.trim(),
          eventType,
          scheduledDate: date,
          scheduledTime: time,
          description,
        })
      : await createEvent({
          guildCode,
          title: title.trim(),
          eventType,
          scheduledDate: date,
          scheduledTime: time,
          description,
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

  function rollTeams(pool: EventParticipant[]) {
    if (pool.length < 2 || spinning) return
    stopReel()

    // 결과 먼저 확정 (팀 개수는 인원 수를 넘지 않도록)
    const tc = Math.min(teamCount, pool.length)
    const shuffled = shuffle(pool)
    const result: EventParticipant[][] = []
    for (let i = 0; i < tc; i++) result.push([])
    shuffled.forEach((p, i) => {
      result[i % tc].push(p)
    })

    // 슬롯머신 연출
    setTeams(null)
    setCopied(false)
    setSpinning(true)
    const names = pool.map((p) => p.name)
    const start = Date.now()
    const duration = 1500

    const tick = () => {
      const elapsed = Date.now() - start
      setReelName(names[Math.floor(Math.random() * names.length)])
      if (elapsed >= duration) {
        stopReel()
        setSpinning(false)
        setTeams(result)
        return
      }
      const delay = 50 + (elapsed / duration) * 130
      reelRef.current = setTimeout(tick, delay)
    }
    tick()
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
      <style>{`
        @keyframes slotPop {
          0% { opacity: 0; transform: translateY(-7px); }
          60% { opacity: 1; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
            const included = ev.participants.filter((p) => !excludedIds.includes(p.userId))
            const effTeams = Math.min(teamCount, included.length)

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
                        <div className="mb-2 flex items-center gap-1.5">
                          <Shuffle className="h-3.5 w-3.5 text-violet-600" />
                          <span className="text-xs font-bold text-slate-700">팀 랜덤 돌리기</span>
                        </div>

                        {/* 참가자 포함/제외 */}
                        <p className="mb-1.5 text-[11px] text-slate-400">
                          체크 해제한 인원은 팀 뽑기에서 제외돼요 (예: 진행자/임원)
                        </p>
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {ev.participants.map((p) => {
                            const inc = !excludedIds.includes(p.userId)
                            return (
                              <button
                                key={p.userId}
                                type="button"
                                disabled={spinning}
                                onClick={() => toggleExclude(p.userId)}
                                className={cx(
                                  'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-50',
                                  inc
                                    ? 'border-violet-200 bg-violet-50 text-violet-700'
                                    : 'border-slate-200 bg-white text-slate-400 line-through'
                                )}
                              >
                                {inc ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                {p.name}
                              </button>
                            )
                          })}
                        </div>

                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-400">팀 개수</span>
                          <div className="flex flex-wrap gap-1">
                            {TEAM_COUNTS.map((n) => (
                              <button
                                key={n}
                                type="button"
                                disabled={spinning}
                                onClick={() => {
                                  setTeamCount(n)
                                  resetTeams()
                                }}
                                className={cx(
                                  'rounded-md px-2.5 py-1 text-xs font-bold transition disabled:opacity-50',
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
                            onClick={() => rollTeams(included)}
                            disabled={spinning || included.length < 2}
                            className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                          >
                            <Shuffle className={cx('h-3.5 w-3.5', spinning ? 'animate-spin' : '')} />
                            {spinning ? '돌리는 중...' : teams ? '다시 돌리기' : '랜덤 돌리기'}
                          </button>
                          {teams && !spinning ? (
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

                        {spinning ? (
                          <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-violet-200 bg-white">
                            <p className="text-[11px] font-bold text-violet-400">두구두구... 팀을 뽑는 중</p>
                            <p className="mt-1 text-xl font-bold text-violet-700">{reelName || '...'}</p>
                          </div>
                        ) : teams ? (
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
                                  {team.map((p, mi) => (
                                    <div
                                      key={p.userId}
                                      className="flex items-center gap-1.5"
                                      style={{
                                        animation: 'slotPop 0.3s ease-out both',
                                        animationDelay: (i * 0.12 + mi * 0.06) + 's',
                                      }}
                                    >
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
                        ) : included.length < 2 ? (
                          <p className="text-[11px] text-slate-400">
                            팀을 나누려면 포함 인원이 2명 이상이어야 해요.
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            "랜덤 돌리기"를 누르면 포함된 {included.length}명을 {effTeams}개 팀으로 나눠요.
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
                <label className="mb-1 block text-xs font-bold text-slate-500">설명 (선택)</label>

                {blocks.length === 0 ? (
                  <p className="mb-2 rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
                    아래 버튼으로 제목·내용·구분선을 추가해 채워보세요.
                  </p>
                ) : (
                  <div className="mb-2 space-y-2">
                    {blocks.map((b, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">
                            {b.type === 'heading' ? '제목' : b.type === 'divider' ? '구분선' : '내용'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveBlock(i, -1)}
                              disabled={i === 0}
                              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 disabled:opacity-30"
                              aria-label="위로"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(i, 1)}
                              disabled={i === blocks.length - 1}
                              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 disabled:opacity-30"
                              aria-label="아래로"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(i)}
                              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                              aria-label="삭제"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {b.type === 'heading' ? (
                          <input
                            type="text"
                            value={b.text || ''}
                            onChange={(e) => updateBlock(i, e.target.value)}
                            placeholder="제목 (예: 일정 안내)"
                            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 placeholder-slate-300 transition focus:border-violet-400 focus:outline-none"
                          />
                        ) : b.type === 'text' ? (
                          <textarea
                            value={b.text || ''}
                            onChange={(e) => updateBlock(i, e.target.value)}
                            rows={3}
                            placeholder="내용을 입력하세요"
                            className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm leading-relaxed text-slate-900 placeholder-slate-300 transition focus:border-violet-400 focus:outline-none"
                          />
                        ) : (
                          <div className="border-t border-dashed border-slate-300 py-1" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => addBlock('heading')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Heading className="h-3 w-3" />
                    제목
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('text')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <AlignLeft className="h-3 w-3" />
                    내용
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('divider')}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Minus className="h-3 w-3" />
                    구분선
                  </button>
                </div>
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
