import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="inline-block w-6 h-6 rounded bg-brand-600" />
            POC Sales
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'text-brand-700 font-medium' : 'text-slate-600 hover:text-slate-900'
              }
            >
              Proyectos
            </NavLink>
            <NavLink
              to="/settings/meta"
              className={({ isActive }) =>
                isActive ? 'text-brand-700 font-medium' : 'text-slate-600 hover:text-slate-900'
              }
            >
              Meta Ads
            </NavLink>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-600 text-sm">{user?.email}</span>
            <button
              className="text-slate-600 hover:text-red-600 text-sm"
              onClick={() => {
                logout()
                nav('/login')
              }}
            >
              Salir
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        POC Sales · plataforma de diagnóstico + Meta Ads
      </footer>
    </div>
  )
}
