package authcontext

import (
	"context"

	"pocsales/internal/user/entity"
)

type contextKey string

// KeyUser es la clave de contexto donde el middleware de auth guarda el *entity.User.
const KeyUser contextKey = "user"

// SetUser guarda el usuario en el contexto. Solo debe usarse desde el middleware de auth.
func SetUser(ctx context.Context, u *entity.User) context.Context {
	return context.WithValue(ctx, KeyUser, u)
}

// GetUser devuelve el usuario del contexto (nil si no está autenticado).
func GetUser(ctx context.Context) *entity.User {
	u, _ := ctx.Value(KeyUser).(*entity.User)
	return u
}
