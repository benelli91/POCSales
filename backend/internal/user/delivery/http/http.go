package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"pocsales/internal/pkg/authcontext"
	"pocsales/internal/pkg/httputil"
	"pocsales/internal/user/service"
)

type Handler struct {
	auth *service.AuthService
}

func NewHandler(auth *service.AuthService) *Handler { return &Handler{auth: auth} }

type registerBody struct {
	OrganizationName string `json:"organization_name"`
	Email            string `json:"email"`
	Password         string `json:"password"`
	Name             string `json:"name"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var body registerBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	u, tok, err := h.auth.Register(r.Context(), body.OrganizationName, body.Email, body.Password, body.Name)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, map[string]interface{}{"token": tok, "user": u})
}

type loginBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var body loginBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	u, tok, err := h.auth.Login(r.Context(), body.Email, body.Password)
	if err != nil {
		httputil.RespondMsg(w, http.StatusUnauthorized, err.Error())
		return
	}
	httputil.RespondJSON(w, map[string]interface{}{"token": tok, "user": u})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	if u == nil {
		httputil.RespondMsg(w, http.StatusUnauthorized, "no autenticado")
		return
	}
	httputil.RespondJSON(w, u)
}

// RegisterPublic registra rutas públicas (sin auth).
func RegisterPublic(r chi.Router, h *Handler) {
	r.Post("/auth/register", h.Register)
	r.Post("/auth/login", h.Login)
}

// RegisterAuthed registra rutas autenticadas del módulo user.
func RegisterAuthed(r chi.Router, h *Handler) {
	r.Get("/me", h.Me)
}
