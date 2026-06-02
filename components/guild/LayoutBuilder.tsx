'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { WIDGET_META, type WidgetId } from '@/lib/themes'
import { type LayoutColumns } from '@/lib/guild-layout-config'
import { saveCustomLayout } from '@/app/actions/guild-theme'

type ColKey = 'left' | 'center' | 'right'

const ALL_WIDGET_IDS: WidgetId[] = [
  'notice', 'pointRanking', 'attendance', 'calendar', 'stats',
  'guardian', 'recentMembers', 'onlineMembers', 'raidStatus',
  'raidSchedule', 'raidCalendar', 'raidActivity', 'guildIntro', 'discord',
]

const COLUMN_LABELS: { key: ColKey; label: string }[] = [
  { key: 'left', label: '왼쪽 컬럼' },
  { key: 'center', label: '가운데 컬럼' },
  { key: 'right', label: '오른쪽 컬럼' },
]

type Props = {
  guildId: string
  guildCode: string
  initialLayout: LayoutColumns
}

export default function LayoutBuilder({ guildId, guildCode, initialLayout }: Props) {
  const router = useRouter()
  const [layout, setLayout] = useState<LayoutColumns>(initialLayout)
  const [dragId, setDragId] = useState<WidgetId | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const [overId, setOverId] = useState<WidgetId | null>(null)
  const [saving, setSaving] = useState(false)

  const dirty = JSON.stringify(layout) !== JSON.stringify(initialLayout)

  useEffect(() => {
    if (!dirty) return
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const placed = new Set<string>()
  for (const w of layout.left) placed.add(w.id)
  for (const w of layout.center) placed.add(w.id)
  for (const w of layout.right) placed.add(w.id)
  const drawer = ALL_WIDGET_IDS.filter((id) => !placed.has(id))

  function placeWidget(id: WidgetId, target: ColKey | 'drawer', beforeId?: WidgetId | null) {
    if (beforeId && beforeId === id) return
    setLayout((prev) => {
      const cleaned: LayoutColumns = {
        left: prev.left.filter((w) => w.id !== id),
        center: prev.center.filter((w) => w.id !== id),
        right: prev.right.filter((w) => w.id !== id),
      }
      if (target === 'drawer') return cleaned
      const col = [...cleaned[target]]
      if (beforeId) {
        const idx = col.findIndex((w) => w.id === beforeId)
        if (idx === -1) col.push({ id })
        else col.splice(idx, 0, { id })
      } else {
        col.push({ id })
      }
      return { ...cleaned, [target]: col }
    })
  }

  function moveInColumn(colKey: ColKey, id: WidgetId, dir: number) {
    setLayout((prev) => {
      const col = [...prev[colKey]]
      const idx = col.findIndex((w) => w.id === id)
      const next = idx + dir
      if (idx < 0 || next < 0 || next >= col.length) return prev
      const tmp = col[next]
      col[next] = col[idx]
      col[idx] = tmp
      return { ...prev, [colKey]: col }
    })
  }

  function onDragStart(id: WidgetId, e: React.DragEvent) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function onDragEnd() {
    setDragId(null)
    setOverCol(null)
    setOverId(null)
  }

  async function handleSave() {
    if (!dirty || saving) return
    setSaving(true)
    try {
      await saveCustomLayout(guildId, guildCode, layout)
      toast.success('홈 레이아웃이 저장됐어요')
      router.push('/guild/' + guildCode)
      router.refresh()
    } catch (e: any) {
      toast.error(e && e.message ? e.message : '저장에 실패했습니다.')
      setSaving(false)
    }
  }

  function resetLayout() {
    if (!dirty) return
    setLayout(initialLayout)
  }

  function PlacedCard({ colKey, id, index, total }: { colKey: ColKey; id: WidgetId; index: number; total: number }) {
    const meta = WIDGET_META[id]
    const dragging = dragId === id
    const showLine = !!dragId && overId === id && dragId !== id
    return (
      <div>
        {showLine ? <div className="mb-1.5 h-0.5 rounded bg-violet-500" /> : null}
        <div
          draggable
          onDragStart={(e) => onDragStart(id, e)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOverCol(colKey)
            setOverId(id)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (dragId) placeWidget(dragId, colKey, id)
            onDragEnd()
          }}
          className={
            'flex items-center gap-2 rounded-lg border bg-zinc-900 p-2 transition ' +
            (dragging ? 'border-violet-500 opacity-40' : 'border-zinc-800')
          }
        >
          <span className="cursor-grab select-none text-zinc-600">⠿</span>
          <span className="text-base">{meta ? meta.icon : '▫'}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
            {meta ? meta.label : id}
          </span>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => moveInColumn(colKey, id, -1)}
              disabled={index === 0}
              className="px-1 text-xs text-zinc-500 hover:text-violet-300 disabled:opacity-20"
              aria-label="위로"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => moveInColumn(colKey, id, 1)}
              disabled={index === total - 1}
              className="px-1 text-xs text-zinc-500 hover:text-violet-300 disabled:opacity-20"
              aria-label="아래로"
            >
              ▼
            </button>
          </div>
          <button
            type="button"
            onClick={() => placeWidget(id, 'drawer')}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-800 hover:text-red-300"
            aria-label="제거"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  function PreviewBox({ id }: { id: WidgetId }) {
    const meta = WIDGET_META[id]
    return (
      <div className="flex items-center gap-1.5 rounded bg-zinc-800 px-2 py-1.5">
        <span className="text-[11px]">{meta ? meta.icon : '▫'}</span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-300">
          {meta ? meta.label : id}
        </span>
      </div>
    )
  }

  function PreviewColumn({ items }: { items: { id: WidgetId }[] }) {
    if (items.length === 0) {
      return (
        <div className="rounded border border-dashed border-zinc-800 py-4 text-center text-[10px] text-zinc-700">
          비어 있음
        </div>
      )
    }
    return (
      <div className="space-y-1.5">
        {items.map((w) => (
          <PreviewBox key={w.id} id={w.id} />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">LAYOUT BUILDER</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-100">홈 화면 편집</h1>
          <p className="mt-1 text-sm text-zinc-500">
            위젯을 끌어서 좌·중·우 컬럼에 배치하세요. 위아래 화살표로 순서를 조정할 수 있어요.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={resetLayout}
            disabled={!dirty}
            className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 disabled:opacity-40"
          >
            되돌리기
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {saving ? '저장 중...' : dirty ? '저장' : '저장됨'}
          </button>
        </div>
      </div>

      {/* 실시간 미리보기 */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          미리보기 · 실제 홈 배치
        </p>
        <div className="rounded-lg bg-zinc-900/60 p-2.5">
          <div className="mb-2 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <div className="h-5 w-5 rounded bg-violet-600/70" />
            <div className="h-2 w-20 rounded bg-zinc-700" />
          </div>
          <div className="grid grid-cols-[1fr_2.4fr_1fr] gap-2">
            <PreviewColumn items={layout.left} />
            <PreviewColumn items={layout.center} />
            <PreviewColumn items={layout.right} />
          </div>
        </div>
      </div>

      {/* 위젯 보관함 */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOverCol('drawer')
          setOverId(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (dragId) placeWidget(dragId, 'drawer')
          onDragEnd()
        }}
        className={
          'mb-5 rounded-xl border p-3 transition ' +
          (overCol === 'drawer' ? 'border-violet-500/60 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/40')
        }
      >
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          위젯 보관함 · 끌어서 컬럼에 배치
        </p>
        {drawer.length === 0 ? (
          <p className="py-3 text-center text-sm text-zinc-600">모든 위젯이 배치됐어요</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {drawer.map((id) => {
              const meta = WIDGET_META[id]
              const dragging = dragId === id
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={(e) => onDragStart(id, e)}
                  onDragEnd={onDragEnd}
                  className={
                    'flex cursor-grab items-center gap-2 rounded-lg border bg-zinc-900 px-2.5 py-1.5 transition ' +
                    (dragging ? 'border-violet-500 opacity-40' : 'border-zinc-800 hover:border-zinc-700')
                  }
                >
                  <span className="text-base">{meta ? meta.icon : '▫'}</span>
                  <span className="text-sm text-zinc-200">{meta ? meta.label : id}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3컬럼 편집 영역 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {COLUMN_LABELS.map((c) => {
          const items = layout[c.key]
          const colActive = !!dragId && overCol === c.key
          return (
            <div
              key={c.key}
              onDragOver={(e) => {
                e.preventDefault()
                setOverCol(c.key)
                setOverId(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId) placeWidget(dragId, c.key)
                onDragEnd()
              }}
              className={
                'rounded-xl border p-3 transition ' +
                (colActive ? 'border-violet-500/60 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/40')
              }
            >
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                {c.label} · {items.length}
              </p>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-600">
                    여기에 위젯을 놓으세요
                  </div>
                ) : (
                  items.map((w, i) => (
                    <PlacedCard
                      key={w.id}
                      colKey={c.key}
                      id={w.id}
                      index={i}
                      total={items.length}
                    />
                  ))
                )}
                {colActive && overId === null && items.length > 0 ? (
                  <div className="h-0.5 rounded bg-violet-500" />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs text-zinc-600">
        가운데 컬럼은 넓게, 좌·우 컬럼은 좁게 표시돼요. 공지·레이드 일정처럼 큰 위젯은 가운데가 어울려요.
      </p>
    </div>
  )
}
