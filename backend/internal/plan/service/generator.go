package service

import (
	"fmt"
	"strings"

	planentity "pocsales/internal/plan/entity"
	projentity "pocsales/internal/project/entity"
)

// Generate construye Plan + Brief + lista de supuestos a partir del wizard.
// La salida es JSON-compatible (estructuras tipadas) que cumple con la regla
// "validación de salida + supuestos explícitos" del Plan Fase 1.
func Generate(project *projentity.Project, ans projentity.WizardAnswers) (planentity.Plan, planentity.CreativeBrief, []planentity.Assumption) {
	objective := strings.ToLower(strings.TrimSpace(ans.Objective))
	if objective == "" {
		objective = "ventas"
	}

	plan := planentity.Plan{
		Headline:  buildHeadline(project, ans, objective),
		Objective: objective,
		StrategySteps: []string{
			"Garantizar tracking mínimo (pixel + eventos clave) antes de invertir.",
			"Lanzar 2-3 conjuntos de anuncios con audiencias diferenciadas.",
			"Cada conjunto con 3 variantes creativas distintas (hooks).",
			"Ventana de testeo definida; sin tocar variables sin señal estadística.",
			"Revisión semanal de CPA / ROAS; pausar lo que no llegue al objetivo.",
		},
		Audiences: defaultAudiences(ans),
		Budget:    buildBudget(ans),
		Metrics:   buildMetrics(ans),
		Risks:     buildRisks(ans),
	}

	brief := planentity.CreativeBrief{
		Hooks:        buildHooks(ans, objective),
		Headlines:    buildHeadlines(ans, objective),
		PrimaryTexts: buildPrimaryTexts(ans, objective),
		CTAs:         buildCTAs(objective),
		Formats:      buildFormats(ans),
		DoNotMention: []string{
			"Promesas de resultados garantizados (cumple políticas de Meta).",
			"Términos prohibidos por Meta Ads (salud, finanzas sin disclaimers).",
		},
	}

	assumptions := buildAssumptions(ans)

	return plan, brief, assumptions
}

func buildHeadline(p *projentity.Project, ans projentity.WizardAnswers, objective string) string {
	name := p.Name
	if ans.ProductName != "" {
		name = ans.ProductName
	}
	switch objective {
	case "leads":
		return fmt.Sprintf("Plan de captación de leads para %s", name)
	case "trafico":
		return fmt.Sprintf("Plan de tráfico cualificado para %s", name)
	default:
		return fmt.Sprintf("Plan de ventas en Meta Ads para %s", name)
	}
}

func defaultAudiences(ans projentity.WizardAnswers) []planentity.Audience {
	auds := []planentity.Audience{
		{
			Name:        "Cold - Intereses afines",
			Description: deriveInterestAudience(ans),
			Source:      "interest",
		},
	}
	if ans.HasCustomerData {
		auds = append(auds,
			planentity.Audience{
				Name:        "Lookalike 1% compradores",
				Description: "Audiencia similar a los compradores cargados (LAL 1%, país principal).",
				Source:      "lookalike",
			},
			planentity.Audience{
				Name:        "Retargeting visitantes 30d",
				Description: "Visitantes del sitio en los últimos 30 días que no convirtieron.",
				Source:      "retargeting",
			},
		)
	}
	return auds
}

func deriveInterestAudience(ans projentity.WizardAnswers) string {
	if ans.Audience != "" {
		return ans.Audience
	}
	return "Definir intereses primarios (a confirmar con cliente). Probar 2-3 stacks de intereses, edad 25-55."
}

func buildBudget(ans projentity.WizardAnswers) planentity.BudgetPlan {
	daily := ans.DailyBudget
	if daily <= 0 {
		daily = 20.0
	}
	window := ans.TestWindowDays
	if window <= 0 {
		window = 14
	}
	return planentity.BudgetPlan{
		DailyBudget:    daily,
		TestWindowDays: window,
		TotalEstimated: daily * float64(window),
	}
}

func buildMetrics(ans projentity.WizardAnswers) planentity.MetricGoals {
	m := planentity.MetricGoals{
		KPI:         strings.ToLower(strings.TrimSpace(ans.EfficiencyKPI)),
		TargetValue: ans.EfficiencyValue,
	}
	if m.KPI == "" {
		m.KPI = "cpa"
	}
	// CPA máximo sostenible = ticket * margen%
	if ans.AverageTicket > 0 && ans.MarginPct > 0 {
		m.MaxSustainable = ans.AverageTicket * (ans.MarginPct / 100)
	}
	return m
}

func buildRisks(ans projentity.WizardAnswers) []string {
	var risks []string
	if !ans.HasPixel {
		risks = append(risks, "Sin pixel: no se podrá optimizar a conversiones, solo proxy (clics/landing views).")
	}
	if !ans.HasCAPI {
		risks = append(risks, "Sin API de Conversiones (CAPI): atribución degradada por iOS/cookies.")
	}
	if ans.AverageTicket > 0 && ans.MarginPct > 0 && ans.EfficiencyKPI == "cpa" && ans.EfficiencyValue > 0 {
		max := ans.AverageTicket * (ans.MarginPct / 100)
		if ans.EfficiencyValue > max {
			risks = append(risks, fmt.Sprintf("CPA objetivo (%.2f) > CPA máximo sostenible (%.2f). Plan no rentable salvo por LTV.", ans.EfficiencyValue, max))
		}
	}
	if ans.DailyBudget > 0 && ans.DailyBudget < 10 {
		risks = append(risks, "Presupuesto diario muy bajo: difícil obtener señal estadística por conjunto de anuncios.")
	}
	if len(risks) == 0 {
		risks = append(risks, "Sin riesgos críticos detectados con la información provista.")
	}
	return risks
}

func buildHooks(ans projentity.WizardAnswers, objective string) []string {
	if ans.CreativeHooks != "" {
		// Permitir que el usuario provea hooks separados por línea/coma
		raw := strings.NewReplacer(",", "\n").Replace(ans.CreativeHooks)
		var out []string
		for _, h := range strings.Split(raw, "\n") {
			h = strings.TrimSpace(h)
			if h != "" {
				out = append(out, h)
			}
		}
		if len(out) > 0 {
			return out
		}
	}
	switch objective {
	case "leads":
		return []string{
			"¿Cansado de [problema]? Te ayudamos en [tiempo].",
			"Agendá una llamada gratis y resolvelo esta semana.",
			"Lo que nadie te cuenta sobre [tema].",
		}
	case "trafico":
		return []string{
			"3 cosas que tenés que saber antes de comprar [categoría].",
			"Mirá cómo funciona en menos de 30 segundos.",
			"Probá nuestra calculadora gratuita.",
		}
	default:
		return []string{
			"El error más común al elegir [producto].",
			"Por qué nuestros clientes vuelven a comprar.",
			"Hoy con envío gratis. Solo por 24h.",
		}
	}
}

func buildHeadlines(ans projentity.WizardAnswers, objective string) []string {
	prod := ans.ProductName
	if prod == "" {
		prod = "tu producto"
	}
	switch objective {
	case "leads":
		return []string{
			"Hablemos: agendá tu diagnóstico gratis",
			fmt.Sprintf("¿Querés saber si %s es para vos?", prod),
			"Respuesta en 24hs",
		}
	case "trafico":
		return []string{
			fmt.Sprintf("Conocé %s", prod),
			"Mirá la demo en 30s",
			"Empezá gratis",
		}
	default:
		return []string{
			fmt.Sprintf("%s con envío gratis hoy", prod),
			"Stock por tiempo limitado",
			"Pedí el tuyo hoy",
		}
	}
}

func buildPrimaryTexts(ans projentity.WizardAnswers, objective string) []string {
	prod := ans.ProductName
	if prod == "" {
		prod = "nuestro producto"
	}
	if objective == "leads" {
		return []string{
			fmt.Sprintf("Si estás evaluando %s, agendá una llamada gratis. Te explicamos si encaja con tu caso.", prod),
			"Más de 200 clientes confiaron en nosotros este año. Reservá tu diagnóstico sin costo.",
		}
	}
	if objective == "trafico" {
		return []string{
			fmt.Sprintf("%s, explicado en simple. Mirá la demo y decidí si es para vos.", prod),
			"Probalo gratis y sin tarjeta. Ves el valor antes de pagar nada.",
		}
	}
	return []string{
		fmt.Sprintf("%s con descuento por tiempo limitado. Envío en 48hs.", prod),
		"Compras hoy, lo recibís en pocos días. Cambios sin costo.",
	}
}

func buildCTAs(objective string) []string {
	switch objective {
	case "leads":
		return []string{"Agendar llamada", "Pedir info", "Reservar lugar"}
	case "trafico":
		return []string{"Más información", "Ver demo", "Probar gratis"}
	default:
		return []string{"Comprar ahora", "Ver más", "Aprovechar oferta"}
	}
}

func buildFormats(ans projentity.WizardAnswers) []planentity.CreativeFormat {
	wanted := ans.CreativeTypes
	if len(wanted) == 0 {
		return []planentity.CreativeFormat{
			{Type: "image", Description: "Imagen estática con producto + texto principal sobre fondo limpio."},
			{Type: "video", Description: "Video vertical 9:16 de 15-30s con hook en los primeros 2s."},
		}
	}
	out := make([]planentity.CreativeFormat, 0, len(wanted))
	for _, t := range wanted {
		t = strings.ToLower(strings.TrimSpace(t))
		switch t {
		case "ugc":
			out = append(out, planentity.CreativeFormat{Type: "ugc", Description: "Cliente real hablando del producto cámara en mano. Subtítulos quemados."})
		case "video":
			out = append(out, planentity.CreativeFormat{Type: "video", Description: "Video vertical 9:16 de 15-30s con hook en los primeros 2s."})
		case "imagen", "image", "producto":
			out = append(out, planentity.CreativeFormat{Type: "image", Description: "Imagen estática con producto + texto principal sobre fondo limpio."})
		case "carousel", "carrusel":
			out = append(out, planentity.CreativeFormat{Type: "carousel", Description: "Carrusel de 3-5 cards: problema → solución → beneficio → social proof → oferta."})
		case "testimonio":
			out = append(out, planentity.CreativeFormat{Type: "ugc", Description: "Testimonio breve de cliente con resultado concreto."})
		case "oferta":
			out = append(out, planentity.CreativeFormat{Type: "image", Description: "Visual con la oferta destacada (descuento o bundle) y CTA claro."})
		default:
			out = append(out, planentity.CreativeFormat{Type: t, Description: "Formato definido por el equipo creativo."})
		}
	}
	return out
}

func buildAssumptions(ans projentity.WizardAnswers) []planentity.Assumption {
	var as []planentity.Assumption
	if ans.Audience == "" {
		as = append(as, planentity.Assumption{Field: "audience", Issue: "missing", Impact: "alta", Suggestion: "Definir audiencia objetivo: edades, intereses, comportamiento."})
	}
	if !ans.HasPixel {
		as = append(as, planentity.Assumption{Field: "tracking.pixel", Issue: "missing", Impact: "alta", Suggestion: "Instalar pixel y eventos clave (ViewContent, AddToCart, Purchase / Lead)."})
	}
	if !ans.HasCAPI {
		as = append(as, planentity.Assumption{Field: "tracking.capi", Issue: "missing", Impact: "media", Suggestion: "Configurar CAPI para mejorar atribución."})
	}
	if ans.MarginPct <= 0 {
		as = append(as, planentity.Assumption{Field: "margin_pct", Issue: "missing", Impact: "media", Suggestion: "Sin margen no se puede definir CPA máximo sostenible."})
	}
	if ans.EfficiencyValue <= 0 {
		as = append(as, planentity.Assumption{Field: "efficiency_value", Issue: "missing", Impact: "alta", Suggestion: "Definir KPI objetivo (ROAS o CPA target) para juzgar resultados."})
	}
	if ans.HistoricalCPA <= 0 {
		as = append(as, planentity.Assumption{Field: "historical_cpa", Issue: "missing", Impact: "baja", Suggestion: "Sin histórico, los resultados de la primera ventana son referenciales."})
	}
	if ans.LandingURL == "" {
		as = append(as, planentity.Assumption{Field: "landing_url", Issue: "missing", Impact: "alta", Suggestion: "Definir URL de destino antes de publicar."})
	}
	return as
}
