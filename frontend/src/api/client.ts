export const API = '/api'
export const TOKEN_KEY = 'pocsales_token'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(API + path, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    let msg = text
    try {
      const j = JSON.parse(text)
      if (j?.error) msg = j.error
    } catch {
      // text plano
    }
    throw new Error(msg || res.statusText)
  }
  if (res.status === 204) return undefined as T
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}

export type User = {
  id: number
  organization_id: number
  email: string
  name: string
  role: string
  created_at: string
}

export type Project = {
  id: number
  organization_id: number
  name: string
  industry?: string
  description?: string
  status: 'draft' | 'wizard' | 'generated' | 'published'
  created_at: string
  updated_at: string
}

export type WizardAnswers = {
  objective?: 'ventas' | 'leads' | 'trafico' | ''
  efficiency_kpi?: 'roas' | 'cpa' | 'cpc' | ''
  efficiency_value?: number
  product_name?: string
  average_ticket?: number
  margin_pct?: number
  bundles_upsells?: string
  audience?: string
  has_customer_data?: boolean
  customer_data_notes?: string
  creative_types?: string[]
  creative_hooks?: string
  worked_before?: string
  landing_type?: 'home' | 'pdp' | 'landing' | 'app' | ''
  landing_url?: string
  estimated_conv_rate?: number
  has_pixel?: boolean
  has_capi?: boolean
  key_events?: string
  tracking_quality?: 'baja' | 'media' | 'alta' | ''
  history?: string
  historical_cpa?: number
  daily_budget?: number
  test_window_days?: number
  notes?: string
}

export type WizardState = {
  project_id: number
  answers: WizardAnswers
  completeness_score: number
  updated_at: string
}

export type Plan = {
  headline: string
  objective: string
  strategy_steps: string[]
  audiences: { name: string; description: string; source: string }[]
  budget: { daily_budget: number; test_window_days: number; total_estimated: number }
  metrics: { kpi: string; target_value: number; max_sustainable_cpa?: number }
  risks: string[]
}

export type CreativeBrief = {
  hooks: string[]
  headlines: string[]
  primary_texts: string[]
  ctas: string[]
  formats: { type: string; description: string }[]
  do_not_mention?: string[]
}

export type Assumption = {
  field: string
  issue: 'missing' | 'weak' | 'inferred'
  impact: 'baja' | 'media' | 'alta'
  suggestion: string
}

export type GeneratedPlan = {
  id: number
  project_id: number
  version: number
  plan: Plan
  brief: CreativeBrief
  assumptions: Assumption[]
  created_at: string
}

export type MetaCredentials = {
  organization_id: number
  ad_account_id: string
  has_token: boolean
  updated_at: string
}

export type MetaCampaign = {
  id: number
  project_id: number
  plan_id?: number
  meta_campaign_id: string
  name: string
  objective: string
  status: string
  daily_budget_cents: number
  raw_response?: string
  created_at: string
}
