import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type Project, type WizardAnswers, type WizardState } from '../api/client'
import {
  ArrowLeft, ArrowRight, Check, Save, Sparkles,
  Target, Package, Users, Palette, Link2, History, AlertCircle,
} from 'lucide-react'

const CREATIVE_OPTIONS = ['UGC', 'video', 'imagen', 'carrusel', 'testimonio', 'oferta']

type StepDef = { id: string; title: string; icon: React.ComponentType<{ className?: string }>; desc: string }

export default function Wizard() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const nav = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [answers, setAnswers] = useState<WizardAnswers>({})
  const [score, setScore] = useState(0)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    void Promise.all([
      api.get<Project>(`/projects/${projectId}`),
      api.get<WizardState>(`/projects/${projectId}/wizard`),
    ])
      .then(([p, w]) => {
        setProject(p)
        setAnswers(w.answers ?? {})
        setScore(w.completeness_score ?? 0)
      })
      .catch((e) => setErr((e as Error).message))
  }, [projectId])

  const update = (patch: Partial<WizardAnswers>) => setAnswers((prev) => ({ ...prev, ...patch }))

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const w = await api.put<WizardState>(`/projects/${projectId}/wizard`, { answers })
      setScore(w.completeness_score)
    } catch (e) { setErr((e as Error).message) } finally { setSaving(false) }
  }

  const generate = async () => {
    setSaving(true); setErr('')
    try {
      await api.put<WizardState>(`/projects/${projectId}/wizard`, { answers })
      await api.post(`/projects/${projectId}/plan`)
      nav(`/projects/${projectId}`)
    } catch (e) { setErr((e as Error).message) } finally { setSaving(false) }
  }

  const steps: StepDef[] = useMemo(() => [
    { id: 'objetivo',  title: 'Objetivo & métrica',          icon: Target,  desc: 'Qué buscamos y cómo medimos eficiencia' },
    { id: 'producto',  title: 'Producto & economía unitaria', icon: Package, desc: 'Ticket, margen, bundles' },
    { id: 'publico',   title: 'Público & data',              icon: Users,   desc: 'A quién vendés y qué data tenés' },
    { id: 'creativos', title: 'Creativos',                   icon: Palette, desc: 'Formatos, hooks y ángulos' },
    { id: 'destino',   title: 'Destino & tracking',          icon: Link2,   desc: 'Landing, pixel, eventos clave' },
    { id: 'historial', title: 'Historial & presupuesto',     icon: History, desc: 'Qué funcionó y cuánto invertir' },
  ], [])

  if (!project) return <div className="muted">Cargando…</div>

  const StepIcon = steps[step].icon
  const isLast = step === steps.length - 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
          <ArrowLeft className="h-4 w-4" /> Volver al proyecto
        </Link>
        <span className="text-xs text-ink-500">Paso {step + 1} de {steps.length}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-ink-900">{project.name}</h2>
            {project.industry && <p className="text-xs text-ink-500">{project.industry}</p>}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-600">Completitud</span>
                <span className="tabular-nums font-semibold text-ink-900">{score}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-500">Más data, menos supuestos. Apuntá a ≥ 70% antes de generar.</p>
            </div>
          </div>

          <nav className="card overflow-hidden">
            <ul>
              {steps.map((s, i) => {
                const Icon = s.icon
                const active = i === step
                const done = i < step
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setStep(i)}
                      className={[
                        'relative flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors',
                        active ? 'bg-brand-50/60' : 'hover:bg-ink-50',
                        i !== 0 ? 'border-t border-ink-100' : '',
                      ].join(' ')}
                    >
                      <span className={[
                        'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs',
                        active
                          ? 'bg-brand-gradient text-white shadow-sm'
                          : done
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-ink-100 text-ink-500',
                      ].join(' ')}>
                        {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0">
                        <div className={active ? 'font-medium text-ink-900' : 'font-medium text-ink-700'}>
                          <span className="text-ink-400 mr-1">{i + 1}.</span>{s.title}
                        </div>
                        <div className="text-[11px] text-ink-500 leading-snug">{s.desc}</div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="rounded-xl bg-ink-100/60 p-3 text-[11px] leading-relaxed text-ink-600 ring-1 ring-ink-200/70">
            Cada "Siguiente" guarda el avance. Al generar, el sistema declara supuestos por los campos incompletos.
          </div>
        </aside>

        <section>
          <div className="card p-6 sm:p-8 animate-fade-in">
            <header className="flex items-start gap-3 pb-5 border-b border-ink-100">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm">
                <StepIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">Paso {step + 1}</p>
                <h1 className="h-section">{steps[step].title}</h1>
              </div>
            </header>

            <div className="pt-6">
              {step === 0 && <ObjetivoStep answers={answers} update={update} />}
              {step === 1 && <ProductoStep answers={answers} update={update} />}
              {step === 2 && <PublicoStep answers={answers} update={update} />}
              {step === 3 && <CreativosStep answers={answers} update={update} />}
              {step === 4 && <DestinoStep answers={answers} update={update} />}
              {step === 5 && <HistorialStep answers={answers} update={update} />}
            </div>

            {err && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 pt-5 border-t border-ink-100">
              <button
                className="btn-secondary"
                disabled={step === 0 || saving}
                onClick={() => { void save().then(() => setStep((s) => Math.max(0, s - 1))) }}
              >
                <ArrowLeft className="h-4 w-4" /> Anterior
              </button>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => void save()} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                {!isLast ? (
                  <button
                    className="btn-primary"
                    onClick={() => { void save().then(() => setStep((s) => Math.min(steps.length - 1, s + 1))) }}
                    disabled={saving}
                  >
                    Siguiente <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button className="btn-primary" onClick={generate} disabled={saving}>
                    <Sparkles className="h-4 w-4" />
                    {saving ? 'Generando…' : 'Generar plan'}
                  </button>
                )}
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  )
}

type Sub = { answers: WizardAnswers; update: (p: Partial<WizardAnswers>) => void }

function ObjetivoStep({ answers, update }: Sub) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">¿Cuál es el objetivo principal?</label>
        <div className="grid grid-cols-3 gap-2">
          {(['ventas', 'leads', 'trafico'] as const).map((o) => {
            const selected = answers.objective === o
            return (
              <button
                key={o}
                type="button"
                onClick={() => update({ objective: o })}
                className={[
                  'rounded-lg px-3 py-2.5 text-sm font-medium capitalize transition',
                  selected
                    ? 'bg-brand-gradient text-white shadow-sm'
                    : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-ink-300',
                ].join(' ')}
              >
                {o === 'trafico' ? 'tráfico' : o}
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">KPI de eficiencia</label>
          <select
            className="input"
            value={answers.efficiency_kpi ?? ''}
            onChange={(e) => update({ efficiency_kpi: e.target.value as WizardAnswers['efficiency_kpi'] })}
          >
            <option value="">— elegir —</option>
            <option value="roas">ROAS objetivo</option>
            <option value="cpa">CPA objetivo</option>
            <option value="cpc">CPC objetivo</option>
          </select>
        </div>
        <div>
          <label className="label">Valor objetivo</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={answers.efficiency_value ?? ''}
            onChange={(e) => update({ efficiency_value: numOrUndef(e.target.value) })}
            placeholder="ej. 3 (ROAS) o 25 (CPA)"
          />
        </div>
      </div>
    </div>
  )
}

function ProductoStep({ answers, update }: Sub) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Producto u oferta empujada</label>
        <input
          className="input"
          value={answers.product_name ?? ''}
          onChange={(e) => update({ product_name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Ticket promedio</label>
        <input
          className="input"
          type="number"
          step="0.01"
          value={answers.average_ticket ?? ''}
          onChange={(e) => update({ average_ticket: numOrUndef(e.target.value) })}
        />
      </div>
      <div>
        <label className="label">Margen (%)</label>
        <input
          className="input"
          type="number"
          step="0.1"
          value={answers.margin_pct ?? ''}
          onChange={(e) => update({ margin_pct: numOrUndef(e.target.value) })}
          placeholder="ej. 35"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Bundles / upsells (opcional)</label>
        <input
          className="input"
          value={answers.bundles_upsells ?? ''}
          onChange={(e) => update({ bundles_upsells: e.target.value })}
        />
      </div>
    </div>
  )
}

function PublicoStep({ answers, update }: Sub) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">¿A quién vendés?</label>
        <textarea
          className="input min-h-[100px]"
          value={answers.audience ?? ''}
          onChange={(e) => update({ audience: e.target.value })}
          placeholder="Describí brevemente el público objetivo (edad, intereses, ocupación, dolor, etc.)"
        />
      </div>
      <label className="flex items-start gap-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-700 ring-1 ring-ink-200/70 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-brand-600"
          checked={!!answers.has_customer_data}
          onChange={(e) => update({ has_customer_data: e.target.checked })}
        />
        <div>
          <div className="font-medium text-ink-800">Tengo data de clientes existentes</div>
          <div className="text-xs text-ink-500">Emails, compras, etc. para subir como audiencias custom / lookalike.</div>
        </div>
      </label>
      {answers.has_customer_data && (
        <div>
          <label className="label">¿Qué data tenés?</label>
          <input
            className="input"
            value={answers.customer_data_notes ?? ''}
            onChange={(e) => update({ customer_data_notes: e.target.value })}
            placeholder="ej. lista de 1.5k compradores con email"
          />
        </div>
      )}
    </div>
  )
}

function CreativosStep({ answers, update }: Sub) {
  const selected = answers.creative_types ?? []
  const toggle = (val: string) => {
    if (selected.includes(val)) update({ creative_types: selected.filter((v) => v !== val) })
    else update({ creative_types: [...selected, val] })
  }
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Tipos de creativos disponibles / a producir</label>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_OPTIONS.map((c) => {
            const on = selected.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={[
                  'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                  on
                    ? 'bg-brand-gradient text-white shadow-sm'
                    : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-ink-300',
                ].join(' ')}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label className="label">Hooks / ángulos a probar (uno por línea)</label>
        <textarea
          className="input min-h-[110px] font-mono text-[13px]"
          value={answers.creative_hooks ?? ''}
          onChange={(e) => update({ creative_hooks: e.target.value })}
          placeholder={'ej.\nLo que nadie te cuenta sobre X\nResolvé Y en 24hs'}
        />
      </div>
      <div>
        <label className="label">¿Qué ya funcionó antes? (opcional)</label>
        <textarea
          className="input min-h-[70px]"
          value={answers.worked_before ?? ''}
          onChange={(e) => update({ worked_before: e.target.value })}
        />
      </div>
    </div>
  )
}

function DestinoStep({ answers, update }: Sub) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Tipo de destino</label>
          <select
            className="input"
            value={answers.landing_type ?? ''}
            onChange={(e) => update({ landing_type: e.target.value as WizardAnswers['landing_type'] })}
          >
            <option value="">— elegir —</option>
            <option value="home">Home</option>
            <option value="pdp">Página de producto (PDP)</option>
            <option value="landing">Landing dedicada</option>
            <option value="app">App / formulario</option>
          </select>
        </div>
        <div>
          <label className="label">URL destino</label>
          <input
            className="input"
            value={answers.landing_url ?? ''}
            onChange={(e) => update({ landing_url: e.target.value })}
            placeholder="https://"
          />
        </div>
      </div>
      <div>
        <label className="label">Conversión estimada (%)</label>
        <input
          className="input"
          type="number"
          step="0.1"
          value={answers.estimated_conv_rate ?? ''}
          onChange={(e) => update({ estimated_conv_rate: numOrUndef(e.target.value) })}
          placeholder="ej. 1.5"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          label="Pixel de Meta instalado"
          hint="y disparando eventos"
          checked={!!answers.has_pixel}
          onChange={(v) => update({ has_pixel: v })}
        />
        <Toggle
          label="API de Conversiones (CAPI)"
          hint="server-side configurada"
          checked={!!answers.has_capi}
          onChange={(v) => update({ has_capi: v })}
        />
      </div>
      <div>
        <label className="label">Eventos clave configurados</label>
        <input
          className="input"
          value={answers.key_events ?? ''}
          onChange={(e) => update({ key_events: e.target.value })}
          placeholder="ej. ViewContent, AddToCart, Purchase, Lead"
        />
      </div>
      <div>
        <label className="label">Calidad del tracking</label>
        <select
          className="input"
          value={answers.tracking_quality ?? ''}
          onChange={(e) => update({ tracking_quality: e.target.value as WizardAnswers['tracking_quality'] })}
        >
          <option value="">— elegir —</option>
          <option value="alta">Alta (eventos limpios, deduplicados)</option>
          <option value="media">Media (eventos básicos sin CAPI)</option>
          <option value="baja">Baja (solo clics / sin pixel)</option>
        </select>
      </div>
    </div>
  )
}

function HistorialStep({ answers, update }: Sub) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Historial de campañas</label>
        <textarea
          className="input min-h-[90px]"
          value={answers.history ?? ''}
          onChange={(e) => update({ history: e.target.value })}
          placeholder="Resumen breve: qué funcionó, qué no, por qué."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">CPA histórico</label>
          <input className="input" type="number" step="0.01" value={answers.historical_cpa ?? ''} onChange={(e) => update({ historical_cpa: numOrUndef(e.target.value) })} />
        </div>
        <div>
          <label className="label">Presupuesto diario</label>
          <input className="input" type="number" step="0.01" value={answers.daily_budget ?? ''} onChange={(e) => update({ daily_budget: numOrUndef(e.target.value) })} />
        </div>
        <div>
          <label className="label">Ventana de testeo (días)</label>
          <input className="input" type="number" value={answers.test_window_days ?? ''} onChange={(e) => update({ test_window_days: numOrUndef(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">Notas adicionales</label>
        <textarea className="input min-h-[70px]" value={answers.notes ?? ''} onChange={(e) => update({ notes: e.target.value })} />
      </div>
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm ring-1 ring-ink-200 hover:ring-ink-300 cursor-pointer transition">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-brand-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <div className="font-medium text-ink-800">{label}</div>
        {hint && <div className="text-xs text-ink-500">{hint}</div>}
      </div>
    </label>
  )
}

function numOrUndef(v: string): number | undefined {
  if (v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
