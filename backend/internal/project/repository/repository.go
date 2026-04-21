package repository

import (
	"context"

	"pocsales/internal/project/entity"
)

// Repository define el puerto de persistencia para proyectos y wizard.
type Repository interface {
	// Project
	List(ctx context.Context, orgID int64) ([]entity.Project, error)
	GetByID(ctx context.Context, orgID, id int64) (*entity.Project, error)
	Create(ctx context.Context, p *entity.Project) error
	UpdateStatus(ctx context.Context, id int64, status string) error

	// Wizard answers (1:1 con project)
	GetWizard(ctx context.Context, projectID int64) (*entity.WizardState, error)
	UpsertWizard(ctx context.Context, projectID int64, answers entity.WizardAnswers, score int) (*entity.WizardState, error)
}
