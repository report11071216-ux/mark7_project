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

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  const wd = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()]
  return y + '년 ' + m + '월 ' + d + '일 (' + wd + ')'
}

function goldFor(raid: RaidOption | undefined, diff: string): number | null {
  if (!raid) return null
  if (diff === '하드') return raid.gold_hard
  if (diff === '나메') return raid.gold_nightmare
  return raid.gold_normal
}

export default function ScheduleCreateModal({ open, date, guildCode, raids, onClose }: Props) {
  const router = useRouter()
  const [raidId, setRaidId] = useState('')
  const [difficulty, setDifficulty] = useState('노말')
  const [skillLevel, setSkillLevel] = useState('트라이')
  const [maxMembers, setMaxMembers] = useState(8)
  const [time, setTime] = useState('21:00')
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
      setRaidId('')
      setDifficulty('노말')
      setSkillLevel('트라이')
      setMaxMembers(8)
      setTime('21:00')
      setError('')
      setSubmitting(false)
    }
  }, [open, date])

  if (!open) return null

  const selectedRaid = raids.find((r) => r.id === raidId)
  const goldHint = goldFor(selectedRaid, difficulty)

  async function handleSubmit() {
    setError('')
    if (!raidId) {
      setError('레이드를 선택해주세요.')
      return
    }
    if (!time) {
      setError('시작 시간을 입력해주세요.')
      return
    }

    setSubmitting(true)
    const result = await createRaidSchedule({
      guildCode,
      raidId,
      difficulty,
      skillLevel,
      maxMembers,
      scheduledDate: date,
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              NEW SCHEDULE
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-zinc-100">레이드 일정 만들기</h3>
            <p className="mt-0.5 text-sm text-violet-300">{formatDateLabel(date)}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {raids.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm text-zinc-400">아직 등록된 레이드가 없어요.</p>
            
              href={'/guild/' + guildCode + '/raids/new'}
              className="mt-2 inline-block text-sm font-medium text-violet-300 hover:underline"
            >
              레이드 도감에 먼저 등록하기 →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                레이드
              </p>
              <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1">
                {raids.map((r) => {
                  const selected = r.id === raidId
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRaidId(r.id)}
                      className={
                        'flex items-center gap-2 rounded-lg border p-2 text-left transition ' +
                        (selected
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700')
                      }
                    >
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white">
                          {r.title.charAt(0)}
                        </div>
                      )}
                      <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">
                        {r.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                난이도
              </p>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={
                      'flex-1 rounded-lg border py-2 text-sm transition ' +
                      (difficulty === d
                        ? 'border-violet-500 bg-violet-500/10 text-violet-200'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700')
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
              {goldHint != null ? (
                <p className="mt-1.5 font-mono text-[11px] text-amber-300/80">
                  예상 보상 {goldHint.toLocaleString()} G
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                숙련도
              </p>
              <div className="flex gap-2">
                {SKILL_LEVELS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSkillLevel(s)}
                    className={
                      'flex-1 rounded-lg border py-2 text-sm transition ' +
                      (skillLevel === s
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700')
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

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
                      className={
                        'flex-1 rounded-lg border py-2 text-sm transition ' +
                        (maxMembers === n
                          ? 'border-violet-500 bg-violet-500/10 text-violet-200'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700')
                      }
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

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-800 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800/60"
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
        )}
      </div>
    </div>
  )
}
