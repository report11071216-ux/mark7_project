import { createClient } from '@/lib/supabase/server'
import MegaphoneTicker from '@/components/plaza/MegaphoneTicker'
import TopRankCompact from '@/components/plaza/TopRankCompact'
import BoardPreview, { PlazaPost } from '@/components/plaza/BoardPreview'
import Link from 'next/link'

type RankEntry = {
  guild_id: string
  score: number
  guilds?: { name: string; logo_url: string | null } | null
}

function GuestBanner() {
  return (
    <div className="w-full bg-violet-600/10 border border-violet-500/30 rounded-xl px-5 py-3 flex items-center justify-between gap-4 mb-6 flex-wrap">
      <p className="text-sm text-violet-200">
        👋 <span className="font-semibold text-white">길드패스 광장</span>에 오신 걸 환영해요.
        로그인하면 댓글 작성·길드 참여가 가능해요.
      </p>
      <div className="flex gap-2 shrink-0">
        <Link
          href="/login"
          className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
        >
          Discord로 로그인
        </Link>
      </div>
    </div>
  )
}

export default async function PlazaPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isGuest = !user

  // PlazaPost 타입에 맞게 조인 쿼리
  const { data: rawPosts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      category,
      is_notice,
      view_count,
      created_at,
      guild_id,
      guilds ( name, code ),
      profiles ( nickname )
    `)
    .order('created_at', { ascending: false })
    .limit(8)

  // PlazaPost 형태로 변환
  const posts: PlazaPost[] = (rawPosts ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    category: p.category ?? null,
    is_notice: p.is_notice ?? false,
    view_count: p.view_count ?? 0,
    created_at: p.created_at,
    guild_name: p.guilds?.name ?? '알 수 없는 길드',
    guild_code: p.guilds?.code ?? '',
    author_name: p.profiles?.nickname ?? '알 수 없음',
  }))

  const { data: weeklyRank } = await supabase
    .from('weekly_guild_ranking')
    .select('guild_id, score, guilds(name, logo_url)')
    .order('score', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      <MegaphoneTicker />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {isGuest && <GuestBanner />}

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            🏛️ 길드 광장
          </h1>
          <p className="text-sm text-white/50 mt-1">
            모든 길드의 소식과 랭킹을 한눈에 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                최근 게시글
              </h2>
              {isGuest && (
                <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                  읽기 전용
                </span>
              )}
            </div>
            <BoardPreview posts={posts} />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              주간 랭킹
            </h2>
            <TopRankCompact
              entries={(weeklyRank as RankEntry[]) ?? []}
            />
          </div>

        </div>

        {isGuest && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-600/5 p-8 text-center space-y-4">
            <p className="text-lg font-bold text-white">
              내 길드를 만들고 싶다면?
            </p>
            <p className="text-sm text-white/50">
              Discord 계정 하나로 무료로 시작할 수 있어요.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
              >
                무료로 길드 만들기
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-xl border border-white/20 hover:border-violet-400 text-white font-semibold text-sm transition-colors"
              >
                코드로 길드 참여
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
