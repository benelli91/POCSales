package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	metaclient "pocsales/internal/meta/client"
	metaentity "pocsales/internal/meta/entity"
	metarepo "pocsales/internal/meta/repository"
	metasqlite "pocsales/internal/meta/repository/sqlite"
	plansvc "pocsales/internal/plan/service"
	projsvc "pocsales/internal/project/service"
)

// Service agrupa credenciales Meta + creación de campañas (Fase 4 light: action asistida).
type Service struct {
	repo   metarepo.Repository
	client *metaclient.Client
	projs  *projsvc.Service
	plans  *plansvc.Service
}

func NewService(db *sql.DB, projs *projsvc.Service, plans *plansvc.Service, baseURL, version string) *Service {
	return &Service{
		repo:   metasqlite.New(db),
		client: metaclient.NewClient(baseURL, version),
		projs:  projs,
		plans:  plans,
	}
}

func (s *Service) GetCredentials(ctx context.Context, orgID int64) (*metaentity.Credentials, error) {
	c, err := s.repo.GetCredentials(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return &metaentity.Credentials{OrganizationID: orgID}, nil
	}
	return c, nil
}

func (s *Service) SaveCredentials(ctx context.Context, orgID int64, accessToken, adAccountID string) (*metaentity.Credentials, error) {
	accessToken = strings.TrimSpace(accessToken)
	adAccountID = strings.TrimPrefix(strings.TrimSpace(adAccountID), "act_")
	if accessToken == "" || adAccountID == "" {
		return nil, errors.New("access_token y ad_account_id son obligatorios")
	}
	return s.repo.UpsertCredentials(ctx, orgID, accessToken, adAccountID)
}

// CreateCampaign crea la campaña en Meta (estado PAUSED) y la guarda localmente.
// Si plan está disponible, usa el plan más reciente para nombre/budget.
func (s *Service) CreateCampaign(ctx context.Context, orgID, projectID int64, customName string) (*metaentity.Campaign, error) {
	project, err := s.projs.Get(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("proyecto no encontrado")
	}
	creds, err := s.repo.GetCredentials(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if creds == nil || creds.AccessToken == "" || creds.AdAccountID == "" {
		return nil, errors.New("credenciales Meta no configuradas")
	}
	plan, err := s.plans.GetLatest(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return nil, errors.New("primero generá un plan para este proyecto")
	}

	objective := mapObjective(plan.Plan.Objective)
	name := strings.TrimSpace(customName)
	if name == "" {
		name = fmt.Sprintf("[POC] %s - v%d", project.Name, plan.Version)
	}
	dailyCents := int64(plan.Plan.Budget.DailyBudget * 100)

	res, err := s.client.CreateCampaign(ctx, metaclient.CreateCampaignParams{
		AdAccountID:         creds.AdAccountID,
		AccessToken:         creds.AccessToken,
		Name:                name,
		Objective:           objective,
		Status:              "PAUSED",
		SpecialAdCategories: []string{},
		DailyBudgetCents:    dailyCents,
	})
	if err != nil {
		return nil, err
	}

	planID := plan.ID
	camp := &metaentity.Campaign{
		ProjectID:        projectID,
		PlanID:           &planID,
		MetaCampaignID:   res.ID,
		Name:             name,
		Objective:        objective,
		Status:           "PAUSED",
		DailyBudgetCents: dailyCents,
		RawResponse:      res.Raw,
	}
	if err := s.repo.CreateCampaign(ctx, camp); err != nil {
		return nil, err
	}
	if err := s.projs.UpdateStatus(ctx, projectID, "published"); err != nil {
		return nil, err
	}
	return camp, nil
}

func (s *Service) ListCampaigns(ctx context.Context, orgID, projectID int64) ([]metaentity.Campaign, error) {
	project, err := s.projs.Get(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("proyecto no encontrado")
	}
	return s.repo.ListCampaigns(ctx, projectID)
}

// mapObjective traduce el objetivo del wizard al objetivo ODAX de Meta.
func mapObjective(wizardObjective string) string {
	switch strings.ToLower(strings.TrimSpace(wizardObjective)) {
	case "leads":
		return "OUTCOME_LEADS"
	case "trafico":
		return "OUTCOME_TRAFFIC"
	default:
		return "OUTCOME_SALES"
	}
}
