'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ScheduleCreateModal from './ScheduleCreateModal'
import ScheduleDetailModal, { type RaidSchedule } from './ScheduleDetailModal'
import { getMyCharacters, type MyCharacter } from '@/app/guild/[code]/raids/calendar/actions'

type RaidOption = {
  id: string
  title: string
  image_url: string
  gold_normal: number | null
  gold_hard: number | null
  gold_nightmare: number | null
}

type Props = {
  year: number
  month: number
  guildCode: string
  currentUserId: string
  currentUserRole: string
  schedules: RaidSchedule[]
  raids: RaidOption[]
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function difficultyBarColor(d: string): string {
  if (d === '하드') return '#ef4444'
  if (d === '나메') return '#8b5cf6'
  return '#eab308'
}

function difficultyBadgeClass(d: string): string {
  if (d === '하드') return 'border-red-500/40 bg-red-500/15 text-red-300'
  if (d === '나메') return 'border-violet-500/40 bg-violet-500/15 text-violet-300'
  return 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300'
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function dateLabelKo(dateStr: string): string {
  const p = dateStr.split('-')
  if (p.length !== 3) return dateStr
  const y = Number(p[0])
  const m = Number(p[1])
  const d = Number(p[2])
  if (!y || !m || !d) return dateStr
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  return `${m}월 ${d}일 (${wd})`
}

function ScheduleCard({
  schedule,
  onClick,
}: {
  schedule: RaidSchedule
  onClick: () => void
}) {
  const barColor = difficultyBarColor(schedule.difficulty)
  const completed = schedule.completed

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={`${schedule.raidTitle} · ${schedule.difficulty} · ${schedule.skillLevel}`}
      className={`relative flex w-full items-center gap-2 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/80 p-1.5 text-left transition hover:border-violet-500/50 hover:bg-zinc-900 ${
        completed ? 'opacity-60' : ''
      }`}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: completed ? '#10b981' : barColor }}
      />

      <div className="ml-1 shrink-0">
        {schedule.raidImage ? (
          <img
            src={schedule.raidImage}
            alt=""
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white">
            {schedule.raidTitle.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {completed ? (
            <span className="shrink-0 text-[10px] font-bold text-emerald-400">✓</span>
          ) : null}
          <span className="truncate text-xs font-medium text-zinc-100">
            {schedule.raidTitle}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-violet-300">
            {schedule.scheduledTime || '--:--'}
          </span>
          <span
            className={`rounded border px-1 py-px text-[9px] font-medium ${difficultyBadgeClass(
              schedule.difficulty
            )}`}
          >
            {schedule.difficulty}
          </span>
          <span className="ml-auto font-mono text-[10px] text-zinc-400">
            {schedule.participantCount}/{schedule.maxMembers}
          </span>
        </div>
      </div>
    </button>
  )
}

function DayScheduleListModal({
  open,
  dateStr,
  schedules,
  onClose,
  onPickSchedule,
}: {
  open: boolean
  dateStr: string
  schedules: RaidSchedule[]
  onClose: () => void
  onPickSchedule: (s: RaidSchedule) => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              SCHEDULES
            </p>
            <h3 className="mt-0.5 text-base font-bold text-zinc-100">
              {dateLabelKo(dateStr)} · 일정 {schedules.length}건
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="닫기"
          >
            X
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="space-y-2">
            {schedules.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onClick={() => onPickSchedule(s)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RaidCalendar({
  year,
  month,
  guildCode,
  currentUserId,
  currentUserRole,
  schedules,
  raids,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [detail, setDetail] = useState<RaidSchedule | null>(null)

  const [listOpen, setListOpen] = useState(false)
  const [listDate, setListDate] = useState('')
  const [listSchedules, setListSchedules] = useState<RaidSchedule[]>([])

  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([])

  useEffect(() => {
    let alive = true
    getMyCharacters(guildCode).then((list) => {
      if (alive) setMyCharacters(list)
    })
    return () => {
      alive = false
    }
  }, [guildCode])

  const schedulesByDate: { [key: string]: RaidSchedule[] } = {}
  for (const s of schedules) {
    if (!schedulesByDate[s.scheduledDate]) schedulesByDate[s.scheduledDate] = []
    schedulesByDate[s.scheduledDate].push(s)
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7

  const cells: { day: number | null; dateStr: string | null }[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstWeekday + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ day: null, dateStr: null })
    } else {
      cells.push({ day: dayNum, dateStr: `${year}-${pad2(month)}-${pad2(dayNum)}` })
    }
  }

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 }
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }

  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayStr = `${kstNow.getUTCFullYear()}-${pad2(kstNow.getUTCMonth() + 1)}-${pad2(kstNow.getUTCDate())}`

  function openCreate(dateStr: string) {
    setSelectedDate(dateStr)
    setCreateOpen(true)
  }

  function openList(dateStr: string, list: RaidSchedule[]) {
    setListDate(dateStr)
    setListSchedules(list)
    setListOpen(true)
  }

  function pickFromList(s: RaidSchedule) {
    setListOpen(false)
    setDetail(s)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-zinc-100">
            {year}년 {month}월
          </h2>
          <Link
            href={`/guild/${guildCode}/raids/calendar`}
            className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-300"
          >
            오늘
          </Link>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/guild/${guildCode}/raids/calendar?y=${prev.y}&m=${prev.m}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-300"
            aria-label="이전 달"
          >
            ‹
          </Link>
          <Link
            href={`/guild/${guildCode}/raids/calendar?y=${next.y}&m=${next.m}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-300"
            aria-label="다음 달"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950/40">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`py-2.5 text-center text-xs font-medium ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-cyan-400' : 'text-zinc-500'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const col = idx % 7
              const isToday = cell.dateStr === todayStr
              const daySchedules = cell.dateStr ? schedulesByDate[cell.dateStr] || [] : []
              const visibleSchedules = daySchedules.slice(0, 2)
              const remaining = daySchedules.length - visibleSchedules.length

              return (
                <div
                  key={idx}
                  className={`group relative min-h-[120px] border-b border-r border-zinc-800/70 p-1.5 ${
                    col === 6 ? 'border-r-0' : ''
                  } ${cell.day ? 'cursor-pointer transition hover:bg-zinc-900/40' : 'bg-zinc-950/40'} ${
                    isToday ? 'ring-2 ring-inset ring-violet-500/60' : ''
                  }`}
                  onClick={() => {
                    if (cell.dateStr) openCreate(cell.dateStr)
                  }}
                >
                  {cell.day && (
                    <>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            isToday
                              ? 'text-violet-300'
                              : col === 0
                              ? 'text-red-400'
                              : col === 6
                              ? 'text-cyan-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {cell.day}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {visibleSchedules.map((s) => (
                          <ScheduleCard
                            key={s.id}
                            schedule={s}
                            onClick={() => setDetail(s)}
                          />
                        ))}

                        {remaining > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openList(cell.dateStr as string, daySchedules)
                            }}
                            className="w-full rounded-md py-1 text-[10px] font-medium text-violet-300 transition hover:bg-violet-500/10"
                          >
                            외 {remaining}개 더보기
                          </button>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ScheduleCreateModal
        open={createOpen}
        date={selectedDate}
        guildCode={guildCode}
        raids={raids}
        onClose={() => setCreateOpen(false)}
      />

      <ScheduleDetailModal
        open={detail !== null}
        schedule={detail}
        guildCode={guildCode}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        myCharacters={myCharacters}
        onClose={() => setDetail(null)}
      />

      <DayScheduleListModal
        open={listOpen}
        dateStr={listDate}
        schedules={listSchedules}
        onClose={() => setListOpen(false)}
        onPickSchedule={pickFromList}
      />
    </div>
  )
}
