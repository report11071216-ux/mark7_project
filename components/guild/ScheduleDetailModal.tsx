'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  joinRaidSchedule,
  leaveRaidSchedule,
  deleteRaidSchedule,
  completeRaidSchedule,
  uncompleteRaidSchedule,
} from '@/app/guild/[code]/raids/calendar/actions'

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
  onClose: () => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

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
  if (diff === '하드') return 'border-amber-500/30 bg-amber-500/15 text-amber-300'
  if (diff === '나메') return 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300'
  return 'border-zinc-600/40 bg-zinc-700/40 text-zinc-300'
}

export default function ScheduleDetailModal({
  open,
  schedule,
  guildCode,
  currentUserId,
  currentUserRole,
  onClose,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

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
    }
  }, [open, schedule])

  if (!open || !schedule) return null

  const joined = schedule.participants.some((p) => p.userId === currentUserId)
  const full = schedule.participants.length >= schedule.maxMembers
  const isOwner = schedule.createdBy === currentUserId
  const isStaff = currentUserRole === 'master' || currentUserRole === 'submaster'
  const canManage = isOwner || isStaff
  const isCompleted = schedule.completed

  // 역할 집계 — 딜러/서포터 수
  let dealerCount = 0
  let supportCount = 0
  for (const p of schedule.participants) {
    if (p.role === 'support') supportCount++
    else if (p.role === 'dealer') dealerCount++
  }

  async function handleJoin() {
    if (!schedule) return
    setError('')
    setSubmitting(true)
    const result = await joinRaidSchedule(schedule.id, guildCode)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || '참여 신청에 실패했습니다.')
      return
    }
    onClose()
    router.refresh()
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
    router.refresh()
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
    router.refresh()
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
    router.refresh()
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
    router.refresh()
  }

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

          <div className="mt-5">
            {isCompleted ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-center text-sm font-medium text-emerald-300">
                ✓ 완료된 레이드
              </div>
            ) : joined ? (
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
                onClick={handleJoin}
                disabled={submitting}
                className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {submitting ? '처리 중...' : '참여 신청'}
              </button>
            )}
          </div>

          {canManage ? (
            <>
              {isCompleted ? (
                <button
                  onClick={handleUncomplete}
                  disabled={submitting}
                  className="mt-3 w-full rounded-lg border border-amber-500/30 bg-amber-500/5 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
                >
                  {submitting ? '처리 중...' : '완료 취소'}
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="mt-3 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? '처리 중...' : '✓ 레이드 완료 처리'}
                </button>
              )}

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
        </div>
      </div>
    </div>
  )
}
