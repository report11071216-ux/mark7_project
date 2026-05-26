import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeLayout } from '@/lib/guild-layout-config'
import LayoutBuilder from '@/components/guild/LayoutBuilder'

export const dynamic = 'force-dynamic'

type Props = { params: { code: string } }

export default async function CustomizePage({ params }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = params.code.toUpperCase()

  const { data: guild } = await supabase
    .from('guilds')
    .select('id, name, code')
    .eq('code', code)
    .single()

  if (!guild) notFound()

  const { data: membership } = await supabase
    .from('guild_members')
    .select('role')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isStaff = !!membership && ['master', 'submaster'].includes(membership.role)
  if (!isStaff) redirect('/guild/' + guild.code)

  const { data: themeRow } = await supabase
    .from('guild_themes')
    .select('layout_config')
    .eq('guild_id', guild.id)
    .maybeSingle()

  const initialLayout = normalizeLayout(themeRow?.layout_config)

  return (
    <LayoutBuilder
      guildId={guild.id}
      guildCode={guild.code}
      initialLayout={initialLayout}
    />
  )
}
