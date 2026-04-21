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
      setProject(p)
      setWizard(w)
      setCreds(c)
      setCampaigns(m.items ?? [])
      try {
        const pl = await api.get<GeneratedPlan>(`/projects/${projectId}/plan`)
        setPlan(pl)
      } catch {
        setPlan(null)
      }
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const regenerate = async () => {
    setBusy(true)
    setErr('')
    setInfo('')
    try {
      const pl = await api.post<GeneratedPlan>(`/projects/${projectId}/plan`)
      setPlan(pl)
      setInfo(`Plan regenerado (versión ${pl.version}).`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const createCampaign = async () => {
    setBusy(true)
    setErr('')
    setInfo('')
    try {
      const c = await api.post<MetaCampaign>(`/projects/${projectId}/meta/campaigns`, {})
      setCampaigns((prev) => [c, ...prev])
      setInfo(`Campaña creada en Meta (id=${c.meta_campaign_id}, status=${c.status}).`)
      void load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!project) return <div className="text-slate-500">Cargando…</div>

  const canCreateCampaign = !!plan && !!creds?.has_token && !!creds?.ad_account_id

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">← Volver</Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">{project.name}</h1>
          {project.industry && <p className="text-sm text-slate-500">{project.industry}</p>}
          {project.description && <p className="text-sm text-slate-600 mt-2">{project.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link to={`/projects/${project.id}/wizard`} className="btn-secondary">Editar wizard ({wizard?.completeness_score ?? 0}%)</Link>
          <button className="btn-primary" onClick={regenerate} disabled={busy}>
            {plan ? 'Regenerar plan' : 'Generar plan'}
          </button>
        </div>
      </div>

      {err && <div className="card p-3 text-sm text-red-700 bg-red-50 border-red-200">{err}</div>}
      {info && <div className="card p-3 text-sm text-emerald-700 bg-emerald-50 border-emerald-200">{info}</div>}

      {!plan && (
        <div className="card p-6 text-slate-600">
          Todavía no hay un plan generado. Completá el wizard y generá uno desde el botón de arriba.
        </div>
      )}

      {plan && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Plan estratégico (v{plan.version})</h2>
              <span className="badge bg-blue-100 text-blue-700">{plan.plan.objective}</span>
            </div>
            <p className="text-slate-700">{plan.plan.headline}</p>
            <div>
              <h3 className="font-medium text-sm text-slate-700 mb-2">Pasos de estrategia</h3>
              <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
                {plan.plan.strategy_steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-sm text-slate-700 mb-2">Audiencias</h3>
              <ul className="space-y-2">
                {plan.plan.audiences.map((a, i) => (
                  <li key={i} className="border border-slate-200 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{a.name}</span>
                      <span className="badge bg-slate-100 text-slate-700">{a.source}</span>
                    </div>
                    <p className="text-sm text-slate-600">{a.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Box label="Presupuesto diario" value={fmtMoney(plan.plan.budget.daily_budget)} />
              <Box label="Ventana de testeo" value={`${plan.plan.budget.test_window_days} d`} />
              <Box label="Total estimado" value={fmtMoney(plan.plan.budget.total_estimated)} />
            </div>
            <div>
              <h3 className="font-medium text-sm text-slate-700 mb-2">KPI</h3>
              <p className="text-sm text-slate-700">
                Objetivo: <strong>{plan.plan.metrics.kpi.toUpperCase()}</strong>{' '}
                {plan.plan.metrics.target_value ? `= ${plan.plan.metrics.target_value}` : ''}
                {plan.plan.metrics.max_sustainable_cpa
                  ? ` · CPA máx. sostenible ≈ ${fmtMoney(plan.plan.metrics.max_sustainable_cpa)}`
                  : ''}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-slate-700 mb-2">Riesgos</h3>
              <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                {plan.plan.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Brief creativo</h2>
            <Section title="Hooks">
              <ul className="text-sm space-y-1">
                {plan.brief.hooks.map((h, i) => (
                  <li key={i} className="border border-slate-200 rounded px-2 py-1">{h}</li>
                ))}
              </ul>
            </Section>
            <Section title="Headlines">
              <ul className="text-sm space-y-1">
                {plan.brief.headlines.map((h, i) => (
                  <li key={i} className="border border-slate-200 rounded px-2 py-1">{h}</li>
                ))}
              </ul>
            </Section>
            <Section title="Textos principales">
              <ul className="text-sm space-y-1">
                {plan.brief.primary_texts.map((h, i) => (
                  <li key={i} className="border border-slate-200 rounded px-2 py-1">{h}</li>
                ))}
              </ul>
            </Section>
            <Section title="Llamados a la acción">
              <div className="flex flex-wrap gap-2 text-sm">
                {plan.brief.ctas.map((c, i) => (
                  <span key={i} className="badge bg-brand-50 text-brand-700">{c}</span>
                ))}
              </div>
            </Section>
            <Section title="Formatos">
              <ul className="text-sm space-y-2">
                {plan.brief.formats.map((f, i) => (
                  <li key={i} className="border border-slate-200 rounded p-2">
                    <div className="font-medium text-slate-800">{f.type}</div>
                    <div className="text-slate-600">{f.description}</div>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      )}

      {plan && plan.assumptions.length > 0 && (
        <div className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Supuestos declarados</h2>
          <p className="text-sm text-slate-500">Estas son las decisiones que el sistema infirió por falta de datos. Más completes el wizard, menos supuestos.</p>
          <ul className="text-sm space-y-2">
            {plan.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-3 border border-slate-200 rounded p-3">
                <span className={`badge ${impactCls(a.impact)}`}>{a.impact}</span>
                <div>
                  <div className="font-medium text-slate-800">{a.field} <span className="text-slate-400">· {a.issue}</span></div>
                  <div className="text-slate-600">{a.suggestion}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Campañas en Meta</h2>
          <div className="flex items-center gap-3">
            {!creds?.has_token && (
              <Link to="/settings/meta" className="text-sm text-brand-600 hover:underline">Configurar credenciales</Link>
            )}
            <button className="btn-primary" disabled={!canCreateCampaign || busy} onClick={createCampaign}>
              {busy ? 'Creando…' : 'Crear campaña en Meta (PAUSED)'}
            </button>
          </div>
        </div>

        {!creds?.has_token && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Necesitás configurar el access token y ad account de Meta para crear campañas.
          </div>
        )}
        {!plan && (
          <div className="text-sm text-slate-500">Generá el plan primero para poder publicarlo en Meta.</div>
        )}
        {campaigns.length === 0 ? (
          <div className="text-sm text-slate-500">Todavía no hay campañas creadas para este proyecto.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Nombre</th>
                <th>Objetivo</th>
                <th>Status</th>
                <th>Budget</th>
                <th>ID Meta</th>
                <th>Creada</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="py-2">{c.name}</td>
                  <td>{c.objective}</td>
                  <td>{c.status}</td>
                  <td>{fmtMoney(c.daily_budget_cents / 100)}/d</td>
                  <td className="font-mono text-xs">{c.meta_campaign_id}</td>
                  <td className="text-slate-500">{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-medium text-sm text-slate-700 mb-2">{title}</h3>
      {children}
    </div>
  )
}

function impactCls(impact: string) {
  if (impact === 'alta') return 'bg-red-100 text-red-700'
  if (impact === 'media') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
