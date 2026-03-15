import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--black)' }}>
      <Sidebar profile={profile} />
      <div id="sidebar-backdrop" className="sidebar-backdrop" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 'var(--sidebar-w)', overflow: 'hidden', transition: 'margin-left 0.25s' }} id="main-content">
        <Topbar profile={profile} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
