'use client'

import { useState, useRef, useEffect } from 'react'
import { Shuffle, Network, Copy, Check, Users, RotateCw } from 'lucide-react'

const TEAM_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const TEAM_COUNTS = [2, 3, 4, 5, 6, 7, 8]
const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#9333ea', '#0d9488', '#e11d48', '#4f46e5', '#16a34a', '#ea580c', '#0ea5e9', '#c026d3']

function cx(...p: (string | false | null | undefined)[]): string {
  return p.filter(Boolean).join(' ')
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

type Ladder = {
  cols: number
  rows: number
  rungs: boolean[][]
  paths: string[]
  perm: number[]
  bottomTeam: string[]
  marginX: number
  colGap: number
  topY: number
  rowGap: number
  bottomY: number
  width: number
  height: number
}

function buildLadder(n: number, teamCount: number): Ladder {
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
  const colGap = 56
  const topY = 26
  const rowGap = 24
  const bottomY = topY + (rows + 1) * rowGap
  const xOf = (c: number) => marginX + c * colGap

  const paths: string[] = []
  const perm: number[] = []
  for (let i = 0; i < cols; i++) {
    let pos = i
    let d = 'M ' + xOf(i) + ' ' + topY
    for (let r = 0; r < rows; r++) {
      const ry = topY + (r + 1) * rowGap
      d += ' L ' + xOf(pos) + ' ' + ry
      if (pos > 0 && rungs[r][pos - 1]) {
        pos = pos - 1
        d += ' L ' + xOf(pos) + ' ' + ry
      } else if (pos < cols - 1 && rungs[r][pos]) {
        pos = pos + 1
        d += ' L ' + xOf(pos) + ' ' + ry
      }
    }
    d += ' L ' + xOf(pos) + ' ' + bottomY
    paths.push(d)
    perm.push(pos)
  }

  const bottomTeam: string[] = []
  for (let p = 0; p < cols; p++) bottomTeam.push(TEAM_LABELS[p % teamCount])

  const width = marginX * 2 + (cols - 1) * colGap
  const height = bottomY + 26

  return { cols, rows, rungs, paths, perm, bottomTeam, marginX, colGap, topY, rowGap, bottomY, width, height }
}

export default function TeamShuffle() {
  const [raw, setRaw] = useState('')
  const [mode, setMode] = useState<'slot' | 'ladder'>('slot')
  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<string[][] | null>(null)
  const [copied, setCopied] = useState(false)

  // 슬롯
  const [spinning, setSpinning] = useState(false)
  const [reelName, setReelName] = useState('')
  const reelRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 사다리
  const [ladder, setLadder] = useState<Ladder | null>(null)
  const [ladderNames, setLadderNames] = useState<string[]>([])

  const names = parseNames(raw)
  const effTeams = Math.min(teamCount, Math.max(1, names.length))

  function stopReel() {
    if (reelRef.current !== null) {
      clearTimeout(reelRef.current)
      reelRef.current = null
    }
  }
  useEffect(() => {
    return () => stopReel()
  }, [])

  function reset() {
    stopReel()
    setSpinning(false)
    setTeams(null)
    setLadder(null)
    setCopied(false)
  }

  function assignRoundRobin(list: string[]): string[][] {
    const tc = Math.min(teamCount, list.length)
    const res: string[][] = []
    for (let i = 0; i < tc; i++) res.push([])
    list.forEach((nm, i) => res[i % tc].push(nm))
    return res
  }

  function runSlot() {
    if (names.length < 2 || spinning) return
    stopReel()
    setLadder(null)
    const result = assignRoundRobin(shuffle(names))
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

  function runLadder() {
    if (names.length < 2) return
    stopReel()
    setSpinning(false)
    setTeams(null)
    setCopied(false)
    const shuffled = shuffle(names)
    const l = buildLadder(shuffled.length, teamCount)
    // 결과 팀 구성
    const res: { [team: string]: string[] } = {}
    shuffled.forEach((nm, i) => {
      const team = l.bottomTeam[l.perm[i]]
      if (!res[team]) res[team] = []
      res[team].push(nm)
    })
    const tc = Math.min(teamCount, shuffled.length)
    const grouped: string[][] = []
    for (let i = 0; i < tc; i++) grouped.push(res[TEAM_LABELS[i]] ?? [])
    setLadderNames(shuffled)
    setLadder(l)
    setTeams(grouped)
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

  const canRun = names.length >= 2 && !spinning

  return (
    <div>
      <style>{`
        @keyframes slotPop {
          0% { opacity: 0; transform: translateY(-7px); }
          60% { opacity: 1; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ladderDraw {
          from { stroke-dashoffset: 2600; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* 이름 입력 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <Users className="h-4 w-4 text-violet-600" />
            참가자 이름
          </span>
          <span className="text-[11px] text-slate-400">{names.length}명</span>
        </div>
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            reset()
          }}
          rows={4}
          placeholder={'한 줄에 한 명씩 입력하세요\n예)\n농낭판치\n홍길동\n쁘밍이'}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder-slate-300 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <p className="mt-1 text-[11px] text-slate-400">줄바꿈 또는 쉼표(,)로 구분돼요.</p>
      </div>

      {/* 방식 + 팀 개수 */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="mb-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('slot')
              reset()
            }}
            className={cx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition',
              mode === 'slot' ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            )}
          >
            <Shuffle className="h-3.5 w-3.5" />
            슬롯머신
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('ladder')
              reset()
            }}
            className={cx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition',
              mode === 'ladder' ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            )}
          >
            <Network className="h-3.5 w-3.5" />
            사다리타기
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">팀 개수</span>
          <div className="flex flex-wrap gap-1">
            {TEAM_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={spinning}
                onClick={() => {
                  setTeamCount(n)
                  reset()
                }}
                className={cx(
                  'rounded-md px-2.5 py-1 text-xs font-bold transition disabled:opacity-50',
                  teamCount === n ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={run}
            disabled={!canRun}
            className="flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {teams || ladder ? <RotateCw className={cx('h-3.5 w-3.5', spinning ? 'animate-spin' : '')} /> : <Shuffle className={cx('h-3.5 w-3.5', spinning ? 'animate-spin' : '')} />}
            {spinning ? '돌리는 중...' : teams || ladder ? '다시' : mode === 'slot' ? '팀 뽑기' : '사다리 타기'}
          </button>
        </div>

        {names.length < 2 ? (
          <p className="mt-2 text-[11px] text-slate-400">이름을 2명 이상 입력하면 팀을 짤 수 있어요.</p>
        ) : (
          <p className="mt-2 text-[11px] text-slate-400">{names.length}명을 {effTeams}개 팀으로 나눠요.</p>
        )}
      </div>

      {/* 슬롯 연출 */}
      {mode === 'slot' && spinning ? (
        <div className="mt-3 flex h-24 flex-col items-center justify-center rounded-xl border border-violet-200 bg-white">
          <p className="text-[11px] font-bold text-violet-400">두구두구... 팀을 뽑는 중</p>
          <p className="mt-1 text-xl font-bold text-violet-700">{reelName || '...'}</p>
        </div>
      ) : null}

      {/* 사다리 그림 */}
      {mode === 'ladder' && ladder ? (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
          <svg width={ladder.width} height={ladder.height} className="mx-auto block">
            {/* 세로줄 */}
            {Array.from({ length: ladder.cols }).map((_, c) => {
              const x = ladder.marginX + c * ladder.colGap
              return <line key={'v' + c} x1={x} y1={ladder.topY} x2={x} y2={ladder.bottomY} stroke="#e2e8f0" strokeWidth={2} />
            })}
            {/* 가로 가지 */}
            {ladder.rungs.map((row, r) =>
              row.map((on, c) => {
                if (!on) return null
                const x1 = ladder.marginX + c * ladder.colGap
                const x2 = ladder.marginX + (c + 1) * ladder.colGap
                const y = ladder.topY + (r + 1) * ladder.rowGap
                return <line key={'r' + r + '-' + c} x1={x1} y1={y} x2={x2} y2={y} stroke="#cbd5e1" strokeWidth={2} />
              })
            )}
            {/* 각 참가자 경로 */}
            {ladder.paths.map((d, i) => (
              <path
                key={'p' + i}
                d={d}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 2600, animation: 'ladderDraw 0.9s ease-out forwards', animationDelay: i * 0.12 + 's' }}
              />
            ))}
            {/* 위: 이름 */}
            {ladderNames.map((nm, i) => {
              const x = ladder.marginX + i * ladder.colGap
              return (
                <text key={'tn' + i} x={x} y={14} textAnchor="middle" fontSize={9} fontWeight={700} fill={COLORS[i % COLORS.length]}>
                  {nm.length > 6 ? nm.slice(0, 6) : nm}
                </text>
              )
            })}
            {/* 아래: 팀 */}
            {ladder.bottomTeam.map((tm, p) => {
              const x = ladder.marginX + p * ladder.colGap
              return (
                <text key={'bt' + p} x={x} y={ladder.bottomY + 16} textAnchor="middle" fontSize={11} fontWeight={800} fill="#7c3aed">
                  {tm}
                </text>
              )
            })}
          </svg>
        </div>
      ) : null}

      {/* 결과 */}
      {teams && !spinning ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">팀 편성 결과</span>
            <button
              type="button"
              onClick={copyTeams}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {teams.map((team, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                    <span className="flex h-4 w-4 items-center justify-center rounded text-[10px] text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                      {TEAM_LABELS[i]}
                    </span>
                    팀 {TEAM_LABELS[i]}
                  </span>
                  <span className="text-[11px] text-slate-400">{team.length}명</span>
                </div>
                <div className="space-y-1">
                  {team.map((nm, mi) => (
                    <div
                      key={mi}
                      className="text-xs font-medium text-slate-800"
                      style={{ animation: 'slotPop 0.3s ease-out both', animationDelay: (i * 0.1 + mi * 0.05) + 's' }}
                    >
                      {nm}
                    </div>
                  ))}
                  {team.length === 0 ? <p className="text-[11px] text-slate-300">-</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
