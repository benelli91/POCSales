import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-semibold">Crear cuenta</h1>
        <div>
          <label className="label">Organización</label>
          <input className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Tu nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
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
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
        <div className="text-center text-sm text-slate-500">
          ¿Ya tenés cuenta? <Link className="text-brand-600 hover:underline" to="/login">Iniciar sesión</Link>
        </div>
      </form>
    </div>
  )
}
