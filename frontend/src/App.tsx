import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewProject from './pages/NewProject'
import ProjectDetail from './pages/ProjectDetail'
import Wizard from './pages/Wizard'
import MetaSettings from './pages/MetaSettings'
import type { ReactNode } from 'react'

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-10 text-slate-500">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects/new" element={<NewProject />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/wizard" element={<Wizard />} />
        <Route path="settings/meta" element={<MetaSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
