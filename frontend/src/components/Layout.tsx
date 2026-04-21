import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FolderKanban, Settings2, LogOut, Sparkles } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const navItemCls = ({ isActive }: { isActive: boolean }) =>
    [
      'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
      isActive
        ? 'bg-white text-ink-900 shadow-soft ring-1 ring-ink-200/70 font-medium'
        : 'text-ink-600 hover:text-ink-900 hover:bg-white/60',
    ].join(' ')

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200/70 bg-ink-50/60 p-4 lg:flex">
          <Brand />

          <nav className="mt-6 space-y-1">
            <NavLink to="/" end className={navItemCls}>
              <FolderKanban className="h-4 w-4" />
              <span>Proyectos</span>
            </NavLink>
            <NavLink to="/settings/meta" className={navItemCls}>
              <Settings2 className="h-4 w-4" />
              <span>Meta Ads</span>
            </NavLink>
          </nav>

          <div className="mt-auto space-y-3 pt-6">
            <div className="rounded-xl bg-gradient-to-br from-brand-50 to-white p-3 ring-1 ring-brand-100">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-800">
                <Sparkles className="h-3.5 w-3.5" />
                POC Sales
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                Diagnóstico → plan → campaña en Meta. Plantillas con supuestos explícitos.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 ring-1 ring-ink-200/70">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={user?.name || user?.email || 'U'} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink-800">{user?.name || 'Usuario'}</p>
                  <p className="truncate text-[11px] text-ink-500">{user?.email}</p>
                </div>
              </div>
              <button
                className="rounded-md p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-red-600"
                title="Cerrar sesión"
                onClick={() => {
                  logout()
                  nav('/login')
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-ink-200/70 bg-ink-50/80 px-4 backdrop-blur lg:hidden">
            <Brand compact />
            <div className="flex items-center gap-1.5">
              <NavLink to="/" end className="btn-ghost btn-sm">
                <FolderKanban className="h-4 w-4" />
              </NavLink>
              <NavLink to="/settings/meta" className="btn-ghost btn-sm">
                <Settings2 className="h-4 w-4" />
              </NavLink>
              <button
                className="btn-ghost btn-sm"
                onClick={() => {
                  logout()
                  nav('/login')
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 animate-fade-in">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink to="/" end className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18V6l6 7 6-7v12" />
          <path d="M16 11l4 7" />
        </svg>
      </span>
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-ink-900">POC Sales</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500">Plataforma Ads</span>
        </div>
      )}
    </NavLink>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-[11px] font-semibold text-white shadow-sm">
      {initials || 'U'}
    </span>
  )
}
