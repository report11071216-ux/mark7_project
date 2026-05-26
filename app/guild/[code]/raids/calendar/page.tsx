import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RaidCalendar from '@/components/guild/RaidCalendar'

export const dynamic = 'force-dynamic'

function getKSTNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

type PageProps = {
  params: { code: string }
  searchParams: { y?: string; m?: string }
}

export default async function RaidCalendarPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: guild } = await supabase
    .from('guilds')
    .select('id, name, code')
    .eq('code', params.code)
    .single()

  if (!guild) notFound()

  const { data: membership } = await supabase
    .from('guild_members')
    .select('id, role')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  // 표시할 연/월 (KST 기준)
  const kstNow = getKSTNow()
  let year = searchParams.y ? parseInt(searchParams.y, 10) : kstNow.getUTCFullYear()
  let month = searchParams.m ? parseInt(searchParams.m, 10) : kstNow.getUTCMonth() + 1
  if (!Number.isFinite(year) || year < 2000 || year > 2100) year = kstNow.getUTCFullYear()
  if (!Number.isFinite(month) || month < 1 || month > 12) month = kstNow.getUTCMonth() + 1

  const firstDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDayNum = new Date(year, month, 0).getDate()
  const lastDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`

  // 도감 + 해당 월 일정 병렬 조회
  const [raidsResult, schedulesResult] = await Promise.all([
    supabase
      .from('raids')
      .select('id, title, image_url, gold_normal, gold_hard, gold_nightmare')
      .order('title'),
    supabase
      .from('raid_schedules')
      .select('id, raid_id, difficulty, skill_level, max_members, scheduled_date, scheduled_time, created_by, raids(title, image_url)')
      .eq('guild_id', guild.id)
      .gte('scheduled_date', firstDate)
      .lte('scheduled_date', lastDate)
      .order('scheduled_time'),
  ])

  const rawRaids = (raidsResult.data || []) as any[]
  const rawSchedules = (schedulesResult.data || []) as any[]

  // 일정별 참여 인원 카운트
  const scheduleIds = rawSchedules.map((s) => s.id)
  const participantCounts: { [key: string]: number } = {}

  if (scheduleIds.length > 0) {
    const { data: participants } = await supabase
      .from('raid_participants')
      .select('schedule_id')
      .in('schedule_id', scheduleIds)

    if (participants) {
      for (const p of participants as any[]) {
        const key = String(p.schedule_id)
        participantCounts[key] = (participantCounts[key] || 0) + 1
      }
    }
  }

  const raids = rawRaids.map((r) => ({
    id: r.id as string,
    title: (r.title as string) || '제목 없음',
    image_url: (r.image_url as string) || '',
    gold_normal: r.gold_normal == null ? null : Number(r.gold_normal),
    gold_hard: r.gold_hard == null ? null : Number(r.gold_hard),
    gold_nightmare: r.gold_nightmare == null ? null : Number(r.gold_nightmare),
  }))

  const schedules = rawSchedules.map((s) => {
    const raidInfo = Array.isArray(s.raids) ? s.raids[0] : s.raids
    return {
      id: s.id as string,
      raidId: s.raid_id as string,
      raidTitle: raidInfo ? (raidInfo.title as string) : '알 수 없는 레이드',
      raidImage: raidInfo ? ((raidInfo.image_url as string) || '') : '',
      difficulty: (s.difficulty as string) || '노말',
      skillLevel: (s.skill_level as string) || '',
      maxMembers: Number(s.max_members) || 8,
      scheduledDate: s.scheduled_date as string,
      scheduledTime: ((s.scheduled_time as string) || '').slice(0, 5),
      createdBy: s.created_by as string,
      participantCount: participantCounts[String(s.id)] || 0,
    }
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">RAID SCHEDULE</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-100">레이드 캘린더</h1>
        <p className="mt-1 text-sm text-zinc-500">{guild.name} 길드의 레이드 일정을 한눈에 확인하세요.</p>
      </div>

      <div className="mb-6 flex gap-2">
        <Link
          href={`/guild/${guild.code}/raids`}
          className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
        >
          레이드 도감
        </Link>
        <Link
          href={`/guild/${guild.code}/raids/calendar`}
          className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300"
        >
          캘린더
        </Link>
      </div>

      <RaidCalendar
        year={year}
        month={month}
        guildCode={guild.code}
        schedules={schedules}
        raids={raids}
      />
    </div>
  )
}
