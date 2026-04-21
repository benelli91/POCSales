package repository

import (
	"context"

	"pocsales/internal/user/entity"
)

// Repository define el puerto de persistencia para usuarios y organizaciones.
type Repository interface {
	CreateOrganization(ctx context.Context, name string) (*entity.Organization, error)
	GetOrganization(ctx context.Context, id int64) (*entity.Organization, error)

	CreateUser(ctx context.Context, orgID int64, email, passwordHash, name, role string) (*entity.User, error)
	GetUserByEmail(ctx context.Context, email string) (*entity.User, string, error) // user, password_hash, error
	GetUserByID(ctx context.Context, id int64) (*entity.User, error)
}
