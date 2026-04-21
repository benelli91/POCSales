package entity

import "time"

// Plan = output estratégico estructurado y validado.
type Plan struct {
	Headline      string      `json:"headline"`
	Objective     string      `json:"objective"`
	StrategySteps []string    `json:"strategy_steps"`
	Audiences     []Audience  `json:"audiences"`
	Budget        BudgetPlan  `json:"budget"`
	Metrics       MetricGoals `json:"metrics"`
	Risks         []string    `json:"risks"`
}

type Audience struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Source      string `json:"source"` // interest|lookalike|retargeting|custom
}

type BudgetPlan struct {
	DailyBudget    float64 `json:"daily_budget"`
	TestWindowDays int     `json:"test_window_days"`
	TotalEstimated float64 `json:"total_estimated"`
}

type MetricGoals struct {
	KPI            string  `json:"kpi"`
	TargetValue    float64 `json:"target_value"`
	MaxSustainable float64 `json:"max_sustainable_cpa,omitempty"`
}

// CreativeBrief = output creativo estructurado.
type CreativeBrief struct {
	Hooks        []string         `json:"hooks"`
	Headlines    []string         `json:"headlines"`
	PrimaryTexts []string         `json:"primary_texts"`
	CTAs         []string         `json:"ctas"`
	Formats      []CreativeFormat `json:"formats"`
	DoNotMention []string         `json:"do_not_mention,omitempty"`
}

type CreativeFormat struct {
	Type        string `json:"type"` // image|video|carousel|ugc
	Description string `json:"description"`
}

// Assumption = supuesto declarado del que depende el plan (trazabilidad).
type Assumption struct {
	Field      string `json:"field"`
	Issue      string `json:"issue"`  // missing|weak|inferred
	Impact     string `json:"impact"` // baja|media|alta
	Suggestion string `json:"suggestion"`
}

// GeneratedPlan agrupa todo lo persistido (versión + timestamps).
type GeneratedPlan struct {
	ID          int64         `json:"id"`
	ProjectID   int64         `json:"project_id"`
	Version     int           `json:"version"`
	PlanSource  string        `json:"plan_source"` // llm | template | llm_fallback
	Plan        Plan          `json:"plan"`
	Brief       CreativeBrief `json:"brief"`
	Assumptions []Assumption  `json:"assumptions"`
	CreatedAt   time.Time     `json:"created_at"`
}
