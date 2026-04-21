import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import { AlertCircle, ArrowRight, Mail, Lock } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('demo@pocsales.local')
  const [password, setPassword] = useState('demo1234')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Iniciar sesión" subtitle="Accedé con las credenciales del seed o las que hayas registrado.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email" icon={<Mail className="h-4 w-4" />}>
          <input
            className="input pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Contraseña" icon={<Lock className="h-4 w-4" />}>
          <input
            className="input pl-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        {err && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando…' : (<>Entrar <ArrowRight className="h-4 w-4" /></>)}
        </button>

        <div className="flex items-center gap-3 text-[11px] text-ink-500">
          <div className="h-px flex-1 bg-ink-200" />
          <span className="uppercase tracking-wider">Demo</span>
          <div className="h-px flex-1 bg-ink-200" />
        </div>

        <div className="rounded-lg border border-dashed border-ink-200 bg-white/50 p-3 text-xs text-ink-600">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ink-800">Credenciales de prueba</span>
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono text-ink-600">seed</span>
          </div>
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 font-mono text-[11px]">
            <dt className="text-ink-500">email</dt><dd className="text-ink-800">demo@pocsales.local</dd>
            <dt className="text-ink-500">pass</dt><dd className="text-ink-800">demo1234</dd>
          </dl>
        </div>

        <p className="text-center text-sm text-ink-500">
          ¿No tenés cuenta?{' '}
          <Link className="font-medium text-brand-600 hover:text-brand-700 hover:underline" to="/register">
            Crear una
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
