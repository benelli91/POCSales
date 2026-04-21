import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  api,
  type GeneratedPlan,
  type MetaCampaign,
  type MetaCredentials,
  type Project,
  type WizardState,
} from '../api/client'
import {
  AlertCircle, AlertTriangle, ArrowLeft, Bot, Check, Flag, Info, ListChecks,
  Megaphone, Sparkles, Target, Users, Wallet, Wand2,
} from 'lucide-react'

const STATUS: Record<Project['status'], { label: string; pill: string }> = {
  draft:     { label: 'Borrador',           pill: 'bg-ink-100 text-ink-700' },
  wizard:    { label: 'En diagnóstico',     pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60' },
  generated: { label: 'Plan generado',      pill: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200/60' },
  published: { label: 'Publicado en Meta',  pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' },
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const [project, setProject] = useState<Project | null>(null)
  const [wizard, setWizard] = useState<WizardState | null>(null)
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([])
  const [creds, setCreds] = useState<MetaCredentials | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  const load = async () => {
    setErr('')
    try {
      const [p, w, c, m] = await Promise.all([
        api.get<Project>(`/projects/${projectId}`),
        api.get<WizardState>(`/projects/${projectId}/wizard`),
        api.get<MetaCredentials>('/meta/credentials'),
        api.get<{ items: MetaCampaign[] }>(`/projects/${projectId}/meta/campaigns`),
      ])
      setProject(p); setWizard(w); setCreds(c); setCampaigns(m.items ?? [])
      try {
        const pl = await api.get<GeneratedPlan>(`/projects/${projectId}/plan`)
        setPlan(pl)
      } catch { setPlan(null) }
    } catch (e) { setErr((e as Error).message) }
  }

  useEffect(() => { void load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [projectId])

  const regenerate = async () => {
    setBusy(true); setErr(''); setInfo('')
    try {
      const pl = await api.post<GeneratedPlan>(`/projects/${projectId}/plan`)
      setPlan(pl); setInfo(`Plan regenerado (versión ${pl.version}).`)
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  const createCampaign = async () => {
    setBusy(true); setErr(''); setInfo('')
    try {
      const c = await api.post<MetaCampaign>(`/projects/${projectId}/meta/campaigns`, {})
      setCampaigns((prev) => [c, ...prev])
      setInfo(`Campaña creada en Meta (id=${c.meta_campaign_id}, status=${c.status}).`)
      void load()
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  if (!project) return <div className="muted">Cargando…</div>

  const canCreateCampaign = !!plan && !!creds?.has_token && !!creds?.ad_account_id
  const s = STATUS[project.status]
  const score = wizard?.completeness_score ?? 0

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Volver a proyectos
      </Link>

      {/* Hero */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`badge badge-dot ${s.pill}`}>{s.label}</span>
              {project.industry && <span className="text-xs text-ink-500">· {project.industry}</span>}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">{project.description}</p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <div className="w-40">
                <div className="flex items-center justify-between text-[11px] text-ink-500 mb-1">
                  <span>Completitud</span>
                  <span className="tabular-nums font-semibold text-ink-800">{score}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all" style={{ width: `${score}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2">
            <Link to={`/projects/${project.id}/wizard`} className="btn-secondary">
              <ListChecks className="h-4 w-4" /> Editar wizard
            </Link>
            <button className="btn-primary" onClick={regenerate} disabled={busy}>
              <Wand2 className="h-4 w-4" />
              {plan ? 'Regenerar plan' : 'Generar plan'}
            </button>
          </div>
        </div>
      </section>

      {err && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {err}
        </div>
      )}
      {info && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4 mt-0.5 shrink-0" /> {info}
        </div>
      )}

      {!plan && (
        <div className="card p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-lg font-semibold text-ink-900 tracking-tight">Todavía no hay plan generado</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
            Completá el wizard y generá un plan desde el botón de arriba. Cuanta más data cargues, menos supuestos va a declarar.
          </p>
        </div>
      )}

      {plan && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Plan estratégico */}
          <section className="card p-6 sm:p-7 space-y-6 lg:col-span-3">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Plan estratégico</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="h-section">{plan.plan.headline}</h2>
                  <span className="badge bg-ink-100 text-ink-700">v{plan.version}</span>
                  <PlanSourceBadge source={plan.plan_source} />
                </div>
              </div>
              <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200/60 uppercase">{plan.plan.objective}</span>
            </header>

            <div className="grid grid-cols-3 gap-3">
              <Box icon={<Wallet className="h-4 w-4" />} label="Presup. diario" value={fmtMoney(plan.plan.budget.daily_budget)} />
              <Box icon={<Flag className="h-4 w-4" />} label="Ventana" value={`${plan.plan.budget.test_window_days} d`} />
              <Box icon={<Target className="h-4 w-4" />} label="Total estimado" value={fmtMoney(plan.plan.budget.total_estimated)} />
            </div>

            <Block title="Pasos de estrategia" icon={<ListChecks className="h-4 w-4" />}>
              <ol className="space-y-2 text-sm text-ink-700">
                {plan.plan.strategy_steps.map((st, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200/60">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{st}</span>
                  </li>
                ))}
              </ol>
            </Block>

            <Block title="Audiencias" icon={<Users className="h-4 w-4" />}>
              <ul className="space-y-2">
                {plan.plan.audiences.map((a, i) => (
                  <li key={i} className="rounded-lg border border-ink-200/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink-800">{a.name}</span>
                      <span className="badge bg-ink-100 text-ink-600">{a.source}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-600 leading-relaxed">{a.description}</p>
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="KPI" icon={<Target className="h-4 w-4" />}>
              <p className="text-sm text-ink-700">
                Objetivo: <strong className="text-ink-900">{plan.plan.metrics.kpi.toUpperCase()}</strong>
                {plan.plan.metrics.target_value ? ` = ${plan.plan.metrics.target_value}` : ''}
                {plan.plan.metrics.max_sustainable_cpa
                  ? ` · CPA máx. sostenible ≈ ${fmtMoney(plan.plan.metrics.max_sustainable_cpa)}`
                  : ''}
              </p>
            </Block>

            <Block title="Riesgos" icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}>
              <ul className="space-y-1.5 text-sm text-ink-700">
                {plan.plan.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </Block>
          </section>

          {/* Brief creativo */}
          <section className="card p-6 sm:p-7 space-y-6 lg:col-span-2">
            <header>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Brief creativo</p>
              <h2 className="h-section mt-1">Insumos para producción</h2>
            </header>

            <Block title="Hooks">
              <ul className="space-y-1.5">
                {plan.brief.hooks.map((h, i) => (
                  <li key={i} className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-800 ring-1 ring-ink-200/50">{h}</li>
                ))}
              </ul>
            </Block>

            <Block title="Headlines">
              <ul className="space-y-1.5">
                {plan.brief.headlines.map((h, i) => (
                  <li key={i} className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-800 ring-1 ring-ink-200/50">{h}</li>
                ))}
              </ul>
            </Block>

            <Block title="Textos principales">
              <ul className="space-y-1.5">
                {plan.brief.primary_texts.map((h, i) => (
                  <li key={i} className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-800 ring-1 ring-ink-200/50 leading-relaxed">{h}</li>
                ))}
              </ul>
            </Block>

            <Block title="Llamados a la acción">
              <div className="flex flex-wrap gap-2">
                {plan.brief.ctas.map((c, i) => (
                  <span key={i} className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200/60">{c}</span>
                ))}
              </div>
            </Block>

            <Block title="Formatos">
              <ul className="space-y-2">
                {plan.brief.formats.map((f, i) => (
                  <li key={i} className="rounded-lg border border-ink-200/70 p-3">
                    <div className="text-sm font-medium text-ink-800">{f.type}</div>
                    <div className="text-sm text-ink-600 leading-relaxed">{f.description}</div>
                  </li>
                ))}
              </ul>
            </Block>
          </section>
        </div>
      )}

      {plan && plan.assumptions.length > 0 && (
        <section className="card p-6 sm:p-7">
          <header className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200">
              <Info className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Supuestos</p>
              <h2 className="h-section">Decisiones inferidas por falta de datos</h2>
              <p className="muted mt-1">Cuanto más completes el wizard, menos supuestos se declaran.</p>
            </div>
          </header>
          <ul className="mt-5 space-y-2">
            {plan.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-ink-200/70 p-3">
                <span className={`badge ${impactCls(a.impact)}`}>{a.impact}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-800">
                    {a.field} <span className="font-normal text-ink-500">· {a.issue}</span>
                  </div>
                  <div className="text-sm text-ink-600 leading-relaxed mt-0.5">{a.suggestion}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Campañas Meta */}
      <section className="card p-6 sm:p-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm">
              <Megaphone className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Publicación</p>
              <h2 className="h-section">Campañas en Meta</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!creds?.has_token && (
              <Link to="/settings/meta" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
                Configurar credenciales
              </Link>
            )}
            <button className="btn-primary" disabled={!canCreateCampaign || busy} onClick={createCampaign}>
              <Megaphone className="h-4 w-4" />
              {busy ? 'Creando…' : 'Crear campaña (PAUSED)'}
            </button>
          </div>
        </header>

        {!creds?.has_token && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Necesitás configurar el access token y ad account de Meta para crear campañas.</span>
          </div>
        )}
        {!plan && (
          <p className="mt-5 text-sm text-ink-500">Generá el plan primero para poder publicarlo en Meta.</p>
        )}

        {campaigns.length === 0 ? (
          <p className="mt-5 text-sm text-ink-500">Todavía no hay campañas creadas para este proyecto.</p>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-xl ring-1 ring-ink-200/70">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Nombre</th>
                  <th className="px-3 py-2.5 font-medium">Objetivo</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Budget</th>
                  <th className="px-3 py-2.5 font-medium">ID Meta</th>
                  <th className="px-3 py-2.5 font-medium">Creada</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-ink-100 hover:bg-ink-50/50">
                    <td className="px-3 py-2.5 text-ink-800">{c.name}</td>
                    <td className="px-3 py-2.5 text-ink-700">{c.objective}</td>
                    <td className="px-3 py-2.5"><span className="badge bg-ink-100 text-ink-700">{c.status}</span></td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-700">{fmtMoney(c.daily_budget_cents / 100)}/d</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-600">{c.meta_campaign_id}</td>
                    <td className="px-3 py-2.5 text-ink-500">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function PlanSourceBadge({ source }: { source?: string }) {
  const s = source || 'template'
  if (s === 'llm') {
    return (
      <span className="badge bg-violet-50 text-violet-800 ring-1 ring-violet-200/70">
        <Bot className="h-3 w-3" /> Generado con LLM
      </span>
    )
  }
  if (s === 'llm_fallback') {
    return (
      <span className="badge bg-amber-50 text-amber-900 ring-1 ring-amber-200/70" title="El LLM falló o devolvió JSON inválido; se usó el generador por reglas.">
        <AlertTriangle className="h-3 w-3" /> LLM falló → plantilla
      </span>
    )
  }
  return (
    <span className="badge bg-ink-100 text-ink-600 ring-1 ring-ink-200/60" title="Generador determinístico por reglas (sin LLM o LLM deshabilitado).">
      Plantilla
    </span>
  )
}

function Box({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50/80 px-3 py-3 ring-1 ring-ink-200/70">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-ink-900">{value}</div>
    </div>
  )
}

function Block({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500 mb-2.5">
        {icon}
        <span>{title}</span>
      </h3>
      {children}
    </div>
  )
}

function impactCls(impact: string) {
  if (impact === 'alta') return 'bg-red-50 text-red-700 ring-1 ring-red-200/60 uppercase'
  if (impact === 'media') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 uppercase'
  return 'bg-ink-100 text-ink-700 uppercase'
}

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
