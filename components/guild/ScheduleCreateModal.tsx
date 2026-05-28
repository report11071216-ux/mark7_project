'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRaidSchedule } from '@/app/guild/[code]/raids/calendar/actions'

type RaidOption = {
  id: string
  title: string
  image_url: string
  gold_normal: number | null
  gold_hard: number | null
  gold_nightmare: number | null
}

type Props = {
  open: boolean
  date: string
  guildCode: string
  raids: RaidOption[]
  onClose: () => void
}

const DIFFICULTIES = ['노말', '하드', '나메']
const SKILL_LEVELS = ['트라이', '클경', '반숙', '숙련']
const MEMBER_OPTIONS = [4, 8]
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

function dateParts(dateStr: string) {
  if (!dateStr) return null
  const p = dateStr.split('-')
  if (p.length !== 3) return null
  const y = Number(p[0])
  const m = Number(p[1])
  const d = Number(p[2])
  if (!y || !m || !d) return null
  return { y: y, m: m, d: d, wd: WEEKDAYS[new Date(y, m - 1, d).getDay()] }
}

function heroDateLabel(dateStr: string): string {
  const dp = dateParts(dateStr)
  if (!dp) return ''
  return dp.m + '월 ' + dp.d + '일 ' + dp.wd + '요일'
}

function previewDateLabel(dateStr: string): string {
  const dp = dateParts(dateStr)
  if (!dp) return ''
  return dp.m + '월 ' + dp.d + '일 (' + dp.wd + ')'
}

function goldFor(raid: RaidOption | undefined, diff: string): number | null {
  if (!raid) return null
  if (diff === '하드') return raid.gold_hard
  if (diff === '나메') return raid.gold_nightmare
  return raid.gold_normal
}

// 통일 색상 - 노말 노랑 / 하드 빨강 / 나메 보라
function diffButtonClass(diff: string, selected: boolean): string {
  if (!selected) {
    return 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
  }
  if (diff === '하드') return 'border-red-500/60 bg-red-500/15 text-red-200'
  if (diff === '나메') return 'border-violet-500/60 bg-violet-500/15 text-violet-200'
  return 'border-yellow-500/60 bg-yellow-500/15 text-yellow-200'
}

function diffBadgeClass(diff: string): string {
  if (diff === '하드') return 'border-red-500/40 bg-red-500/15 text-red-300'
  if (diff === '나메') return 'border-violet-500/40 bg-violet-500/15 text-violet-300'
  return 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300'
}

function diffTextClass(diff: string): string {
  if (diff === '하드') return 'text-red-300'
  if (diff === '나메') return 'text-violet-300'
  return 'text-yellow-300'
}

export default function ScheduleCreateModal({ open, date, guildCode, raids, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'pick' | 'config'>('pick')
  const [raidId, setRaidId] = useState('')
  const [difficulty, setDifficulty] = useState('노말')
  const [skillLevel, setSkillLevel] = useState('트라이')
  const [maxMembers, setMaxMembers] = useState(8)
  const [time, setTime] = useState('21:00')
  const [currentDate, setCurrentDate] = useState(date)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      setStep('pick')
      setRaidId('')
      setDifficulty('노말')
      setSkillLevel('트라이')
      setMaxMembers(8)
      setTime('21:00')
      setCurrentDate(date)
      setError('')
      setSubmitting(false)
    }
  }, [open, date])

  if (!open) return null

  const selectedRaid = raids.find((r) => r.id === raidId)
  const goldHint = goldFor(selectedRaid, difficulty)

  function pickRaid(id: string) {
    setRaidId(id)
    setError('')
    setStep('config')
  }

  async function handleSubmit() {
    setError('')
    if (!raidId) {
      setError('레이드를 선택해주세요.')
      setStep('pick')
      return
    }
    if (!currentDate) {
      setError('날짜를 선택해주세요.')
      return
    }
    if (!time) {
      setError('시작 시간을 입력해주세요.')
      return
    }

    setSubmitting(true)
    const result = await createRaidSchedule({
      guildCode: guildCode,
      raidId: raidId,
      difficulty: difficulty,
      skillLevel: skillLevel,
      maxMembers: maxMembers,
      scheduledDate: currentDate,
      scheduledTime: time,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error || '일정 생성에 실패했습니다.')
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
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'pick' ? (
          <>
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  NEW SCHEDULE
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-zinc-100">레이드 선택</h3>
                <p className="mt-0.5 text-sm text-violet-300">{heroDateLabel(currentDate)}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="닫기"
              >
                X
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-5">
              {raids.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                  <p className="text-sm text-zinc-400">아직 등록된 레이드가 없어요.</p>
                  
                    href={'/guild/' + guildCode + '/raids/new'}
                    className="mt-2 inline-block text-sm font-medium text-violet-300 hover:underline"
                  >
                    레이드 도감에 먼저 등록하기
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {raids.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => pickRaid(r.id)}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-left transition hover:border-violet-500/50 hover:bg-zinc-900"
                    >
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-base font-bold text-white">
                          {r.title.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-zinc-100">
                          {r.title}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                          노말 {(r.gold_normal || 0).toLocaleString()} G
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="relative h-36 shrink-0 bg-zinc-900">
              {selectedRaid && selectedRaid.image_url ? (
                <img
                  src={selectedRaid.image_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/40" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-950 to-transparent" />

              <button
                onClick={() => setStep('pick')}
                className="absolute left-3 top-3 rounded-lg border border-zinc-700 bg-black/55 px-2.5 py-1 text-xs text-zinc-100 transition hover:border-violet-500/60"
              >
                레이드 변경
              </button>
              <button
                onClick={onClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-black/55 text-zinc-200 transition hover:text-white"
                aria-label="닫기"
              >
                X
              </button>

              <div className="absolute bottom-3 left-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-violet-300">
                  {heroDateLabel(currentDate)}
                </p>
                <h3 className="mt-0.5 text-xl font-bold text-white">
                  {selectedRaid ? selectedRaid.title : '레이드'}
                </h3>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="flex flex-col gap-4 md:flex-row md:gap-5">
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    난이도
                  </p>
                  <div className="mb-4 flex gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cx(
                          'flex-1 rounded-lg border py-2 text-sm transition',
                          diffButtonClass(d, difficulty === d)
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    숙련도
                  </p>
                  <div className="mb-4 flex gap-2">
                    {SKILL_LEVELS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSkillLevel(s)}
                        className={cx(
                          'flex-1 rounded-lg border py-2 text-sm transition',
                          skillLevel === s
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    날짜
                  </p>
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="mb-4 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                  />

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                        인원
                      </p>
                      <div className="flex gap-2">
                        {MEMBER_OPTIONS.map((n) => (
                          <button
                            key={n}
                            onClick={() => setMaxMembers(n)}
                            className={cx(
                              'flex-1 rounded-lg border py-2 text-sm transition',
                              maxMembers === n
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
                      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                        시작 시간
                      </p>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 md:w-52 md:shrink-0 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                  <p className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    미리보기 · 캘린더 표시
                  </p>

                  <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                    <p className="mb-1.5 text-[11px] text-zinc-600">{previewDateLabel(currentDate)}</p>
                    <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/90 p-1.5">
                      {selectedRaid && selectedRaid.image_url ? (
                        <img
                          src={selectedRaid.image_url}
                          alt=""
                          className="h-7 w-7 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gradient-to-br from-violet-600 to-fuchsia-600 text-[10px] font-bold text-white">
                          {selectedRaid ? selectedRaid.title.charAt(0) : 'R'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-medium text-zinc-200">
                          {selectedRaid ? selectedRaid.title : '레이드'}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="font-mono text-[10px] text-violet-300">
                            {time || '--:--'}
                          </span>
                          <span
                            className={cx(
                              'rounded border px-1 text-[9px]',
                              diffBadgeClass(difficulty)
                            )}
                          >
                            {difficulty}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                        0/{maxMembers}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-zinc-500">난이도</span>
                      <span className={diffTextClass(difficulty)}>{difficulty}</span>
                    </div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-zinc-500">숙련도</span>
                      <span className="text-cyan-300">{skillLevel}</span>
                    </div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-zinc-500">인원</span>
                      <span className="text-zinc-200">{maxMembers}인</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">예상 보상</span>
                      <span className="text-amber-300">
                        {goldHint != null ? goldHint.toLocaleString() + ' G' : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex gap-2">
                <button
                  onClick={onClose}
                  className="w-24 rounded-lg border border-zinc-800 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800/60"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '일정 등록'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
