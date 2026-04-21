package repository

import (
	"context"

	"pocsales/internal/plan/entity"
)

// Repository persiste planes generados (versionados por proyecto).
type Repository interface {
	Create(ctx context.Context, projectID int64, gp *entity.GeneratedPlan) error
	GetLatest(ctx context.Context, projectID int64) (*entity.GeneratedPlan, error)
	List(ctx context.Context, projectID int64) ([]entity.GeneratedPlan, error)
	GetByID(ctx context.Context, id int64) (*entity.GeneratedPlan, error)
}
