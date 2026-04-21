package repository

import (
	"context"

	"pocsales/internal/meta/entity"
)

type Repository interface {
	GetCredentials(ctx context.Context, orgID int64) (*entity.Credentials, error)
	UpsertCredentials(ctx context.Context, orgID int64, accessToken, adAccountID string) (*entity.Credentials, error)

	CreateCampaign(ctx context.Context, c *entity.Campaign) error
	ListCampaigns(ctx context.Context, projectID int64) ([]entity.Campaign, error)
}
