'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Result = { ok: boolean; error?: string; count?: number }

export async function donateCard(
  guildCode: string,
  cardId: string,
  qty: number
): Promise<Result> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }
  if (!cardId || !qty || qty < 1) {
    return { ok: false, error: '기증할 카드와 수량을 확인해주세요.' }
  }

  const { data: guild } = await supabase
    .from('guilds')
    .select('id')
    .eq('code', guildCode.toUpperCase())
    .single()
  if (!guild) return { ok: false, error: '길드를 찾을 수 없습니다.' }

  const { data, error } = await supabase.rpc('donate_card', {
    p_guild_id: guild.id,
    p_card_id: cardId,
    p_qty: qty,
  })

  if (error) return { ok: false, error: '기증 실패: ' + error.message }
  if (data && data.ok === false) {
    return { ok: false, error: data.error || '기증에 실패했습니다.' }
  }

  revalidatePath('/guild/' + guildCode + '/inventory')
  revalidatePath('/mypage')
  return { ok: true, count: data ? data.count : undefined }
}
