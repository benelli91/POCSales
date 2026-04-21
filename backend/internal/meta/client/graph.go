package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client envuelve llamadas a Meta Graph API (Marketing API).
type Client struct {
	base    string
	version string
	hc      *http.Client
}

// NewClient crea un cliente con base+version configurables (para tests).
func NewClient(base, version string) *Client {
	if base == "" {
		base = "https://graph.facebook.com"
	}
	if version == "" {
		version = "v19.0"
	}
	return &Client{
		base:    strings.TrimRight(base, "/"),
		version: version,
		hc:      &http.Client{Timeout: 15 * time.Second},
	}
}

// CreateCampaignParams contiene los parámetros mínimos para crear una campaña.
// Para esta POC creamos la campaña en estado PAUSED (no se publica nada vivo).
type CreateCampaignParams struct {
	AdAccountID         string   // sin "act_"; el cliente lo agrega
	AccessToken         string
	Name                string
	Objective           string   // OUTCOME_SALES / OUTCOME_LEADS / OUTCOME_TRAFFIC ...
	Status              string   // típicamente "PAUSED"
	SpecialAdCategories []string // p. ej. []
	DailyBudgetCents    int64    // opcional: budget a nivel campaign (CBO)
}

// CreateCampaignResult es la respuesta cruda de Meta + campos parseados.
type CreateCampaignResult struct {
	ID  string `json:"id"`
	Raw string `json:"-"`
}

// CreateCampaign llama a POST /{version}/act_{AD_ACCOUNT_ID}/campaigns.
//
// Doc: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group
func (c *Client) CreateCampaign(ctx context.Context, p CreateCampaignParams) (*CreateCampaignResult, error) {
	if p.AccessToken == "" {
		return nil, fmt.Errorf("access_token requerido")
	}
	if p.AdAccountID == "" {
		return nil, fmt.Errorf("ad_account_id requerido")
	}
	if p.Name == "" {
		return nil, fmt.Errorf("name requerido")
	}
	if p.Objective == "" {
		return nil, fmt.Errorf("objective requerido")
	}
	if p.Status == "" {
		p.Status = "PAUSED"
	}
	if p.SpecialAdCategories == nil {
		p.SpecialAdCategories = []string{}
	}

	endpoint := fmt.Sprintf("%s/%s/act_%s/campaigns", c.base, c.version, normalizeAdAccount(p.AdAccountID))

	form := url.Values{}
	form.Set("name", p.Name)
	form.Set("objective", p.Objective)
	form.Set("status", p.Status)
	cats, _ := json.Marshal(p.SpecialAdCategories)
	form.Set("special_ad_categories", string(cats))
	if p.DailyBudgetCents > 0 {
		form.Set("daily_budget", fmt.Sprintf("%d", p.DailyBudgetCents))
	}
	form.Set("access_token", p.AccessToken)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBufferString(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.hc.Do(req)
	if err != nil {
		return nil, fmt.Errorf("meta request: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("meta API %d: %s", resp.StatusCode, truncate(string(body), 1000))
	}
	var parsed struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("parse respuesta meta: %w", err)
	}
	return &CreateCampaignResult{ID: parsed.ID, Raw: string(body)}, nil
}

func normalizeAdAccount(id string) string {
	return strings.TrimPrefix(strings.TrimSpace(id), "act_")
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "...(truncated)"
}
