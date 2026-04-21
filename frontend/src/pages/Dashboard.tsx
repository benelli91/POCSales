import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Project } from '../api/client'
import { ArrowUpRight, FolderPlus, Plus, Search, Sparkles } from 'lucide-react'

const STATUS: Record<Project['status'], { label: string; dot: string; pill: string }> = {
  draft:     { label: 'Borrador',         dot: 'bg-ink-400',       pill: 'bg-ink-100 text-ink-700' },
  wizard:    { label: 'En diagnóstico',   dot: 'bg-amber-500',     pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60' },
  generated: { label: 'Plan generado',    dot: 'bg-brand-500',     pill: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200/60' },
  published: { label: 'Publicado en Meta',dot: 'bg-emerald-500',   pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' },
}

export default function Dashboard() {
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    api
      .get<{ items: Project[] }>('/projects')
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => ({
    total: items.length,
    withPlan: items.filter((p) => p.status === 'generated' || p.status === 'published').length,
    inWizard: items.filter((p) => p.status === 'wizard' || p.status === 'draft').length,
    published: items.filter((p) => p.status === 'published').length,
  }), [items])

  const filtered = items.filter((p) =>
    !q ? true : [p.name, p.industry, p.description].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Workspace</p>
          <h1 className="h-page mt-1">Proyectos</h1>
          <p className="muted mt-1 max-w-xl">
            Cada proyecto representa un negocio o cliente con su propio diagnóstico, plan y campañas en Meta.
          </p>
        </div>
        <Link to="/projects/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="En diagnóstico" value={stats.inWizard} tone="amber" />
        <Stat label="Con plan" value={stats.withPlan} tone="brand" />
        <Stat label="Publicados" value={stats.published} tone="emerald" />
      </section>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      {!loading && items.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, industria o descripción"
            className="input pl-9"
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const s = STATUS[p.status]
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="card-hover group relative flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-ink-900">{p.name}</h2>
                    {p.industry && <p className="mt-0.5 text-xs text-ink-500">{p.industry}</p>}
                  </div>
                  <span className={`badge badge-dot ${s.pill}`}>
                    <span className={`${s.dot} !bg-current`} />
                    {s.label}
                  </span>
                </div>
                {p.description ? (
                  <p className="mt-3 text-sm text-ink-600 leading-relaxed line-clamp-3">{p.description}</p>
                ) : (
                  <p className="mt-3 text-sm italic text-ink-400">Sin descripción</p>
                )}
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-ink-100">
                  <span className="text-[11px] text-ink-500">
                    Actualizado {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-ink-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </div>
              </Link>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-500">
              Sin resultados para "<span className="font-medium text-ink-700">{q}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'amber' | 'brand' | 'emerald' }) {
  const accent = {
    default: 'text-ink-900',
    amber:   'text-amber-600',
    brand:   'text-brand-600',
    emerald: 'text-emerald-600',
  }[tone]
  return (
    <div className="card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="h-4 w-1/2 animate-pulse rounded bg-ink-100" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-ink-100" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-ink-100" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-ink-100" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
      <div className="relative p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink-900">Empezá tu primer proyecto</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-500">
          Un proyecto agrupa el diagnóstico, el plan y las campañas de un negocio. Podés tener todos los que necesites.
        </p>
        <Link to="/projects/new" className="btn-primary mt-5 inline-flex">
          <FolderPlus className="h-4 w-4" />
          Crear proyecto
        </Link>
      </div>
    </div>
  )
}
