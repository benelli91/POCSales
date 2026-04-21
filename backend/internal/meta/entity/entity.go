package entity

import "time"

// Credentials almacena el token y ad account de la organización para Meta.
// IMPORTANTE: la POC guarda el token en SQLite en claro. En producción usar
// secret manager y no exponer nunca el token al frontend.
type Credentials struct {
	OrganizationID int64     `json:"organization_id"`
	AccessToken    string    `json:"-"`
	AdAccountID    string    `json:"ad_account_id"`
	HasToken       bool      `json:"has_token"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Campaign representa una campaña creada en Meta (mirror local mínimo).
type Campaign struct {
	ID               int64     `json:"id"`
	ProjectID        int64     `json:"project_id"`
	PlanID           *int64    `json:"plan_id,omitempty"`
	MetaCampaignID   string    `json:"meta_campaign_id"`
	Name             string    `json:"name"`
	Objective        string    `json:"objective"`
	Status           string    `json:"status"`
	DailyBudgetCents int64     `json:"daily_budget_cents"`
	RawResponse      string    `json:"raw_response,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
}
