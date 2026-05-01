import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Pre-fetch watchlist and portfolio from DB
  const [watchlistRes, portfolioRes] = await Promise.all([
    supabase.from('watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('portfolio').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <DashboardClient
      user={user}
      initialWatchlist={watchlistRes.data ?? []}
      initialPortfolio={portfolioRes.data ?? []}
    />
  )
}
