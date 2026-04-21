package http

import (
	"net/http"
	"strings"

	"pocsales/internal/pkg/authcontext"
	userusecase "pocsales/internal/user/usecase"
)

// AuthMiddleware exige Authorization: Bearer <jwt>.
func AuthMiddleware(auth userusecase.AuthUseCase) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			if h == "" || !strings.HasPrefix(h, "Bearer ") {
				http.Error(w, "no autorizado", http.StatusUnauthorized)
				return
			}
			token := strings.TrimPrefix(h, "Bearer ")
			user, err := auth.ValidateToken(r.Context(), token)
			if err != nil || user == nil {
				http.Error(w, "token inválido", http.StatusUnauthorized)
				return
			}
			ctx := authcontext.SetUser(r.Context(), user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// CORS abierto (POC).
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
