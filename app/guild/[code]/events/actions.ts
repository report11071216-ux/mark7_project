'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendGuildWebhook } from '@/lib/discord'

type ActionResult = { ok: boolean; error?: string }

const EVENT_TYPES = ['내전', '레이드', '친목', '경쟁전', '기타']

type CreateEventInput = {
  guildCode: string
  title: string
  eventType: string
  scheduledDate: string
  scheduledTime: string
  description: string
}

type UpdateEventInput = {
  eventId: string
  guildCode: string
  title: string
  eventType: string
  scheduledDate: string
  scheduledTime: string
  description: string
}

export async function createEvent(input: CreateEventInput): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  if (!input.title.trim()) return { ok: false, error: '이벤트 제목을 입력해주세요.' }

  const { data: guild } = await supabase
    .from('guilds')
    .select('id, code')
    .eq('code', input.guildCode)
    .single()
  if (!guild) return { ok: false, error: '길드를 찾을 수 없습니다.' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { ok: false, error: '길드원만 만들 수 있습니다.' }

  const isStaff = membership.role === 'master' || membership.role === 'submaster'
  if (!isStaff) return { ok: false, error: '마스터/부마만 이벤트를 만들 수 있습니다.' }

  const type = EVENT_TYPES.indexOf(input.eventType) !== -1 ? input.eventType : '기타'

  const { error } = await supabase.from('guild_events').insert({
    guild_id: guild.id,
    title: input.title.trim(),
    description: input.description.trim() || null,
    event_type: type,
    scheduled_date: input.scheduledDate || null,
    scheduled_time: input.scheduledTime || null,
    status: '모집중',
    created_by: user.id,
  })

  if (error) return { ok: false, error: '이벤트 생성 실패: ' + error.message }

  // 디스코드 공지 (실패해도 생성은 막지 않음)
  try {
    const when = input.scheduledDate
      ? input.scheduledDate + (input.scheduledTime ? ' ' + input.scheduledTime : '')
      : '일정 미정'
    const content =
      '🎉 새 이벤트 [' + type + '] ' + input.title.trim() + '\n' +
      '🗓️ ' + when + '\n' +
      (input.description.trim() ? input.description.trim() + '\n' : '') +
      '길드패스 이벤트 탭에서 참가 신청하세요!'
    await sendGuildWebhook(guild.id, 'notice', content)
  } catch {
    // 무시
  }

  revalidatePath('/guild/' + input.guildCode + '/events')
  return { ok: true }
}

export async function updateEvent(input: UpdateEventInput): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  if (!input.title.trim()) return { ok: false, error: '이벤트 제목을 입력해주세요.' }

  const { data: ev } = await supabase
    .from('guild_events')
    .select('id, guild_id')
    .eq('id', input.eventId)
    .single()
  if (!ev) return { ok: false, error: '이벤트를 찾을 수 없습니다.' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', ev.guild_id)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { ok: false, error: '길드원만 수정할 수 있습니다.' }

  // 수정은 마스터/부마만
  const isStaff = membership.role === 'master' || membership.role === 'submaster'
  if (!isStaff) return { ok: false, error: '마스터/부마만 이벤트를 수정할 수 있습니다.' }

  const type = EVENT_TYPES.indexOf(input.eventType) !== -1 ? input.eventType : '기타'

  const { error } = await supabase
    .from('guild_events')
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      event_type: type,
      scheduled_date: input.scheduledDate || null,
      scheduled_time: input.scheduledTime || null,
    })
    .eq('id', input.eventId)

  if (error) return { ok: false, error: '이벤트 수정 실패: ' + error.message }

  revalidatePath('/guild/' + input.guildCode + '/events')
  return { ok: true }
}

export async function joinEvent(eventId: string, guildCode: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { data: ev } = await supabase
    .from('guild_events')
    .select('id, guild_id, status')
    .eq('id', eventId)
    .single()
  if (!ev) return { ok: false, error: '이벤트를 찾을 수 없습니다.' }
  if (ev.status !== '모집중') return { ok: false, error: '모집이 마감된 이벤트입니다.' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('id')
    .eq('guild_id', ev.guild_id)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { ok: false, error: '길드원만 참가할 수 있습니다.' }

  const { data: existing } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return { ok: false, error: '이미 참가 신청했습니다.' }

  const { error } = await supabase
    .from('event_participants')
    .insert({ event_id: eventId, user_id: user.id })

  if (error) return { ok: false, error: '참가 신청 실패: ' + error.message }

  revalidatePath('/guild/' + guildCode + '/events')
  return { ok: true }
}

export async function leaveEvent(eventId: string, guildCode: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: '참가 취소 실패: ' + error.message }

  revalidatePath('/guild/' + guildCode + '/events')
  return { ok: true }
}

export async function setEventStatus(
  eventId: string,
  guildCode: string,
  status: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const safeStatus = status === '마감' || status === '종료' ? status : '모집중'

  const { data: ev } = await supabase
    .from('guild_events')
    .select('id, guild_id, created_by')
    .eq('id', eventId)
    .single()
  if (!ev) return { ok: false, error: '이벤트를 찾을 수 없습니다.' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', ev.guild_id)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { ok: false, error: '길드원만 처리할 수 있습니다.' }

  const isStaff = membership.role === 'master' || membership.role === 'submaster'
  if (!isStaff && ev.created_by !== user.id) {
    return { ok: false, error: '주최자 또는 마스터/부마만 변경할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('guild_events')
    .update({ status: safeStatus })
    .eq('id', eventId)

  if (error) return { ok: false, error: '상태 변경 실패: ' + error.message }

  revalidatePath('/guild/' + guildCode + '/events')
  return { ok: true }
}

export async function deleteEvent(eventId: string, guildCode: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { data: ev } = await supabase
    .from('guild_events')
    .select('id, guild_id, created_by')
    .eq('id', eventId)
    .single()
  if (!ev) return { ok: false, error: '이벤트를 찾을 수 없습니다.' }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', ev.guild_id)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { ok: false, error: '길드원만 삭제할 수 있습니다.' }

  const isStaff = membership.role === 'master' || membership.role === 'submaster'
  if (!isStaff && ev.created_by !== user.id) {
    return { ok: false, error: '주최자 또는 마스터/부마만 삭제할 수 있습니다.' }
  }

  // 참가자 먼저 정리 (CASCADE가 있어도 안전하게)
  await supabase.from('event_participants').delete().eq('event_id', eventId)

  const { error } = await supabase.from('guild_events').delete().eq('id', eventId)
  if (error) return { ok: false, error: '삭제 실패: ' + error.message }

  revalidatePath('/guild/' + guildCode + '/events')
  return { ok: true }
}
