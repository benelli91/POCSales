import type { ReactNode } from 'react'
import { Sparkles, ShieldCheck, Rocket } from 'lucide-react'

export default function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-50">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink-900 text-white p-10">
        <div className="absolute inset-0 bg-mesh opacity-80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.35),transparent_55%)] pointer-events-none" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient shadow-lg">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18V6l6 7 6-7v12" />
              <path d="M16 11l4 7" />
            </svg>
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">POC Sales</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/60">Plataforma Ads</div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Diagnóstico riguroso,<br />
            <span className="bg-gradient-to-r from-brand-300 to-purple-300 bg-clip-text text-transparent">planes accionables.</span>
          </h2>
          <p className="text-white/70 text-[15px] leading-relaxed max-w-md">
            Convertí información del negocio en un plan estratégico y un brief creativo listos para Meta Ads, con supuestos explícitos.
          </p>
          <ul className="space-y-3 text-sm">
            <Feature icon={<Sparkles className="h-4 w-4" />} title="Supuestos explícitos" desc="Nada de recomendaciones mágicas. Si falta data, se declara." />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Humano en el loop" desc="Podés editar el plan antes de publicar. Las campañas se crean en PAUSED." />
            <Feature icon={<Rocket className="h-4 w-4" />} title="Un canal primero" desc="Integración directa con Meta Marketing API." />
          </ul>
        </div>

        <div className="relative text-[11px] text-white/50">
          © POC Sales · Uso interno · Demo
        </div>
      </aside>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18V6l6 7 6-7v12" />
                <path d="M16 11l4 7" />
              </svg>
            </span>
            <span className="text-sm font-semibold">POC Sales</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1.5 muted">{subtitle}</p>}
          <div className="mt-8 animate-slide-up">{children}</div>
        </div>
      </section>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-white/10 ring-1 ring-white/15 text-white">
        {icon}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-white/60 leading-snug">{desc}</div>
      </div>
    </li>
  )
}
