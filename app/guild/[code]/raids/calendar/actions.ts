'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type CreateScheduleInput = {
  guildCode: string
  raidId: string
  difficulty: string
  skillLevel: string
  maxMembers: number
  scheduledDate: string
  scheduledTime: string
}

type ActionResult = { ok: boolean; error?: string }

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

  revalidatePath('/guild/' + input.guildCode + '/raids/calendar')
  return { ok: true }
}

export async function joinRaidSchedule(
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
    .select('id, guild_id, max_members')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    return { ok: false, error: '일정을 찾을 수 없습니다.' }
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

  const { count } = await supabase
    .from('raid_participants')
    .select('schedule_id', { count: 'exact', head: true })
    .eq('schedule_id', scheduleId)

  const max = Number(schedule.max_members) || 8
  if ((count || 0) >= max) {
    return { ok: false, error: '정원이 가득 찼습니다.' }
  }

  const { error } = await supabase
    .from('raid_participants')
    .insert({ schedule_id: scheduleId, user_id: user.id })

  if (error) {
    return { ok: false, error: '참여 신청 실패: ' + error.message }
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
