import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Project } from '../api/client'
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Tag } from 'lucide-react'

export default function NewProject() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const p = await api.post<Project>('/projects', { name, industry, description })
      nav(`/projects/${p.id}/wizard`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Volver a proyectos
      </Link>

      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Nuevo proyecto</p>
        <h1 className="h-page mt-1">Creá un proyecto</h1>
        <p className="muted mt-1">Después del alta vamos directo al wizard de diagnóstico.</p>
      </header>

      <form onSubmit={submit} className="card p-6 sm:p-8 space-y-5">
        <Field label="Nombre del negocio o cliente" icon={<Building2 className="h-4 w-4" />} required>
          <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Industria / vertical" icon={<Tag className="h-4 w-4" />}>
          <input
            className="input pl-9"
            placeholder="ej. ecommerce, servicios locales, B2B SaaS"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </Field>
        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input min-h-[110px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qué vende, quién es el cliente ideal, contexto competitivo, etc."
          />
        </div>
        {err && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
          <button type="button" className="btn-secondary" onClick={() => nav('/')}>Cancelar</button>
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Creando…' : (<>Continuar al wizard <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, icon, required, children }: { label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">{icon}</span>
        )}
        {children}
      </div>
    </div>
  )
}
