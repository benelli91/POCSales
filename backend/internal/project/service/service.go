package service

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"pocsales/internal/project/entity"
	"pocsales/internal/project/repository"
	projsqlite "pocsales/internal/project/repository/sqlite"
)

type Service struct {
	repo repository.Repository
}

func NewService(db *sql.DB) *Service {
	return &Service{repo: projsqlite.New(db)}
}

func (s *Service) List(ctx context.Context, orgID int64) ([]entity.Project, error) {
	return s.repo.List(ctx, orgID)
}

func (s *Service) Get(ctx context.Context, orgID, id int64) (*entity.Project, error) {
	return s.repo.GetByID(ctx, orgID, id)
}

// Create da de alta el proyecto en estado "wizard" (lo lleva a llenar el cuestionario).
func (s *Service) Create(ctx context.Context, orgID int64, name, industry, description string) (*entity.Project, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("nombre del proyecto requerido")
	}
	p := &entity.Project{
		OrganizationID: orgID,
		Name:           name,
		Industry:       strings.TrimSpace(industry),
		Description:    strings.TrimSpace(description),
		Status:         "wizard",
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	if _, err := s.repo.UpsertWizard(ctx, p.ID, entity.WizardAnswers{}, 0); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) GetWizard(ctx context.Context, orgID, projectID int64) (*entity.WizardState, error) {
	p, err := s.repo.GetByID(ctx, orgID, projectID)
	if err != nil || p == nil {
		return nil, err
	}
	st, err := s.repo.GetWizard(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if st == nil {
		return s.repo.UpsertWizard(ctx, projectID, entity.WizardAnswers{}, 0)
	}
	return st, nil
}

func (s *Service) SaveWizard(ctx context.Context, orgID, projectID int64, answers entity.WizardAnswers) (*entity.WizardState, error) {
	p, err := s.repo.GetByID(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, errors.New("proyecto no encontrado")
	}
	score := computeCompleteness(answers)
	return s.repo.UpsertWizard(ctx, projectID, answers, score)
}

func (s *Service) UpdateStatus(ctx context.Context, projectID int64, status string) error {
	return s.repo.UpdateStatus(ctx, projectID, status)
}

// computeCompleteness calcula un porcentaje 0-100 según campos clave completos.
// Refleja el "score de completitud del perfil" mencionado en el plan (Fase 1).
func computeCompleteness(a entity.WizardAnswers) int {
	checks := []bool{
		a.Objective != "",
		a.EfficiencyKPI != "" && a.EfficiencyValue > 0,
		a.ProductName != "" && a.AverageTicket > 0,
		a.MarginPct > 0,
		a.Audience != "",
		len(a.CreativeTypes) > 0 && a.CreativeHooks != "",
		a.LandingURL != "",
		a.HasPixel || a.HasCAPI,
		a.DailyBudget > 0 && a.TestWindowDays > 0,
	}
	total := len(checks)
	done := 0
	for _, ok := range checks {
		if ok {
			done++
		}
	}
	return int(float64(done) / float64(total) * 100)
}
