import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-6 space-y-4">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded bg-brand-600 mb-3" />
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-slate-500">POC: usar credenciales del seed (demo@pocsales.local / demo1234)</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <div className="text-center text-sm text-slate-500">
          ¿No tenés cuenta? <Link className="text-brand-600 hover:underline" to="/register">Registrate</Link>
        </div>
      </form>
    </div>
  )
}
