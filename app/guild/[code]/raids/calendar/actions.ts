'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendGuildEmbed, buildRaidEmbed, buildJoinEmbed } from '@/lib/discord'

type CreateScheduleInput = {
  guildCode: string
  raidId: string
  difficulty: string
  skillLevel: string
  maxMembers: number
  scheduledDate: string
  scheduledTime: string
}

type UpdateScheduleInput = {
  scheduleId: string
  guildCode: string
  difficulty: string
  skillLevel: string
  maxMembers: number
  scheduledDate: string
  scheduledTime: string
}

type ActionResult = { ok: boolean; error?: string }

export type MyCharacter = {
  name: string
  characterClass: string
  itemLevel: number
  serverName: string
  isRepresentative: boolean
}

export async function createRaidSchedule(input: CreateScheduleInput): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: guild } = await supabase
    .from('guilds')
    .select('id, code')
    .eq('code', input.guildCode)
    .single()

  if (!guild) {
    return { ok: false, error: '길드를 찾을 수 없습니다.' }
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('id')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { ok: false, error: '길드원만 일정을 만들 수 있습니다.' }
  }

  if (!input.raidId) {
    return { ok: false, error: '레이드를 선택해주세요.' }
  }
  if (!input.scheduledDate) {
    return { ok: false, error: '날짜가 올바르지 않습니다.' }
  }
  if (!input.scheduledTime) {
    return { ok: false, error: '시작 시간을 입력해주세요.' }
  }

  const { error } = await supabase.from('raid_schedules').insert({
    guild_id: guild.id,
    raid_id: input.raidId,
    difficulty: input.difficulty,
    skill_level: input.skillLevel,
    max_members: input.maxMembers,
    scheduled_date: input.scheduledDate,
    scheduled_time: input.scheduledTime,
    created_by: user.id,
  })

  if (error) {
    return { ok: false, error: '일정 생성 실패: ' + error.message }
  }

  // ── 레이드 알림 (임베드) ──
  try {
    const { data: raid } = await supabase
      .from('raids')
      .select('title, image_url')
      .eq('id', input.raidId)
      .maybeSingle()
    const embed = buildRaidEmbed({
      raidTitle: raid?.title || '레이드',
      difficulty: input.difficulty,
      skillLevel: input.skillLevel,
      maxMembers: input.maxMembers,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      raidImage: (raid?.image_url as string) || null,
    })
    await sendGuildEmbed(guild.id, 'raid', embed)
  } catch {
    // 알림 실패는 일정 생성을 막지 않음
  }

  revalidatePath('/guild/' + input.guildCode + '/raids/calendar')
  return { ok: true }
}

export async function updateRaidSchedule(input: UpdateScheduleInput): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: schedule } = await supabase
    .from('raid_schedules')
    .select('id, guild_id, created_by, completed')
    .eq('id', input.scheduleId)
    .single()

  if (!schedule) {
    return { ok: false, error: '일정을 찾을 수 없습니다.' }
  }

  if (schedule.completed) {
    return { ok: false, error: '완료된 레이드는 수정할 수 없습니다.' }
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', schedule.guild_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { ok: false, error: '길드원만 수정할 수 있습니다.' }
  }

  const isOwner = schedule.created_by === user.id
  const isStaff = membership.role === 'master' || membership.role === 'submaster'

  if (!isOwner && !isStaff) {
    return { ok: false, error: '일정을 만든 사람 또는 마스터/부마만 수정할 수 있습니다.' }
  }

  if (!input.scheduledDate) {
    return { ok: false, error: '날짜가 올바르지 않습니다.' }
  }
  if (!input.scheduledTime) {
    return { ok: false, error: '시작 시간을 입력해주세요.' }
  }

  // 이미 참여 중인 인원보다 작게는 줄일 수 없음
  const { count } = await supabase
    .from('raid_participants')
    .select('schedule_id', { count: 'exact', head: true })
    .eq('schedule_id', input.scheduleId)

  const joinedCount = count || 0
  if (input.maxMembers < joinedCount) {
    return {
      ok: false,
      error: '이미 ' + joinedCount + '명이 참여 중이라 인원을 그보다 적게 줄일 수 없어요.',
    }
  }

  const { error } = await supabase
    .from('raid_schedules')
    .update({
      difficulty: input.difficulty,
      skill_level: input.skillLevel,
      max_members: input.maxMembers,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
    })
    .eq('id', input.scheduleId)

  if (error) {
    return { ok: false, error: '일정 수정 실패: ' + error.message }
  }

  revalidatePath('/guild/' + input.guildCode + '/raids/calendar')
  revalidatePath('/guild/' + input.guildCode)
  return { ok: true }
}

export async function getMyCharacters(guildCode: string): Promise<MyCharacter[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('user_characters')
    .select('character_name, character_class, item_level, server_name, is_representative')
    .eq('user_id', user.id)
    .order('item_level', { ascending: false })

  return (data || []).map((c) => ({
    name: (c.character_name as string) || '',
    characterClass: (c.character_class as string) || '',
    itemLevel: c.item_level == null ? 0 : Number(c.item_level),
    serverName: (c.server_name as string) || '',
    isRepresentative: Boolean(c.is_representative),
  }))
}

export async function joinRaidSchedule(
  scheduleId: string,
  guildCode: string,
  characterName: string,
  role?: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: schedule } = await supabase
    .from('raid_schedules')
    .select('id, guild_id, raid_id, max_members, completed, scheduled_date, scheduled_time')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    return { ok: false, error: '일정을 찾을 수 없습니다.' }
  }

  if (schedule.completed) {
    return { ok: false, error: '이미 완료된 레이드입니다.' }
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('id')
    .eq('guild_id', schedule.guild_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { ok: false, error: '길드원만 참여할 수 있습니다.' }
  }

  const { data: existing } = await supabase
    .from('raid_participants')
    .select('schedule_id')
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: '이미 참여 신청한 일정입니다.' }
  }

  // ── 같은 시간 중복 신청 방지 ──
  const { data: myParts } = await supabase
    .from('raid_participants')
    .select('schedule_id')
    .eq('user_id', user.id)

  const myScheduleIds = (myParts || [])
    .map((p) => p.schedule_id as string)
    .filter((id) => id !== scheduleId)

  if (myScheduleIds.length > 0) {
    const { data: conflicts } = await supabase
      .from('raid_schedules')
      .select('id, raid_id, scheduled_time')
      .in('id', myScheduleIds)
      .eq('scheduled_date', schedule.scheduled_date)
      .eq('scheduled_time', schedule.scheduled_time)
      .limit(1)

    if (conflicts && conflicts.length > 0) {
      let raidName = '다른 레이드'
      const conflictRaidId = conflicts[0].raid_id as string | null
      if (conflictRaidId) {
        const { data: conflictRaid } = await supabase
          .from('raids')
          .select('title')
          .eq('id', conflictRaidId)
          .maybeSingle()
        if (conflictRaid?.title) raidName = conflictRaid.title as string
      }
      const rawTime = (schedule.scheduled_time as string) || ''
      const timeLabel = rawTime ? rawTime.slice(0, 5) : ''
      return {
        ok: false,
        error:
          '이미 같은 시간' +
          (timeLabel ? '(' + timeLabel + ')' : '') +
          '에 "' +
          raidName +
          '" 일정에 신청돼 있어요. 한 시간에 한 레이드만 참여할 수 있어요.',
      }
    }
  }

  const { count } = await supabase
    .from('raid_participants')
    .select('schedule_id', { count: 'exact', head: true })
    .eq('schedule_id', scheduleId)

  const max = Number(schedule.max_members) || 8
  if ((count || 0) >= max) {
    return { ok: false, error: '정원이 가득 찼습니다.' }
  }

  const safeRole = role === 'dealer' || role === 'support' ? role : null

  const { error } = await supabase
    .from('raid_participants')
    .insert({
      schedule_id: scheduleId,
      user_id: user.id,
      character_name: characterName || null,
      role: safeRole,
    })

  if (error) {
    return { ok: false, error: '참여 신청 실패: ' + error.message }
  }

  // ── 참여 알림 (임베드) ──
  try {
    const { count: afterCount } = await supabase
      .from('raid_participants')
      .select('schedule_id', { count: 'exact', head: true })
      .eq('schedule_id', scheduleId)

    let raidTitle = '레이드'
    const rid = schedule.raid_id as string | null
    if (rid) {
      const { data: raid } = await supabase
        .from('raids')
        .select('title')
        .eq('id', rid)
        .maybeSingle()
      if (raid?.title) raidTitle = raid.title as string
    }

    // 표시 이름: 참여 캐릭터명 우선, 없으면 프로필 닉네임
    let displayName = (characterName || '').trim()
    if (!displayName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()
      displayName = (profile?.username as string) || '길드원'
    }

    const embed = buildJoinEmbed({
      raidTitle: raidTitle,
      participantName: displayName,
      role: safeRole,
      current: afterCount || (count || 0) + 1,
      max: max,
      scheduledDate: (schedule.scheduled_date as string) || '',
      scheduledTime: (schedule.scheduled_time as string) || '',
    })
    await sendGuildEmbed(schedule.guild_id as string, 'raid', embed)
  } catch {
    // 알림 실패는 참여를 막지 않음
  }

  revalidatePath('/guild/' + guildCode + '/raids/calendar')
  return { ok: true }
}

export async function leaveRaidSchedule(
  scheduleId: string,
  guildCode: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: schedule } = await supabase
    .from('raid_schedules')
    .select('id, completed')
    .eq('id', scheduleId)
    .single()

  if (schedule?.completed) {
    return { ok: false, error: '완료된 레이드는 참여 취소할 수 없습니다.' }
  }

  const { error } = await supabase
    .from('raid_participants')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id)

  if (error) {
    return { ok: false, error: '참여 취소 실패: ' + error.message }
  }

  revalidatePath('/guild/' + guildCode + '/raids/calendar')
  return { ok: true }
}

export async function deleteRaidSchedule(
  scheduleId: string,
  guildCode: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: schedule } = await supabase
    .from('raid_schedules')
    .select('id, guild_id, created_by')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    return { ok: false, error: '일정을 찾을 수 없습니다.' }
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', schedule.guild_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { ok: false, error: '길드원만 삭제할 수 있습니다.' }
  }

  const isOwner = schedule.created_by === user.id
  const isStaff = membership.role === 'master' || membership.role === 'submaster'

  if (!isOwner && !isStaff) {
    return { ok: false, error: '일정을 만든 사람 또는 마스터/부마만 삭제할 수 있습니다.' }
  }

  await supabase.from('raid_participants').delete().eq('schedule_id', scheduleId)

  const { error } = await supabase
    .from('raid_schedules')
    .delete()
    .eq('id', scheduleId)

  if (error) {
    return { ok: false, error: '일정 삭제 실패: ' + error.message }
  }

  revalidatePath('/guild/' + guildCode + '/raids/calendar')
  return { ok: true }
}

export async function completeRaidSchedule(
  scheduleId: string,
  guildCode: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: schedule } = await supabase
    .from('raid_schedules')
    .select('id, guild_id, created_by')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    return { ok: false, error: '일정을 찾을 수 없습니다.' }
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', schedule.guild_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { ok: false, error: '길드원만 처리할 수 있습니다.' }
  }

  const isOwner = schedule.created_by === user.id
  const isStaff = membership.role === 'master' || membership.role === 'submaster'

  if (!isOwner && !isStaff) {
    return { ok: false, error: '주최자 또는 마스터/부마만 완료 처리할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('raid_schedules')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', scheduleId)

  if (error) {
    return { ok: false, error: '완료 처리 실패: ' + error.message }
  }

  revalidatePath('/guild/' + guildCode + '/raids/calendar')
  revalidatePath('/guild/' + guildCode)
  return { ok: true }
}

export async function uncompleteRaidSchedule(
  scheduleId: string,
  guildCode: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: schedule } = await supabase
    .from('raid_schedules')
    .select('id, guild_id, created_by')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    return { ok: false, error: '일정을 찾을 수 없습니다.' }
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', schedule.guild_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { ok: false, error: '길드원만 처리할 수 있습니다.' }
  }

  const isOwner = schedule.created_by === user.id
  const isStaff = membership.role === 'master' || membership.role === 'submaster'

  if (!isOwner && !isStaff) {
    return { ok: false, error: '주최자 또는 마스터/부마만 완료 취소할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('raid_schedules')
    .update({ completed: false, completed_at: null })
    .eq('id', scheduleId)

  if (error) {
    return { ok: false, error: '완료 취소 실패: ' + error.message }
  }

  revalidatePath('/guild/' + guildCode + '/raids/calendar')
  revalidatePath('/guild/' + guildCode)
  return { ok: true }
}
