import { useEffect, useState } from 'react'
import { api, type MetaCredentials } from '../api/client'
import { AlertCircle, Check, Key, ShieldAlert } from 'lucide-react'

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
    setSaving(true); setErr(''); setInfo('')
    try {
      const c = await api.put<MetaCredentials>('/meta/credentials', {
        access_token: accessToken,
        ad_account_id: adAccountId,
      })
      setCreds(c); setAccessToken('')
      setInfo('Credenciales guardadas correctamente.')
    } catch (e) { setErr((e as Error).message) } finally { setSaving(false) }
  }

  const hasToken = !!creds?.has_token

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Integración</p>
        <h1 className="h-page mt-1">Credenciales Meta Ads</h1>
        <p className="muted mt-1">
          Necesarias para crear campañas reales (en estado <code>PAUSED</code>) vía Marketing API.
        </p>
      </header>

      <div className="card p-5 bg-gradient-to-br from-amber-50 to-white ring-amber-200/70">
        <div className="flex gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div className="text-sm">
            <p className="font-medium text-amber-900">Atención · limitación del POC</p>
            <p className="text-amber-800/80 mt-0.5 leading-relaxed">
              El token se guarda en SQLite en claro. Para producción usá un secret manager (AWS Secrets Manager, Google
              Secret Manager, Vault) y nunca lo expongas al frontend.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Estado actual</p>
            <p className="mt-1 font-semibold text-ink-900">
              {hasToken ? 'Credenciales configuradas' : 'Sin credenciales'}
            </p>
          </div>
          <span className={`badge badge-dot ${hasToken ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' : 'bg-ink-100 text-ink-700'}`}>
            {hasToken ? 'Token activo' : 'Inactivo'}
          </span>
        </div>
        {creds?.ad_account_id && (
          <div className="mt-3 flex items-center gap-2 text-sm text-ink-600">
            <span className="text-ink-500">Ad Account</span>
            <code className="font-mono text-[12px] text-ink-800">act_{creds.ad_account_id}</code>
          </div>
        )}
      </div>

      <form className="card p-6 sm:p-8 space-y-5" onSubmit={submit}>
        <h2 className="h-section">Actualizar credenciales</h2>

        <div>
          <label className="label">Ad Account ID</label>
          <input
            className="input font-mono"
            value={adAccountId}
            onChange={(e) => setAdAccountId(e.target.value)}
            placeholder="ej. 1234567890 (con o sin prefijo act_)"
            required
          />
          <p className="hint">Si no tenés el ID, aparece en el dashboard de Meta Ads Manager.</p>
        </div>

        <div>
          <label className="label">Access Token (System User Token recomendado)</label>
          <div className="relative">
            <Key className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-ink-400" />
            <input
              className="input pl-9 font-mono"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={hasToken ? '••••••••••••••••• (dejar vacío mantiene el actual)' : 'EAAB…'}
              type="password"
              autoComplete="off"
            />
          </div>
          <p className="hint">Para guardar cambios el token debe estar presente. Si lo dejás vacío, mantiene el anterior.</p>
        </div>

        {err && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        {info && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-ink-100">
          <button className="btn-primary" disabled={saving || !accessToken}>
            {saving ? 'Guardando…' : 'Guardar credenciales'}
          </button>
        </div>
      </form>
    </div>
  )
}
