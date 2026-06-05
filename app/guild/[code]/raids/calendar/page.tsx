import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RaidCalendar from '@/components/guild/RaidCalendar'
import { getClassRole, getClassSynergy } from '@/lib/lostark-classes'

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

  const kstNow = getKSTNow()
  let year = searchParams.y ? parseInt(searchParams.y, 10) : kstNow.getUTCFullYear()
  let month = searchParams.m ? parseInt(searchParams.m, 10) : kstNow.getUTCMonth() + 1
  if (!Number.isFinite(year) || year < 2000 || year > 2100) year = kstNow.getUTCFullYear()
  if (!Number.isFinite(month) || month < 1 || month > 12) month = kstNow.getUTCMonth() + 1

  const firstDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDayNum = new Date(year, month, 0).getDate()
  const lastDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`

  const [raidsResult, schedulesResult] = await Promise.all([
    supabase
      .from('raids')
      .select('id, title, image_url, gold_normal, gold_hard, gold_nightmare')
      .eq('guild_id', guild.id)
      .order('title'),
    supabase
      .from('raid_schedules')
      .select('id, raid_id, difficulty, skill_level, max_members, scheduled_date, scheduled_time, created_by, completed, raids(title, image_url)')
      .eq('guild_id', guild.id)
      .gte('scheduled_date', firstDate)
      .lte('scheduled_date', lastDate)
      .order('scheduled_time'),
  ])

  const rawRaids = (raidsResult.data || []) as any[]
  const rawSchedules = (schedulesResult.data || []) as any[]

  const scheduleIds = rawSchedules.map((s) => s.id)

  let participantRows: any[] = []
  if (scheduleIds.length > 0) {
    const { data } = await supabase
      .from('raid_participants')
      .select('schedule_id, user_id, character_name, role')
      .in('schedule_id', scheduleIds)
    participantRows = data || []
  }

  const idSet = new Set<string>()
  for (const p of participantRows) idSet.add(p.user_id)
  for (const s of rawSchedules) {
    if (s.created_by) idSet.add(s.created_by)
  }
  const allUserIds = Array.from(idSet)

  let profileRows: any[] = []
  if (allUserIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, main_character_name, character_class, item_level, equipped_mark_id, equipped_card_id')
      .in('id', allUserIds)
    profileRows = data || []
  }

  const profileMap: { [key: string]: any } = {}
  for (const pr of profileRows) profileMap[pr.id] = pr

  // 참여한 캐릭터들의 최신 정보 조회 (character_name 기준)
  const charNames = Array.from(
    new Set(participantRows.map((p) => p.character_name).filter(Boolean))
  ) as string[]
  const charInfoMap: { [key: string]: { characterClass: string; itemLevel: number | null } } = {}
  if (charNames.length > 0) {
    const { data: charRows } = await supabase
      .from('user_characters')
      .select('character_name, character_class, item_level')
      .in('character_name', charNames)
    for (const c of charRows || []) {
      charInfoMap[c.character_name as string] = {
        characterClass: (c.character_class as string) || '',
        itemLevel: c.item_level == null ? null : Number(c.item_level),
      }
    }
  }

  const purchaseIds = Array.from(
    new Set(
      profileRows
        .flatMap((p) => [p.equipped_mark_id, p.equipped_card_id])
        .filter(Boolean)
    )
  ) as string[]

  const markImageByPurchase: { [key: string]: string | null } = {}
  const cardFrameByPurchase: { [key: string]: string | null } = {}

  if (purchaseIds.length > 0) {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, item_id')
      .in('id', purchaseIds)
    const itemIds = Array.from(
      new Set((purchases || []).map((p) => p.item_id).filter(Boolean))
    ) as string[]
    const itemMap: { [key: string]: { image_url: string | null; frame_url: string | null } } = {}
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('shop_items')
        .select('id, image_url, frame_url')
        .in('id', itemIds)
      for (const it of items || []) {
        itemMap[it.id] = { image_url: it.image_url, frame_url: it.frame_url }
      }
    }
    for (const pu of purchases || []) {
      if (!pu.item_id) continue
      const it = itemMap[pu.item_id]
      if (!it) continue
      markImageByPurchase[pu.id] = it.image_url
      cardFrameByPurchase[pu.id] = it.frame_url
    }
  }

  function profileNameOf(uid: string): string {
    const pr = profileMap[uid]
    if (!pr) return '길드원'
    return pr.main_character_name || pr.username || '길드원'
  }
  function avatarOf(uid: string): string {
    const pr = profileMap[uid]
    if (!pr) return ''
    if (pr.equipped_mark_id && markImageByPurchase[pr.equipped_mark_id]) {
      return markImageByPurchase[pr.equipped_mark_id] as string
    }
    return pr.avatar_url || ''
  }
  function cardBgOf(uid: string): string {
    const pr = profileMap[uid]
    if (!pr) return ''
    if (pr.equipped_card_id && cardFrameByPurchase[pr.equipped_card_id]) {
      return cardFrameByPurchase[pr.equipped_card_id] as string
    }
    return ''
  }
  function profileClassOf(uid: string): string {
    const pr = profileMap[uid]
    return pr && pr.character_class ? String(pr.character_class) : ''
  }
  function profileIlvlOf(uid: string): number | null {
    const pr = profileMap[uid]
    if (!pr || pr.item_level == null) return null
    const n = Number(pr.item_level)
    return Number.isFinite(n) ? n : null
  }

  const participantsBySchedule: {
    [key: string]: {
      userId: string
      name: string
      avatar: string
      cardBgUrl: string
      characterClass: string
      itemLevel: number | null
      role: 'dealer' | 'support' | null
      synergy: string
    }[]
  } = {}
  for (const p of participantRows) {
    const key = String(p.schedule_id)
    if (!participantsBySchedule[key]) participantsBySchedule[key] = []

    const charName = (p.character_name as string) || ''
    const charInfo = charName ? charInfoMap[charName] : undefined

    const displayName = charName || profileNameOf(p.user_id)
    const cls = charInfo ? charInfo.characterClass : profileClassOf(p.user_id)
    const ilvl = charInfo ? charInfo.itemLevel : profileIlvlOf(p.user_id)

    // 본인이 신청 시 고른 역할(저장값)을 우선. 없으면 직업으로 추정.
    const storedRole =
      p.role === 'dealer' || p.role === 'support' ? (p.role as 'dealer' | 'support') : null
    const finalRole: 'dealer' | 'support' | null = storedRole
      ? storedRole
      : cls
      ? getClassRole(cls)
      : null

    participantsBySchedule[key].push({
      userId: p.user_id,
      name: displayName,
      avatar: avatarOf(p.user_id),
      cardBgUrl: cardBgOf(p.user_id),
      characterClass: cls,
      itemLevel: ilvl,
      role: finalRole,
      synergy: cls ? getClassSynergy(cls) : '',
    })
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
    const list = participantsBySchedule[String(s.id)] || []
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
      createdBy: (s.created_by as string) || '',
      createdByName: s.created_by ? profileNameOf(s.created_by) : '길드원',
      participants: list,
      participantCount: list.length,
      completed: Boolean(s.completed),
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
        currentUserId={user.id}
        currentUserRole={membership.role || 'member'}
        schedules={schedules}
        raids={raids}
      />
    </div>
  )
}
