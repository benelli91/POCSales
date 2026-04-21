import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Project } from '../api/client'

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Nuevo proyecto</h1>
      <p className="text-sm text-slate-500 mb-6">Después del alta vamos directo al wizard de diagnóstico.</p>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Nombre del negocio o cliente</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Industria / vertical</label>
          <input
            className="input"
            placeholder="ej. ecommerce, servicios locales, B2B SaaS"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => nav('/')}>
            Cancelar
          </button>
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Creando…' : 'Crear y continuar al wizard'}
          </button>
        </div>
      </form>
    </div>
  )
}
