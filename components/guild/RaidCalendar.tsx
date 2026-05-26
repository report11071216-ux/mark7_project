'use client'

import { useState } from 'react'
import Link from 'next/link'
import ScheduleCreateModal from './ScheduleCreateModal'

type RaidOption = {
  id: string
  title: string
  image_url: string
  gold_normal: number | null
  gold_hard: number | null
  gold_nightmare: number | null
}

type ScheduleItem = {
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
  participantCount: number
}

type Props = {
  year: number
  month: number
  guildCode: string
  schedules: ScheduleItem[]
  raids: RaidOption[]
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function difficultyStyle(d: string): string {
  if (d === '하드') return 'border-amber-500/30 bg-amber-500/15 text-amber-300'
  if (d === '나메') return 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300'
  return 'border-zinc-600/40 bg-zinc-700/40 text-zinc-300'
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export default function RaidCalendar({ year, month, guildCode, schedules, raids }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  // 날짜별 일정 그룹핑
  const schedulesByDate: { [key: string]: ScheduleItem[] } = {}
  for (const s of schedules) {
    if (!schedulesByDate[s.scheduledDate]) schedulesByDate[s.scheduledDate] = []
    schedulesByDate[s.scheduledDate].push(s)
  }

  // 달력 셀 구성
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

  // 이전/다음 달
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 }
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }

  // KST 오늘
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayStr = `${kstNow.getUTCFullYear()}-${pad2(kstNow.getUTCMonth() + 1)}-${pad2(kstNow.getUTCDate())}`

  function openCreate(dateStr: string) {
    setSelectedDate(dateStr)
    setModalOpen(true)
  }

  return (
    <div>
      {/* 헤더 */}
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

      {/* 달력 */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`py-2 text-center text-xs font-medium ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-cyan-400' : 'text-zinc-500'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const col = idx % 7
              const isToday = cell.dateStr === todayStr
              const daySchedules = cell.dateStr ? schedulesByDate[cell.dateStr] || [] : []

              return (
                <div
                  key={idx}
                  className={`min-h-[118px] border-b border-r border-zinc-800/70 p-1.5 ${
                    col === 6 ? 'border-r-0' : ''
                  } ${cell.day ? '' : 'bg-zinc-950/40'}`}
                >
                  {cell.day && (
                    <>
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-xs font-semibold ${
                            isToday
                              ? 'bg-violet-500 text-white'
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
                        {daySchedules.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/90 p-1"
