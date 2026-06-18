'use client'

import { useEffect, useState } from 'react'
import {
  joinRaidSchedule,
  leaveRaidSchedule,
  deleteRaidSchedule,
  completeRaidSchedule,
  uncompleteRaidSchedule,
  updateRaidSchedule,
  type MyCharacter,
} from '@/app/guild/[code]/raids/calendar/actions'
import { getClassRole } from '@/lib/lostark-classes'

export type Participant = {
  userId: string
  name: string
  avatar: string
  cardBgUrl: string
  characterClass: string
  itemLevel: number | null
  role: 'dealer' | 'support' | null
  synergy: string
}

export type RaidSchedule = {
  id: string
  raidId: string
  raidTitle: string
  raidImage: string
  difficulty: string
  skillLevel: string
  maxMembers: number
  scheduledDate: string
  scheduledTime: string
  createdBy: string
  createdByName: string
  participants: Participant[]
  participantCount: number
  completed: boolean
}

type Props = {
  open: boolean
  schedule: RaidSchedule | null
  guildCode: string
  currentUserId: string
  currentUserRole: string
  myCharacters: MyCharacter[]
  onClose: () => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const DIFFICULTIES = ['노말', '하드', '나메']
const SKILL_LEVELS = ['트라이', '클경', '반숙', '숙련']
const MEMBER_OPTIONS = [4, 8]

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

function dateLabel(dateStr: string): string {
  if (!dateStr) return ''
  const p = dateStr.split('-')
  if (p.length !== 3) return dateStr
  const y = Number(p[0])
  const m = Number(p[1])
  const d = Number(p[2])
  if (!y || !m || !d) return dateStr
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  return m + '월 ' + d + '일 (' + wd + ')'
}

function diffBadgeClass(diff: string): string {
  if (diff === '하드') return 'border-red-500/40 bg-red-500/15 text-red-300'
  if (diff === '나메') return 'border-violet-500/40 bg-violet-500/15 text-violet-300'
  return 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300'
}

function diffButtonClass(diff: string, selected: boolean): string {
  if (!selected) {
    return 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
  }
  if (diff === '하드') return 'border-red-500/60 bg-red-500/15 text-red-200'
  if (diff === '나메') return 'border-violet-500/60 bg-violet-500/15 text-violet-200'
  return 'border-yellow-500/60 bg-yellow-500/15 text-yellow-200'
}

// 서폿 가능 직업이면 딜/서폿 선택 가능 (기본 서폿)
function defaultRoleFor(characterClass: string): 'dealer' | 'support' {
  if (characterClass && getClassRole(characterClass) === 'support') return 'support'
  return 'dealer'
}

export default function ScheduleDetailModal({
  open,
  schedule,
  guildCode,
  currentUserId,
  currentUserRole,
  myCharacters,
  onClose,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [selectedChar, setSelectedChar] = useState('')
  const [selectedRole, setSelectedRole] = useState<'dealer' | 'support'>('dealer')

  // ── 참여 캐릭터 선택 펼침 ──
  const [joinExpanded, setJoinExpanded] = useState(false)

  // ── 편집 상태 ──
  const [editing, setEditing] = useState(false)
  const [eDiff, setEDiff] = useState('노말')
  const [eSkill, setESkill] = useState('트라이')
  const [eMax, setEMax] = useState(8)
  const [eDate, setEDate] = useState('')
  const [eTime, setETime] = useState('21:00')

  const chars = Array.isArray(myCharacters) ? myCharacters : []

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setError('')
      setSubmitting(false)
      setConfirming(false)
      setEditing(false)
      setJoinExpanded(false)
      const rep = chars.find((c) => c.isRepresentative)
      const initChar = rep ? rep : chars.length > 0 ? chars[0] : null
      setSelectedChar(initChar ? initChar.name : '')
      setSelectedRole(initChar ? defaultRoleFor(initChar.characterClass) : 'dealer')
    }
  }, [open, schedule])

  if (!open || !schedule) return null

  const joined = schedule.participants.some((p) => p.userId === currentUserId)
  const full = schedule.participants.length >= schedule.maxMembers
  const isOwner = schedule.createdBy === currentUserId
  const isStaff = currentUserRole === 'master' || currentUserRole === 'submaster'
  const canManage = isOwner || isStaff
  const isCompleted = schedule.completed
  const hasChars = chars.length > 0

  const selectedCharObj = chars.find((c) => c.name === selectedChar)
  const selectedClass = selectedCharObj ? selectedCharObj.characterClass : ''
  const roleSelectable = selectedClass ? getClassRole(selectedClass) === 'support' : false
  const effectiveRole: 'dealer' | 'support' = roleSelectable ? selectedRole : 'dealer'

  let dealerCount = 0
  let supportCount = 0
  for (const p of schedule.participants) {
    if (p.role === 'support') supportCount++
    else if (p.role === 'dealer') dealerCount++
  }

  function onJoinClick() {
    if (!schedule) return
    setError('')
    // 연동된 캐릭터가 없으면 바로 신청(캐릭터명 없이)
    if (!hasChars) {
      handleJoin()
      return
    }
    setJoinExpanded(true)
  }

  function startEdit() {
    if (!schedule) return
    setError('')
    setEDiff(schedule.difficulty || '노말')
    setESkill(schedule.skillLevel || '트라이')
    setEMax(schedule.maxMembers || 8)
    setEDate(schedule.scheduledDate || '')
    setETime((schedule.scheduledTime || '').slice(0, 5))
    setEditing(true)
  }

  async function handleUpdate() {
    if (!schedule) return
    setError('')
    if (!eDate) {
      setError('날짜를 선택해주세요.')
      return
    }
    if (!eTime) {
      setError('시작 시간을 입력해주세요.')
      return
    }
    if (eMax < schedule.participants.length) {
      setError(
        '이미 ' + schedule.participants.length + '명이 참여 중이라 인원을 그보다 적게 줄일 수 없어요.'
      )
      return
    }
    setSubmitting(true)
    const result = await updateRaidSchedule({
      scheduleId: schedule.id,
      guildCode: guildCode,
      difficulty: eDiff,
      skillLevel: eSkill,
      maxMembers: eMax,
      scheduledDate: eDate,
      scheduledTime: eTime,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || '수정에 실패했습니다.')
      return
    }
    onClose()
    window.location.reload()
  }

  async function handleJoin() {
    if (!schedule) return
    setError('')
    setSubmitting(true)
    const result = await joinRaidSchedule(schedule.id, guildCode, selectedChar, effectiveRole)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || '참여 신청에 실패했습니다.')
      return
    }
    onClose()
    window.location.reload()
  }

  async function handleLeave() {
    if (!schedule) return
    setError('')
    setSubmitting(true)
    const result = await leaveRaidSchedule(schedule.id, guildCode)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || '참여 취소에 실패했습니다.')
      return
    }
    onClose()
    window.location.reload()
  }

  async function handleDelete() {
    if (!schedule) return
    setError('')
    setSubmitting(true)
    const result = await deleteRaidSchedule(schedule.id, guildCode)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || '일정 삭제에 실패했습니다.')
      setConfirming(false)
      return
    }
    onClose()
    window.location.reload()
  }

  async function handleComplete() {
    if (!schedule) return
    setError('')
    setSubmitting(true)
    const result = await completeRaidSchedule(schedule.id, guildCode)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || '완료 처리에 실패했습니다.')
      return
    }
    onClose()
    window.location.reload()
  }

  async function handleUncomplete() {
    if (!schedule) return
    setError('')
    setSubmitting(true)
    const result = await uncompleteRaidSchedule(schedule.id, guildCode)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || '완료 취소에 실패했습니다.')
      return
    }
    onClose()
    window.location.reload()
  }

  // 참여 칸 라벨(정사각/풀폭 공용 텍스트 판정용)
  const joinLabelFull = hasChars
    ? (selectedChar || '캐릭터') +
      ' · ' +
      (effectiveRole === 'support' ? '서포터' : '딜러') +
      '(으)로 참여 신청'
    : '참여 신청'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-32 shrink-0 bg-zinc-900">
          {schedule.raidImage ? (
            <img
              src={schedule.raidImage}
              alt=""
              className={cx(
                'absolute inset-0 h-full w-full object-cover',
                isCompleted ? 'opacity-40 grayscale' : ''
              )}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/40" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-950 to-transparent" />

          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-black/55 text-zinc-200 transition hover:text-white"
            aria-label="닫기"
          >
            X
          </button>

          {isCompleted ? (
            <div className="absolute left-3 top-3 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
              ✓ 완료됨
            </div>
          ) : null}

          {editing ? (
            <div className="absolute left-3 top-3 rounded-md border border-violet-500/40 bg-violet-500/20 px-2 py-0.5 text-[11px] font-bold text-violet-200">
              수정 중
            </div>
          ) : null}

          <div className="absolute bottom-3 left-4">
            <p className="text-xs text-violet-300">
              {dateLabel(schedule.scheduledDate)} · {schedule.scheduledTime || '--:--'}
            </p>
            <h3 className="mt-0.5 text-xl font-bold text-white">{schedule.raidTitle}</h3>
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={cx(
                'rounded-md border px-2 py-0.5 text-xs font-medium',
                diffBadgeClass(schedule.difficulty)
              )}
            >
              {schedule.difficulty}
            </span>
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
              {schedule.skillLevel || '숙련도 미정'}
            </span>
            <span className="ml-auto text-xs text-zinc-500">
              주최 · {schedule.createdByName}
            </span>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-zinc-500">참여 인원</p>
            <div className="flex items-center gap-2">
              <span className="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-300">
                딜러 {dealerCount}
              </span>
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                서포터 {supportCount}
              </span>
              <span className="text-sm text-zinc-300">
                {schedule.participants.length}/{schedule.maxMembers}
              </span>
            </div>
          </div>

          {schedule.participants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
              <p className="text-sm text-zinc-500">아직 참여한 길드원이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {schedule.participants.map((p) => {
                const roleLabel =
                  p.role === 'support' ? '서포터' : p.role === 'dealer' ? '딜러' : null
                const roleClass =
                  p.role === 'support'
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                const ilvl =
                  p.itemLevel != null ? Math.floor(p.itemLevel).toLocaleString() : null
                return (
                  <div
                    key={p.userId}
                    className={cx(
                      'relative flex gap-2.5 overflow-hidden rounded-lg border border-zinc-800 p-2.5',
                      p.cardBgUrl ? '' : 'bg-zinc-900/60'
                    )}
                  >
                    {p.cardBgUrl ? (
                      <>
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: 'url(' + p.cardBgUrl + ')' }}
                        />
                        <div className="absolute inset-0 bg-black/60" />
                      </>
                    ) : null}

                    {p.avatar ? (
                      <img
                        src={p.avatar}
                        alt=""
                        className="relative h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div className="relative min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-100">
                          {p.name}
                        </span>
                        {p.userId === currentUserId ? (
                          <span className="shrink-0 rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">
                            나
                          </span>
                        ) : null}
                      </div>
                      {p.characterClass ? (
                        <>
                          <p className="mt-0.5 text-xs text-zinc-300">
                            {p.characterClass}
                            {ilvl ? ' · Lv ' + ilvl : ''}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {roleLabel ? (
                              <span
                                className={cx(
                                  'rounded border px-1.5 py-0.5 text-[10px] font-medium',
                                  roleClass
                                )}
                              >
                                {roleLabel}
                              </span>
                            ) : null}
                            {p.synergy ? (
                              <span className="rounded border border-zinc-600 bg-zinc-800/90 px-1.5 py-0.5 text-[10px] text-zinc-200">
                                {p.synergy}
                              </span>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <p className="mt-0.5 text-xs text-zinc-500">캐릭터 미연동</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {error ? (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}

          {editing ? (
            /* ───────── 수정 폼 ───────── */
            <div className="mt-5">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                일정 수정
              </p>

              <p className="mb-1.5 text-[11px] text-zinc-500">난이도</p>
              <div className="mb-3 flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setEDiff(d)}
                    className={cx(
                      'flex-1 rounded-lg border py-2 text-sm transition',
                      diffButtonClass(d, eDiff === d)
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 text-[11px] text-zinc-500">숙련도</p>
              <div className="mb-3 flex gap-2">
                {SKILL_LEVELS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setESkill(s)}
                    className={cx(
                      'flex-1 rounded-lg border py-2 text-sm transition',
                      eSkill === s
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 text-[11px] text-zinc-500">날짜</p>
              <input
                type="date"
                value={eDate}
                onChange={(e) => setEDate(e.target.value)}
                className="mb-3 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="mb-1.5 text-[11px] text-zinc-500">인원</p>
                  <div className="flex gap-2">
                    {MEMBER_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setEMax(n)}
                        className={cx(
                          'flex-1 rounded-lg border py-2 text-sm transition',
                          eMax === n
                            ? 'border-violet-500 bg-violet-500/10 text-violet-200'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                        )}
                      >
                        {n}인
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="mb-1.5 text-[11px] text-zinc-500">시작 시간</p>
                  <input
                    type="time"
                    value={eTime}
                    onChange={(e) => setETime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false)
                    setError('')
                  }}
                  disabled={submitting}
                  className="w-24 rounded-lg border border-zinc-800 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800/60 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : '수정 저장'}
                </button>
              </div>
            </div>
          ) : joinExpanded ? (
            /* ───────── 참여 캐릭터 선택 (펼침) ───────── */
            <div className="mt-5">
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                참여 캐릭터 선택
              </p>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {chars.map((c) => {
                  const active = selectedChar === c.name
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedChar(c.name)
                        setSelectedRole(defaultRoleFor(c.characterClass))
                      }}
                      className={cx(
                        'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition',
                        active
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-zinc-100">
                            {c.name}
                          </span>
                          {c.isRepresentative ? (
                            <span className="shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-300">
                              대표
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {c.characterClass || '직업 미상'}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-violet-300">
                        Lv {Math.floor(c.itemLevel).toLocaleString()}
                      </span>
                    </button>
                  )
                })}
              </div>

              {roleSelectable ? (
                <div className="mt-3">
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    역할 선택
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('dealer')}
                      className={cx(
                        'flex-1 rounded-lg border py-2 text-sm font-medium transition',
                        selectedRole === 'dealer'
                          ? 'border-rose-500 bg-rose-500/15 text-rose-200'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                      )}
                    >
                      딜러
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('support')}
                      className={cx(
                        'flex-1 rounded-lg border py-2 text-sm font-medium transition',
                        selectedRole === 'support'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                      )}
                    >
                      서포터
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setJoinExpanded(false)
                    setError('')
                  }}
                  disabled={submitting}
                  className="w-24 rounded-lg border border-zinc-800 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800/60 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleJoin}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {submitting ? '처리 중...' : joinLabelFull}
                </button>
              </div>
            </div>
          ) : (
            /* ───────── 액션 버튼 영역 ───────── */
            <div className="mt-5">
              {isCompleted ? (
                <>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-center text-sm font-medium text-emerald-300">
                    ✓ 완료된 레이드
                  </div>

                  {canManage ? (
                    <>
                      <button
                        onClick={handleUncomplete}
                        disabled={submitting}
                        className="mt-3 w-full rounded-lg border border-amber-500/30 bg-amber-500/5 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
                      >
                        {submitting ? '처리 중...' : '완료 취소'}
                      </button>

                      {confirming ? (
                        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                          <p className="mb-2.5 text-center text-xs text-zinc-300">
                            이 일정을 삭제할까요? 참여자 정보도 함께 사라져요.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirming(false)}
                              disabled={submitting}
                              className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 disabled:opacity-50"
                            >
                              취소
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={submitting}
                              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                            >
                              {submitting ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirming(true)}
                          disabled={submitting}
                          className="mt-3 w-full py-2 text-xs text-zinc-500 transition hover:text-red-300 disabled:opacity-50"
                        >
                          일정 삭제
                        </button>
                      )}
                    </>
                  ) : null}
                </>
              ) : canManage ? (
                <>
                  <button
                    onClick={handleComplete}
                    disabled={submitting}
                    className="mb-2.5 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {submitting ? '처리 중...' : '✓ 레이드 완료 처리'}
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    {/* 참여 칸 */}
                    {joined ? (
                      <button
                        onClick={handleLeave}
                        disabled={submitting}
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/5 py-3 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <span className="text-lg leading-none">−</span>
                        참여취소
                      </button>
                    ) : full ? (
                      <button
                        disabled
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-800/40 py-3 text-xs font-medium text-zinc-500"
                      >
                        <span className="text-lg leading-none">·</span>
                        정원참
                      </button>
                    ) : (
                      <button
                        onClick={onJoinClick}
                        disabled={submitting}
                        className="flex flex-col items-center gap-1.5 rounded-lg bg-violet-600 py-3 text-xs font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                      >
                        <span className="text-lg leading-none">+</span>
                        참여
                      </button>
                    )}

                    {/* 수정 칸 */}
                    <button
                      onClick={startEdit}
                      disabled={submitting}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-violet-500/50 bg-violet-500/10 py-3 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-50"
                    >
                      <span className="text-lg leading-none">✎</span>
                      수정
                    </button>

                    {/* 삭제 칸 */}
                    <button
                      onClick={() => setConfirming(true)}
                      disabled={submitting}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/5 py-3 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <span className="text-lg leading-none">🗑</span>
                      일정삭제
                    </button>
                  </div>

                  {confirming ? (
                    <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                      <p className="mb-2.5 text-center text-xs text-zinc-300">
                        이 일정을 삭제할까요? 참여자 정보도 함께 사라져요.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirming(false)}
                          disabled={submitting}
                          className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={submitting}
                          className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                        >
                          {submitting ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                /* ───────── 일반 길드원 (참여만) ───────── */
                <>
                  {joined ? (
                    <button
                      onClick={handleLeave}
                      disabled={submitting}
                      className="w-full rounded-lg border border-red-500/40 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {submitting ? '처리 중...' : '참여 취소'}
                    </button>
                  ) : full ? (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-lg bg-zinc-800 py-2.5 text-sm font-medium text-zinc-500"
                    >
                      정원이 가득 찼어요
                    </button>
                  ) : (
                    <button
                      onClick={onJoinClick}
                      disabled={submitting}
                      className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                      {submitting ? '처리 중...' : '참여 신청'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
