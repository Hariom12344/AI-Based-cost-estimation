import { FileCode2, LayoutDashboard, LogOut, UserCircle } from 'lucide-react'

import useAuth from '../hooks/useAuth'

const DashboardPage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen p-6 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[260px_1fr]">
        <aside className="glass-card rounded-2xl p-5">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
            <LayoutDashboard className="h-5 w-5 text-blue-300" /> IntelliCAM AI
          </div>
          <nav className="space-y-2 text-sm text-slate-200">
            <div className="rounded-lg bg-slate-800/50 p-3">Drawings</div>
            <div className="rounded-lg bg-slate-800/30 p-3">Parts</div>
            <div className="rounded-lg bg-slate-800/30 p-3">G-Code</div>
          </nav>
          <button
            onClick={logout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/70 px-4 py-2 text-sm transition hover:bg-red-400/80"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>

        <main className="space-y-6">
          <section className="glass-card rounded-2xl p-6">
            <div className="mb-2 flex items-center gap-2 text-xl font-semibold">
              <UserCircle className="h-5 w-5 text-blue-300" /> Welcome, {user?.email}
            </div>
            <p className="text-slate-300">Role: {user?.role}</p>
          </section>

          <section className="glass-card rounded-2xl p-6 transition-all hover:shadow-[0_0_50px_rgba(96,165,250,0.25)]">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileCode2 className="h-5 w-5 text-blue-300" /> Manufacturing Workspace
            </div>
            <p className="text-slate-300">
              Upload DXF or image drawings to parse geometry and generate CNC turning G-Code plans.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
