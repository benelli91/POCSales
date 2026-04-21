package usecase

import (
	"context"

	"pocsales/internal/user/entity"
)

// AuthUseCase define las operaciones de autenticación expuestas a otros paquetes (middleware).
type AuthUseCase interface {
	ValidateToken(ctx context.Context, token string) (*entity.User, error)
}
