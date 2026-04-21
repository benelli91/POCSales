package entity

import "time"

// Project agrupa el negocio/cliente sobre el cual se trabaja la estrategia.
type Project struct {
	ID             int64     `json:"id"`
	OrganizationID int64     `json:"organization_id"`
	Name           string    `json:"name"`
	Industry       string    `json:"industry,omitempty"`
	Description    string    `json:"description,omitempty"`
	Status         string    `json:"status"` // draft|wizard|generated|published
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// WizardAnswers es el contenido estructurado del wizard (Fase 1 del plan).
// Cada campo es opcional para permitir guardado incremental; la validación
// se aplica al momento de generar el plan.
type WizardAnswers struct {
	// Objetivo
	Objective       string  `json:"objective,omitempty"`        // ventas|leads|trafico
	EfficiencyKPI   string  `json:"efficiency_kpi,omitempty"`   // roas|cpa|cpc
	EfficiencyValue float64 `json:"efficiency_value,omitempty"` // ej. ROAS objetivo 3.0 o CPA 25 USD

	// Producto / oferta
	ProductName    string  `json:"product_name,omitempty"`
	AverageTicket  float64 `json:"average_ticket,omitempty"`
	MarginPct      float64 `json:"margin_pct,omitempty"` // % de margen sobre ticket
	BundlesUpsells string  `json:"bundles_upsells,omitempty"`

	// Público / data
	Audience          string `json:"audience,omitempty"`
	HasCustomerData   bool   `json:"has_customer_data,omitempty"`
	CustomerDataNotes string `json:"customer_data_notes,omitempty"`

	// Creativos
	CreativeTypes  []string `json:"creative_types,omitempty"` // UGC, producto, testimonio, oferta
	CreativeHooks  string   `json:"creative_hooks,omitempty"`
	WorkedBefore   string   `json:"worked_before,omitempty"`

	// Destino
	LandingType       string  `json:"landing_type,omitempty"` // home|pdp|landing|app
	LandingURL        string  `json:"landing_url,omitempty"`
	EstimatedConvRate float64 `json:"estimated_conv_rate,omitempty"`

	// Tracking
	HasPixel        bool   `json:"has_pixel,omitempty"`
	HasCAPI         bool   `json:"has_capi,omitempty"`
	KeyEvents       string `json:"key_events,omitempty"`
	TrackingQuality string `json:"tracking_quality,omitempty"` // baja|media|alta

	// Historial
	History       string  `json:"history,omitempty"`
	HistoricalCPA float64 `json:"historical_cpa,omitempty"`

	// Presupuesto
	DailyBudget   float64 `json:"daily_budget,omitempty"`
	TestWindowDays int    `json:"test_window_days,omitempty"`

	// Notas libres
	Notes string `json:"notes,omitempty"`
}

// WizardState representa el estado del wizard guardado para un proyecto.
type WizardState struct {
	ProjectID          int64         `json:"project_id"`
	Answers            WizardAnswers `json:"answers"`
	CompletenessScore  int           `json:"completeness_score"` // 0-100
	UpdatedAt          time.Time     `json:"updated_at"`
}
