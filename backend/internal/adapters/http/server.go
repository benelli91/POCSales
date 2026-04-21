package http

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	metahttp "pocsales/internal/meta/delivery/http"
	metasvc "pocsales/internal/meta/service"
	planhttp "pocsales/internal/plan/delivery/http"
	plansvc "pocsales/internal/plan/service"
	projhttp "pocsales/internal/project/delivery/http"
	projsvc "pocsales/internal/project/service"
	userhttp "pocsales/internal/user/delivery/http"
	usersvc "pocsales/internal/user/service"
)

// Config configuración para construir el Server.
type Config struct {
	DB             *sql.DB
	JWTSecret      string
	StaticDir      string
	MetaAPIBase    string
	MetaAPIVersion string
	LLMEnabled     bool
	LLMProvider    string
	LLMAPIKey      string
	LLMBaseURL     string
	LLMModel       string
}

type Server struct {
	User           *userhttp.Handler
	Project        *projhttp.Handler
	Plan           *planhttp.Handler
	Meta           *metahttp.Handler
	AuthMiddleware func(http.Handler) http.Handler
	StaticDir      string
}

// NewServer arma todos los services y handlers con composición/wiring.
func NewServer(cfg Config) *Server {
	authSvc := usersvc.NewAuthService(cfg.DB, cfg.JWTSecret)
	projectSvc := projsvc.NewService(cfg.DB)
	planSvc := plansvc.NewService(cfg.DB, projectSvc, plansvc.Options{
		LLMEnabled: cfg.LLMEnabled,
		Provider:   cfg.LLMProvider,
		LLMAPIKey:  cfg.LLMAPIKey,
		LLMBaseURL: cfg.LLMBaseURL,
		LLMModel:   cfg.LLMModel,
	})
	metaSvc := metasvc.NewService(cfg.DB, projectSvc, planSvc, cfg.MetaAPIBase, cfg.MetaAPIVersion)

	return &Server{
		User:           userhttp.NewHandler(authSvc),
		Project:        projhttp.NewHandler(projectSvc),
		Plan:           planhttp.NewHandler(planSvc),
		Meta:           metahttp.NewHandler(metaSvc),
		AuthMiddleware: AuthMiddleware(authSvc),
		StaticDir:      cfg.StaticDir,
	}
}

func (s *Server) Routes() http.Handler {
	r := chi.NewRouter()
	r.Use(CORS)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api", func(r chi.Router) {
		// Públicas
		userhttp.RegisterPublic(r, s.User)

		// Autenticadas
		r.Group(func(r chi.Router) {
			r.Use(s.AuthMiddleware)
			userhttp.RegisterAuthed(r, s.User)
			projhttp.RegisterAuthed(r, s.Project)
			planhttp.RegisterAuthed(r, s.Plan)
			metahttp.RegisterAuthed(r, s.Meta)
		})
	})

	// Servir frontend estático (build de Vite) cuando STATIC_DIR está configurado.
	// Permite deploy single-service en Railway / fly.io / etc.
	if s.StaticDir != "" {
		dir := filepath.Clean(s.StaticDir)
		if info, err := os.Stat(dir); err == nil && info.IsDir() {
			r.Get("/*", spaFileServer(dir))
		}
	}

	return r
}

// spaFileServer sirve archivos estáticos y hace fallback a index.html para rutas SPA.
func spaFileServer(root string) http.HandlerFunc {
	fs := http.FileServer(http.Dir(root))
	return func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(root, r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(root, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	}
}
