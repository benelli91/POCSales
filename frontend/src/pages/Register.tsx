import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import { AlertCircle, ArrowRight, Building2, Lock, Mail, User } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [orgName, setOrgName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await register(orgName, email, password, name)
      nav('/')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="Una org por cuenta, múltiples proyectos y campañas adentro.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Organización" icon={<Building2 className="h-4 w-4" />}>
          <input className="input pl-9" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="ej. Acme Studio" />
        </Field>
        <Field label="Tu nombre" icon={<User className="h-4 w-4" />}>
          <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" />
        </Field>
        <Field label="Email" icon={<Mail className="h-4 w-4" />}>
          <input className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
        </Field>
        <Field label="Contraseña" icon={<Lock className="h-4 w-4" />}>
          <input className="input pl-9" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required />
        </Field>

        {err && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creando…' : (<>Crear cuenta <ArrowRight className="h-4 w-4" /></>)}
        </button>

        <p className="text-center text-sm text-ink-500">
          ¿Ya tenés cuenta?{' '}
          <Link className="font-medium text-brand-600 hover:text-brand-700 hover:underline" to="/login">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}
