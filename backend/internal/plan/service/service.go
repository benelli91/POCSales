package service

import (
	"context"
	"database/sql"
	"errors"
	"log"

	planentity "pocsales/internal/plan/entity"
	planrepo "pocsales/internal/plan/repository"
	plansqlite "pocsales/internal/plan/repository/sqlite"
	projsvc "pocsales/internal/project/service"
)

// Service orquesta la generación y persistencia de planes/briefs versionados.
type Service struct {
	repo    planrepo.Repository
	projs   *projsvc.Service
	planner Planner
}

type Options struct {
	LLMEnabled bool
	Provider   string
	LLMAPIKey  string
	LLMBaseURL string
	LLMModel   string
}

func NewService(db *sql.DB, projs *projsvc.Service, opts Options) *Service {
	s := &Service{repo: plansqlite.New(db), projs: projs}
	if opts.LLMEnabled && opts.LLMAPIKey != "" {
		s.planner = NewLLMPlanner(LLMConfig{
			Enabled:  opts.LLMEnabled,
			Provider: opts.Provider,
			APIKey:   opts.LLMAPIKey,
			BaseURL:  opts.LLMBaseURL,
			Model:    opts.LLMModel,
		})
		log.Printf("plan: LLM planner habilitado (provider=%s model=%s)", opts.Provider, opts.LLMModel)
	}
	return s
}

// Generate genera un plan a partir del wizard y lo persiste como nueva versión.
func (s *Service) Generate(ctx context.Context, orgID, projectID int64) (*planentity.GeneratedPlan, error) {
	project, err := s.projs.Get(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("proyecto no encontrado")
	}
	st, err := s.projs.GetWizard(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if st == nil {
		return nil, errors.New("wizard no inicializado")
	}
	plan, brief, ass := Generate(project, st.Answers)
	planSource := "template"
	if s.planner != nil {
		llmPlan, llmBrief, llmAss, err := s.planner.Generate(ctx, project, st.Answers)
		if err != nil {
			log.Printf("plan: fallback a template por error LLM: %v", err)
			planSource = "llm_fallback"
		} else {
			plan, brief, ass = llmPlan, llmBrief, llmAss
			planSource = "llm"
		}
	}
	gp := &planentity.GeneratedPlan{
		PlanSource:  planSource,
		Plan:        plan,
		Brief:       brief,
		Assumptions: ass,
	}
	if err := s.repo.Create(ctx, projectID, gp); err != nil {
		return nil, err
	}
	if err := s.projs.UpdateStatus(ctx, projectID, "generated"); err != nil {
		return nil, err
	}
	return gp, nil
}

func (s *Service) GetLatest(ctx context.Context, orgID, projectID int64) (*planentity.GeneratedPlan, error) {
	project, err := s.projs.Get(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("proyecto no encontrado")
	}
	return s.repo.GetLatest(ctx, projectID)
}

func (s *Service) List(ctx context.Context, orgID, projectID int64) ([]planentity.GeneratedPlan, error) {
	project, err := s.projs.Get(ctx, orgID, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("proyecto no encontrado")
	}
	return s.repo.List(ctx, projectID)
}

func (s *Service) GetByID(ctx context.Context, id int64) (*planentity.GeneratedPlan, error) {
	return s.repo.GetByID(ctx, id)
}
