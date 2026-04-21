import { useEffect, useState } from 'react'
import { api, type MetaCredentials } from '../api/client'

export default function MetaSettings() {
  const [creds, setCreds] = useState<MetaCredentials | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [adAccountId, setAdAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    api
      .get<MetaCredentials>('/meta/credentials')
      .then((c) => {
        setCreds(c)
        if (c?.ad_account_id) setAdAccountId(c.ad_account_id)
      })
      .catch((e) => setErr((e as Error).message))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErr('')
    setInfo('')
    try {
      const c = await api.put<MetaCredentials>('/meta/credentials', {
        access_token: accessToken,
        ad_account_id: adAccountId,
      })
      setCreds(c)
      setAccessToken('')
      setInfo('Credenciales guardadas.')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Credenciales Meta Ads</h1>
        <p className="text-sm text-slate-500">
          Necesarias para crear campañas reales (en estado <code>PAUSED</code>) vía Marketing API.
        </p>
      </div>

      <div className="card p-4 text-sm text-amber-800 bg-amber-50 border-amber-200">
        <strong>Atención (POC):</strong> el token se guarda en SQLite en claro. Para producción usar un secret manager
        (AWS Secrets Manager, Google Secret Manager, Vault, etc.) y nunca exponerlo al frontend.
      </div>

      <form className="card p-6 space-y-4" onSubmit={submit}>
        <div>
          <label className="label">Ad Account ID</label>
          <input
            className="input"
            value={adAccountId}
            onChange={(e) => setAdAccountId(e.target.value)}
            placeholder="ej. 1234567890 (con o sin prefijo act_)"
            required
          />
        </div>
        <div>
          <label className="label">Access Token (System User Token recomendado)</label>
          <input
            className="input font-mono"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder={creds?.has_token ? '••••••••••••• (dejar vacío mantiene el actual)' : 'EAAB…'}
            type="password"
          />
          <p className="text-xs text-slate-500 mt-1">
            Para que el guardado tenga efecto el token debe estar presente. Si dejás vacío, mantiene el anterior.
          </p>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {info && <div className="text-sm text-emerald-700">{info}</div>}
        <div className="flex justify-end">
          <button className="btn-primary" disabled={saving || !accessToken}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Estado actual</span>
          <span className={`badge ${creds?.has_token ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
            {creds?.has_token ? 'Token configurado' : 'Sin token'}
          </span>
        </div>
        {creds?.ad_account_id && (
          <p className="mt-2 text-slate-700">Ad Account: <span className="font-mono">act_{creds.ad_account_id}</span></p>
        )}
      </div>
    </div>
  )
}
