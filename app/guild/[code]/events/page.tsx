import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventsClient from '@/components/guild/EventsClient'

export const dynamic = 'force-dynamic'

type EventParticipant = {
  userId: string
  name: string
  avatar: string
  characterClass: string
  itemLevel: number | null
}

type GuildEvent = {
  id: string
  title: string
  description: string
  eventType: string
  scheduledDate: string
  scheduledTime: string
  status: string
  createdBy: string
  createdByName: string
  participants: EventParticipant[]
}

type PageProps = {
  params: { code: string }
}

export default async function EventsPage({ params }: PageProps) {
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
    .select('role')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect('/onboarding')

  const isStaff = membership.role === 'master' || membership.role === 'submaster'

  const { data: rawEvents } = await supabase
    .from('guild_events')
    .select('id, title, description, event_type, scheduled_date, scheduled_time, status, created_by, created_at')
    .eq('guild_id', guild.id)
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const events = (rawEvents || []) as any[]
  const eventIds = events.map((e) => e.id)

  let partRows: any[] = []
  if (eventIds.length > 0) {
    const { data } = await supabase
      .from('event_participants')
      .select('event_id, user_id')
      .in('event_id', eventIds)
    partRows = data || []
  }

  const idSet = new Set<string>()
  for (const p of partRows) idSet.add(p.user_id)
  for (const e of events) {
    if (e.created_by) idSet.add(e.created_by)
  }
  const allUserIds = Array.from(idSet)

  const profileMap: { [key: string]: any } = {}
  if (allUserIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, main_character_name, avatar_url, character_class, item_level')
      .in('id', allUserIds)
    for (const pr of profs || []) profileMap[pr.id] = pr
  }

  function nameOf(uid: string): string {
    const pr = profileMap[uid]
    if (!pr) return '길드원'
    return pr.main_character_name || pr.username || '길드원'
  }

  const partsByEvent: { [key: string]: EventParticipant[] } = {}
  for (const p of partRows) {
    const key = String(p.event_id)
    if (!partsByEvent[key]) partsByEvent[key] = []
    const pr = profileMap[p.user_id]
    partsByEvent[key].push({
      userId: p.user_id,
      name: nameOf(p.user_id),
      avatar: pr ? pr.avatar_url || '' : '',
      characterClass: pr && pr.character_class ? String(pr.character_class) : '',
      itemLevel: pr && pr.item_level != null ? Number(pr.item_level) : null,
    })
  }

  const guildEvents: GuildEvent[] = events.map((e) => ({
    id: e.id as string,
    title: (e.title as string) || '제목 없음',
    description: (e.description as string) || '',
    eventType: (e.event_type as string) || '기타',
    scheduledDate: (e.scheduled_date as string) || '',
    scheduledTime: ((e.scheduled_time as string) || '').slice(0, 5),
    status: (e.status as string) || '모집중',
    createdBy: (e.created_by as string) || '',
    createdByName: e.created_by ? nameOf(e.created_by) : '길드원',
    participants: partsByEvent[String(e.id)] || [],
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">GUILD EVENTS</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">이벤트</h1>
        <p className="mt-1 text-sm text-slate-500">
          {guild.name} 길드의 이벤트를 만들고, 참가 신청하고, 팀을 랜덤으로 나눠보세요.
        </p>
      </div>

      <EventsClient
        guildCode={guild.code}
        currentUserId={user.id}
        isStaff={isStaff}
        events={guildEvents}
      />
    </div>
  )
}
