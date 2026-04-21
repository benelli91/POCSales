import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Project, type WizardAnswers, type WizardState } from '../api/client'

const CREATIVE_OPTIONS = ['UGC', 'video', 'imagen', 'carrusel', 'testimonio', 'oferta']

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
    setSaving(true)
    setErr('')
    try {
      const w = await api.put<WizardState>(`/projects/${projectId}/wizard`, { answers })
      setScore(w.completeness_score)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const generate = async () => {
    setSaving(true)
    setErr('')
    try {
      await api.put<WizardState>(`/projects/${projectId}/wizard`, { answers })
      await api.post(`/projects/${projectId}/plan`)
      nav(`/projects/${projectId}`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const steps = useMemo(
    () => [
      { id: 'objetivo', title: 'Objetivo & métrica' },
      { id: 'producto', title: 'Producto & economía unitaria' },
      { id: 'publico', title: 'Público & data' },
      { id: 'creativos', title: 'Creativos' },
      { id: 'destino', title: 'Destino & tracking' },
      { id: 'historial', title: 'Historial & presupuesto' },
    ],
    [],
  )

  if (!project) return <div className="text-slate-500">Cargando…</div>

  return (
    <div className="grid lg:grid-cols-[260px,1fr] gap-6">
      <aside className="space-y-3">
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900">{project.name}</h2>
          {project.industry && <p className="text-xs text-slate-500">{project.industry}</p>}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Completitud</span>
              <span>{score}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded h-2">
              <div className="bg-brand-600 h-2 rounded" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>
        <nav className="card p-2">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={`w-full text-left px-3 py-2 text-sm rounded ${
                step === i ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </nav>
        <div className="text-xs text-slate-500 px-1 leading-relaxed">
          Guardado incremental: cada vez que avanzás se persiste en SQLite. La generación valida campos y declara
          supuestos donde falte info.
        </div>
      </aside>

      <section className="space-y-4">
        <div className="card p-6 space-y-4">
          <h1 className="text-lg font-semibold text-slate-900">{steps[step].title}</h1>

          {step === 0 && <ObjetivoStep answers={answers} update={update} />}
          {step === 1 && <ProductoStep answers={answers} update={update} />}
          {step === 2 && <PublicoStep answers={answers} update={update} />}
          {step === 3 && <CreativosStep answers={answers} update={update} />}
          {step === 4 && <DestinoStep answers={answers} update={update} />}
          {step === 5 && <HistorialStep answers={answers} update={update} />}

          {err && <div className="text-sm text-red-600">{err}</div>}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => {
                void save().then(() => setStep((s) => Math.max(0, s - 1)))
              }}
            >
              ← Anterior
            </button>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => void save()} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {step < steps.length - 1 ? (
                <button
                  className="btn-primary"
                  onClick={() => {
                    void save().then(() => setStep((s) => Math.min(steps.length - 1, s + 1)))
                  }}
                  disabled={saving}
                >
                  Siguiente →
                </button>
              ) : (
                <button className="btn-primary" onClick={generate} disabled={saving}>
                  {saving ? 'Generando…' : 'Generar plan'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

type Sub = { answers: WizardAnswers; update: (p: Partial<WizardAnswers>) => void }

function ObjetivoStep({ answers, update }: Sub) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">¿Cuál es el objetivo principal?</label>
        <div className="grid grid-cols-3 gap-2">
          {(['ventas', 'leads', 'trafico'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => update({ objective: o })}
              className={`btn ${answers.objective === o ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
            >
              {o === 'trafico' ? 'tráfico' : o}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
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
    <div className="grid sm:grid-cols-2 gap-4">
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
    <div className="space-y-4">
      <div>
        <label className="label">¿A quién vendés?</label>
        <textarea
          className="input min-h-[80px]"
          value={answers.audience ?? ''}
          onChange={(e) => update({ audience: e.target.value })}
          placeholder="Describí brevemente el público objetivo (edad, intereses, ocupación, dolor, etc.)"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={!!answers.has_customer_data}
          onChange={(e) => update({ has_customer_data: e.target.checked })}
        />
        Tengo data de clientes existentes (emails, compras) para subir como audiencias custom / lookalike.
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
    <div className="space-y-4">
      <div>
        <label className="label">Tipos de creativos disponibles / a producir</label>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className={`btn ${selected.includes(c) ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Hooks / ángulos a probar (uno por línea)</label>
        <textarea
          className="input min-h-[100px]"
          value={answers.creative_hooks ?? ''}
          onChange={(e) => update({ creative_hooks: e.target.value })}
          placeholder={'ej.\nLo que nadie te cuenta sobre X\nResolvé Y en 24hs'}
        />
      </div>
      <div>
        <label className="label">¿Qué ya funcionó antes? (opcional)</label>
        <textarea
          className="input min-h-[60px]"
          value={answers.worked_before ?? ''}
          onChange={(e) => update({ worked_before: e.target.value })}
        />
      </div>
    </div>
  )
}

function DestinoStep({ answers, update }: Sub) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
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
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!answers.has_pixel} onChange={(e) => update({ has_pixel: e.target.checked })} />
          Pixel de Meta instalado y disparando.
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!answers.has_capi} onChange={(e) => update({ has_capi: e.target.checked })} />
          API de Conversiones (CAPI) configurada.
        </label>
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
    <div className="space-y-4">
      <div>
        <label className="label">Historial de campañas</label>
        <textarea
          className="input min-h-[80px]"
          value={answers.history ?? ''}
          onChange={(e) => update({ history: e.target.value })}
          placeholder="Resumen breve: qué funcionó, qué no, por qué."
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">CPA histórico</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={answers.historical_cpa ?? ''}
            onChange={(e) => update({ historical_cpa: numOrUndef(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Presupuesto diario</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={answers.daily_budget ?? ''}
            onChange={(e) => update({ daily_budget: numOrUndef(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Ventana de testeo (días)</label>
          <input
            className="input"
            type="number"
            value={answers.test_window_days ?? ''}
            onChange={(e) => update({ test_window_days: numOrUndef(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <label className="label">Notas adicionales</label>
        <textarea
          className="input min-h-[60px]"
          value={answers.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>
    </div>
  )
}

function numOrUndef(v: string): number | undefined {
  if (v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
