import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Project } from '../api/client'

const STATUS_LABEL: Record<Project['status'], { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'bg-slate-100 text-slate-700' },
  wizard: { label: 'En diagnóstico', cls: 'bg-amber-100 text-amber-700' },
  generated: { label: 'Plan generado', cls: 'bg-blue-100 text-blue-700' },
  published: { label: 'Publicado en Meta', cls: 'bg-emerald-100 text-emerald-700' },
}

export default function Dashboard() {
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    api
      .get<{ items: Project[] }>('/projects')
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tus proyectos</h1>
          <p className="text-sm text-slate-500">Cada proyecto representa un negocio o cliente con su propio diagnóstico y campañas en Meta.</p>
        </div>
        <Link to="/projects/new" className="btn-primary">+ Nuevo proyecto</Link>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {loading ? (
        <div className="text-slate-500">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          <p className="mb-4">Todavía no hay proyectos.</p>
          <Link to="/projects/new" className="btn-primary">Crear el primero</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const s = STATUS_LABEL[p.status]
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-slate-900">{p.name}</h2>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                </div>
                {p.industry && <p className="text-xs text-slate-500 mt-1">{p.industry}</p>}
                {p.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{p.description}</p>}
                <p className="text-xs text-slate-400 mt-3">Actualizado {new Date(p.updated_at).toLocaleString()}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
