'use client'

import { useState, useRef, useEffect } from 'react'
import { Shuffle, Network, Copy, Check, Users, RotateCw, Info, AlertTriangle, SkipForward } from 'lucide-react'

export type ShuffleMember = {
  userId: string
  name: string
  avatar: string
  characterClass: string
  itemLevel: number | null
}

const TEAM_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const NUM_OPTIONS = [2, 3, 4, 5, 6, 7, 8]
const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#9333ea', '#0d9488', '#e11d48', '#4f46e5', '#16a34a', '#ea580c', '#0ea5e9', '#c026d3']
const TEAM_HEAD = [
  { bg: '#EEEDFE', fg: '#3C3489', chip: '#534AB7' },
  { bg: '#E6F1FB', fg: '#0C447C', chip: '#185FA5' },
  { bg: '#E1F5EE', fg: '#085041', chip: '#0F6E56' },
  { bg: '#FAECE7', fg: '#712B13', chip: '#993C1D' },
  { bg: '#FBEAF0', fg: '#72243E', chip: '#993556' },
  { bg: '#FAEEDA', fg: '#633806', chip: '#854F0B' },
  { bg: '#EAF3DE', fg: '#27500A', chip: '#3B6D11' },
  { bg: '#FCEBEB', fg: '#791F1F', chip: '#A32D2D' },
]
const AV = [
  { bg: '#CECBF6', fg: '#3C3489' },
  { bg: '#9FE1CB', fg: '#085041' },
  { bg: '#F5C4B3', fg: '#712B13' },
  { bg: '#F4C0D1', fg: '#72243E' },
  { bg: '#B5D4F4', fg: '#0C447C' },
  { bg: '#C0DD97', fg: '#27500A' },
  { bg: '#FAC775', fg: '#633806' },
  { bg: '#F7C1C1', fg: '#791F1F' },
]

function cx(...p: (string | false | null | undefined)[]): string {
  return p.filter(Boolean).join(' ')
}

function avColor(s: string): { bg: string; fg: string } {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return AV[h % AV.length]
}

function parseNames(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

function teamSizes(total: number, tc: number): number[] {
  if (tc < 1) return []
  const base = Math.floor(total / tc)
  const rem = total % tc
  const out: number[] = []
  for (let i = 0; i < tc; i++) out.push(base + (i < rem ? 1 : 0))
  return out
}

type Pt = { x: number; y: number }
type Geo = { pts: Pt[]; cum: number[]; total: number }
type Ladder = {
  cols: number
  rows: number
  rungs: boolean[][]
  geo: Geo[]
  perm: number[]
  marginX: number
  colGap: number
  topY: number
  rowGap: number
  bottomY: number
  width: number
  height: number
}

function buildLadder(n: number): Ladder {
  const cols = n
  const rows = Math.max(6, cols + 2)
  const rungs: boolean[][] = []
  for (let r = 0; r < rows; r++) {
    const row: boolean[] = []
    for (let c = 0; c < cols - 1; c++) {
      if (c > 0 && row[c - 1]) row.push(false)
      else row.push(Math.random() < 0.45)
    }
    rungs.push(row)
  }

  const marginX = 26
  const colGap = 58
  const topY = 28
  const rowGap = 26
  const bottomY = topY + (rows + 1) * rowGap
  const xOf = (c: number) => marginX + c * colGap

  const geo: Geo[] = []
  const perm: number[] = []
  for (let i = 0; i < cols; i++) {
    let pos = i
    const pts: Pt[] = [{ x: xOf(i), y: topY }]
    for (let r = 0; r < rows; r++) {
      const ry = topY + (r + 1) * rowGap
      pts.push({ x: xOf(pos), y: ry })
      if (pos > 0 && rungs[r][pos - 1]) {
        pos = pos - 1
        pts.push({ x: xOf(pos), y: ry })
      } else if (pos < cols - 1 && rungs[r][pos]) {
        pos = pos + 1
        pts.push({ x: xOf(pos), y: ry })
      }
    }
    pts.push({ x: xOf(pos), y: bottomY })
    perm.push(pos)

    const cum = [0]
    let total = 0
    for (let k = 1; k < pts.length; k++) {
      const dx = pts[k].x - pts[k - 1].x
      const dy = pts[k].y - pts[k - 1].y
      total += Math.sqrt(dx * dx + dy * dy)
      cum.push(total)
    }
    geo.push({ pts, cum, total })
  }

  const width = marginX * 2 + (cols - 1) * colGap
  const height = bottomY + 28
  return { cols, rows, rungs, geo, perm, marginX, colGap, topY, rowGap, bottomY, width, height }
}

function fullPath(g: Geo): string {
  let d = 'M ' + g.pts[0].x + ' ' + g.pts[0].y
  for (let k = 1; k < g.pts.length; k++) d += ' L ' + g.pts[k].x + ' ' + g.pts[k].y
  return d
}

function partialPath(g: Geo, dist: number): { d: string; x: number; y: number } {
  if (dist <= 0) return { d: 'M ' + g.pts[0].x + ' ' + g.pts[0].y, x: g.pts[0].x, y: g.pts[0].y }
  let d = 'M ' + g.pts[0].x + ' ' + g.pts[0].y
  for (let k = 1; k < g.pts.length; k++) {
    if (g.cum[k] <= dist) {
      d += ' L ' + g.pts[k].x + ' ' + g.pts[k].y
      if (k === g.pts.length - 1) return { d, x: g.pts[k].x, y: g.pts[k].y }
    } else {
      const segStart = g.cum[k - 1]
      const segEnd = g.cum[k]
      const f = segEnd > segStart ? (dist - segStart) / (segEnd - segStart) : 0
      const x = g.pts[k - 1].x + (g.pts[k].x - g.pts[k - 1].x) * f
      const y = g.pts[k - 1].y + (g.pts[k].y - g.pts[k - 1].y) * f
      d += ' L ' + x + ' ' + y
      return { d, x, y }
    }
  }
  const last = g.pts[g.pts.length - 1]
  return { d, x: last.x, y: last.y }
}

type Props = {
  members: ShuffleMember[]
}

export default function TeamShuffle({ members }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [manualRaw, setManualRaw] = useState('')
  const [mode, setMode] = useState<'slot' | 'ladder'>('slot')
  const [splitMode, setSplitMode] = useState<'count' | 'size'>('count')
  const [teamCount, setTeamCount] = useState(2)
  const [teamSize, setTeamSize] = useState(5)
  const [teams, setTeams] = useState<string[][] | null>(null)
  const [copied, setCopied] = useState(false)

  // 슬롯
  const [spinning, setSpinning] = useState(false)
  const [reelName, setReelName] = useState('')
  const reelRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 사다리
  const [ladder, setLadder] = useState<Ladder | null>(null)
  const [ladderNames, setLadderNames] = useState<string[]>([])
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [doneCount, setDoneCount] = useState(0)
  const [drawn, setDrawn] = useState('')
  const [ball, setBall] = useState<{ x: number; y: number; color: string } | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ladderRef = useRef<Ladder | null>(null)
  const finalRef = useRef<string[][] | null>(null)

  // 최종 명단
  const memberNames = members.filter((m) => selectedIds.includes(m.userId)).map((m) => m.name)
  const manualNames = parseNames(manualRaw)
  const seen = new Set<string>()
  const names: string[] = []
  for (const nm of memberNames.concat(manualNames)) {
    if (!seen.has(nm)) {
      seen.add(nm)
      names.push(nm)
    }
  }
  const total = names.length
  const selectedCount = members.filter((m) => selectedIds.includes(m.userId)).length

  function getTc(t: number): number {
    if (t < 1) return 0
    return splitMode === 'count' ? Math.min(teamCount, t) : Math.max(1, Math.ceil(t / teamSize))
  }
  const tc = getTc(total)
  const sizes = teamSizes(total, tc)
  const playing = spinning || phase === 'playing'

  function cancelAll() {
    if (reelRef.current) {
      clearTimeout(reelRef.current)
      reelRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => cancelAll()
  }, [])

  function reset() {
    cancelAll()
    setSpinning(false)
    setTeams(null)
    setLadder(null)
    setPhase('idle')
    setDoneCount(0)
    setDrawn('')
    setBall(null)
    setCopied(false)
  }

  function toggleMember(id: string) {
    reset()
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat(id)))
  }
  function selectAll() {
    reset()
    setSelectedIds(members.map((m) => m.userId))
  }
  function clearAll() {
    reset()
    setSelectedIds([])
  }

  function assignRoundRobin(list: string[], count: number): string[][] {
    const res: string[][] = []
    for (let i = 0; i < count; i++) res.push([])
    list.forEach((nm, i) => res[i % count].push(nm))
    return res
  }

  function runSlot() {
    if (total < 2 || playing) return
    cancelAll()
    setLadder(null)
    setPhase('idle')
    const count = getTc(total)
    const result = assignRoundRobin(shuffle(names), count)
    setTeams(null)
    setCopied(false)
    setSpinning(true)
    const pool = names.slice()
    const start = Date.now()
    const duration = 1500
    const tick = () => {
      const elapsed = Date.now() - start
      setReelName(pool[Math.floor(Math.random() * pool.length)])
      if (elapsed >= duration) {
        cancelAll()
        setSpinning(false)
        setTeams(result)
        return
      }
      const delay = 50 + (elapsed / duration) * 130
      reelRef.current = setTimeout(tick, delay)
    }
    tick()
  }

  function animatePlayer(i: number) {
    const l = ladderRef.current
    if (!l) return
    if (i >= l.cols) {
      setPhase('done')
      setDoneCount(l.cols)
      setBall(null)
      setDrawn('')
      setTeams(finalRef.current)
      return
    }
    const g = l.geo[i]
    const color = COLORS[i % COLORS.length]
    const dur = 850
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const dist = t * g.total
      const cur = partialPath(g, dist)
      setDrawn(cur.d)
      setBall({ x: cur.x, y: cur.y, color })
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setDoneCount(i + 1)
        setDrawn('')
        setBall(null)
        timerRef.current = setTimeout(() => animatePlayer(i + 1), 220)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  function runLadder() {
    if (total < 2 || playing) return
    cancelAll()
    const shuffled = shuffle(names)
    const count = getTc(shuffled.length)
    const l = buildLadder(shuffled.length)
    const grouped: string[][] = []
    for (let i = 0; i < count; i++) grouped.push([])
    shuffled.forEach((nm, i) => {
      grouped[l.perm[i] % count].push(nm)
    })
    ladderRef.current = l
    finalRef.current = grouped
    setLadder(l)
    setLadderNames(shuffled)
    setTeams(null)
    setCopied(false)
    setDoneCount(0)
    setDrawn('')
    setBall(null)
    setPhase('playing')
    timerRef.current = setTimeout(() => animatePlayer(0), 150)
  }

  function skipLadder() {
    const l = ladderRef.current
    if (!l) return
    cancelAll()
    setDoneCount(l.cols)
    setDrawn('')
    setBall(null)
    setPhase('done')
    setTeams(finalRef.current)
  }

  function run() {
    if (mode === 'slot') runSlot()
    else runLadder()
  }

  function copyTeams() {
    if (!teams) return
    const lines = ['팀 편성']
    teams.forEach((team, i) => {
      lines.push('팀 ' + TEAM_LABELS[i] + ': ' + team.join(', '))
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

  const canRun = total >= 2 && !playing
  const numOptions = splitMode === 'count' ? teamCount : teamSize
  const numLabel = splitMode === 'count' ? '팀 개수' : '한 팀 인원'

  return (
    <div>
      <style>{`
        @keyframes slotPop {
          0% { opacity: 0; transform: translateY(-7px); }
          60% { opacity: 1; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 길드원 카드 그리드 */}
      {members.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Users className="h-4 w-4 text-violet-600" />
              길드원
            </span>
            <span className="text-xs text-slate-400">
              {selectedCount} / {members.length}명 선택
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {members.map((m) => {
              const on = selectedIds.includes(m.userId)
              const av = avColor(m.name)
              const sub = [
                m.characterClass,
                m.itemLevel != null ? Math.floor(m.itemLevel).toLocaleString() : null,
              ]
                .filter(Boolean)
                .join(' · ')
              return (
                <button
                  key={m.userId}
                  type="button"
                  disabled={playing}
                  onClick={() => toggleMember(m.userId)}
                  className={cx(
                    'relative flex items-center gap-2.5 rounded-lg border-2 p-2 text-left transition disabled:opacity-50',
                    on ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300'
                  )}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                      style={{ backgroundColor: av.bg, color: av.fg }}
                    >
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-slate-900">{m.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{sub || '미연동'}</p>
                  </div>
                  {on ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-violet-600">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              onClick={selectAll}
              disabled={playing}
              className="flex-1 rounded-md border border-slate-200 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={playing}
              className="flex-1 rounded-md border border-slate-200 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              모두 해제
            </button>
          </div>
        </div>
      ) : null}

      {/* 직접 입력 */}
      <div className={cx('rounded-xl border border-slate-200 bg-white p-4', members.length > 0 ? 'mt-3' : '')}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">
            직접 입력 {members.length > 0 ? <span className="text-[12px] font-normal text-slate-400">외부 참가자</span> : null}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[12px] font-medium text-violet-800">
            <Users className="h-3 w-3" />총 {total}명
          </span>
        </div>
        <textarea
          value={manualRaw}
          onChange={(e) => {
            setManualRaw(e.target.value)
            reset()
          }}
          rows={3}
          placeholder={'한 줄에 한 명씩 (쉼표도 가능)'}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder-slate-300 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {/* 방식 + 나누기 기준 + 숫자 */}
      <div className="mt-3 rounded-xl bg-slate-100 p-3.5">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            disabled={playing}
            onClick={() => {
              setMode('slot')
              reset()
            }}
            className={cx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-bold transition disabled:opacity-60',
              mode === 'slot' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:text-slate-700'
            )}
          >
            <Shuffle className="h-4 w-4" />
            슬롯머신
          </button>
          <button
            type="button"
            disabled={playing}
            onClick={() => {
              setMode('ladder')
              reset()
            }}
            className={cx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-bold transition disabled:opacity-60',
              mode === 'ladder' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:text-slate-700'
            )}
          >
            <Network className="h-4 w-4" />
            사다리타기
          </button>
        </div>

        <p className="mb-1.5 text-[12px] font-bold text-slate-500">나누기 기준</p>
        <div className="mb-3 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            disabled={playing}
            onClick={() => {
              setSplitMode('count')
              reset()
            }}
            className={cx(
              'flex-1 rounded-md py-1.5 text-[12px] transition disabled:opacity-60',
              splitMode === 'count' ? 'bg-violet-100 font-bold text-violet-800' : 'text-slate-500'
            )}
          >
            팀 개수로
          </button>
          <button
            type="button"
            disabled={playing}
            onClick={() => {
              setSplitMode('size')
              reset()
            }}
            className={cx(
              'flex-1 rounded-md py-1.5 text-[12px] transition disabled:opacity-60',
              splitMode === 'size' ? 'bg-violet-100 font-bold text-violet-800' : 'text-slate-500'
            )}
          >
            팀당 인원으로
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[12px] font-bold text-slate-500">{numLabel}</span>
          <div className="flex flex-wrap gap-1.5">
            {NUM_OPTIONS.map((n) => {
              const on = numOptions === n
              return (
                <button
                  key={n}
                  type="button"
                  disabled={playing}
                  onClick={() => {
                    if (splitMode === 'count') setTeamCount(n)
                    else setTeamSize(n)
                    reset()
                  }}
                  className={cx(
                    'flex h-8 w-8 items-center justify-center rounded-md text-[13px] transition disabled:opacity-60',
                    on ? 'bg-violet-600 font-bold text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-violet-300'
                  )}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div className="flex-1" />
          {phase === 'playing' ? (
            <button
              type="button"
              onClick={skipLadder}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <SkipForward className="h-3.5 w-3.5" />
              건너뛰기
            </button>
          ) : (
            <button
              type="button"
              onClick={run}
              disabled={!canRun}
              className="flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {teams ? <RotateCw className={cx('h-3.5 w-3.5', spinning ? 'animate-spin' : '')} /> : <Shuffle className={cx('h-3.5 w-3.5', spinning ? 'animate-spin' : '')} />}
              {spinning ? '돌리는 중...' : teams ? '다시' : mode === 'slot' ? '팀 뽑기' : '사다리 타기'}
            </button>
          )}
        </div>

        {total < 2 ? (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="text-[12px] font-medium text-amber-700">참가자를 2명 이상 골라야 팀을 짤 수 있어요.</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-violet-50 px-3 py-2">
            <Info className="h-4 w-4 shrink-0 text-violet-600" />
            <span className="text-[12px] font-medium text-violet-700">
              {splitMode === 'count'
                ? total + '명을 ' + tc + '개 팀으로 나눠요 (' + sizes.join('·') + '명)'
                : total + '명을 팀당 ' + teamSize + '명씩 → ' + tc + '팀 (' + sizes.join('·') + '명)'}
            </span>
          </div>
        )}
      </div>

      {/* 슬롯 연출 */}
      {mode === 'slot' && spinning ? (
        <div className="mt-3 flex h-24 flex-col items-center justify-center rounded-xl border border-violet-200 bg-white">
          <p className="text-[11px] font-bold text-violet-400">두구두구... 팀을 뽑는 중</p>
          <p className="mt-1 text-xl font-bold text-violet-700">{reelName || '...'}</p>
        </div>
      ) : null}

      {/* 사다리 */}
      {mode === 'ladder' && ladder ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          {phase === 'playing' ? (
            <p className="mb-2 text-center text-[12px] font-bold text-violet-600">
              사다리 타는 중... {doneCount} / {ladder.cols}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <svg width={ladder.width} height={ladder.height} className="mx-auto block">
              {Array.from({ length: ladder.cols }).map((_, c) => {
                const x = ladder.marginX + c * ladder.colGap
                return <line key={'v' + c} x1={x} y1={ladder.topY} x2={x} y2={ladder.bottomY} stroke="#e2e8f0" strokeWidth={2} />
              })}
              {ladder.rungs.map((row, r) =>
                row.map((on, c) => {
                  if (!on) return null
                  const x1 = ladder.marginX + c * ladder.colGap
                  const x2 = ladder.marginX + (c + 1) * ladder.colGap
                  const y = ladder.topY + (r + 1) * ladder.rowGap
                  return <line key={'r' + r + '-' + c} x1={x1} y1={y} x2={x2} y2={y} stroke="#cbd5e1" strokeWidth={2} />
                })
              )}
              {ladder.geo.map((g, i) => {
                if (phase !== 'done' && i >= doneCount) return null
                return (
                  <path key={'done' + i} d={fullPath(g)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
                )
              })}
              {phase === 'playing' && drawn ? (
                <path d={drawn} fill="none" stroke={ball ? ball.color : '#7c3aed'} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
              {ball ? <circle cx={ball.x} cy={ball.y} r={6} fill={ball.color} stroke="#fff" strokeWidth={2} /> : null}
              {ladderNames.map((nm, i) => {
                const x = ladder.marginX + i * ladder.colGap
                return (
                  <text key={'tn' + i} x={x} y={16} textAnchor="middle" fontSize={9} fontWeight={700} fill={COLORS[i % COLORS.length]}>
                    {nm.length > 6 ? nm.slice(0, 6) : nm}
                  </text>
                )
              })}
              {Array.from({ length: ladder.cols }).map((_, p) => {
                const x = ladder.marginX + p * ladder.colGap
                const h = TEAM_HEAD[(p % tc) % TEAM_HEAD.length]
                return (
                  <text key={'bt' + p} x={x} y={ladder.bottomY + 18} textAnchor="middle" fontSize={11} fontWeight={800} fill={h.chip}>
                    {TEAM_LABELS[p % tc]}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>
      ) : null}

      {/* 결과 */}
      {teams && !spinning && phase !== 'playing' ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-bold text-slate-900">팀 편성 결과</span>
            <button
              type="button"
              onClick={copyTeams}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {teams.map((team, i) => {
              const h = TEAM_HEAD[i % TEAM_HEAD.length]
              return (
                <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: h.bg }}>
                    <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: h.fg }}>
                      <span className="flex h-5 w-5 items-center justify-center rounded-md text-[12px] font-bold text-white" style={{ backgroundColor: h.chip }}>
                        {TEAM_LABELS[i]}
                      </span>
                      팀 {TEAM_LABELS[i]}
                    </span>
                    <span className="text-[11px]" style={{ color: h.chip }}>{team.length}명</span>
                  </div>
                  <div className="flex flex-col gap-1.5 px-3 py-2.5">
                    {team.map((nm, mi) => (
                      <span
                        key={mi}
                        className="text-[13px] text-slate-800"
                        style={{ animation: 'slotPop 0.3s ease-out both', animationDelay: (i * 0.08 + mi * 0.05) + 's' }}
                      >
                        {nm}
                      </span>
                    ))}
                    {team.length === 0 ? <span className="text-[12px] text-slate-300">-</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
