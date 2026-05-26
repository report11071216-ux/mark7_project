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

  revalidatePath(`/guild/${input.guildCode}/raids/calendar`)
  return { ok: true }
}
