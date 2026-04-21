package http

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"pocsales/internal/pkg/authcontext"
	"pocsales/internal/pkg/httputil"
	"pocsales/internal/plan/service"
)

type Handler struct {
	svc *service.Service
}

func NewHandler(svc *service.Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Generate(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	gp, err := h.svc.Generate(r.Context(), u.OrganizationID, id)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, gp)
}

func (h *Handler) Latest(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	gp, err := h.svc.GetLatest(r.Context(), u.OrganizationID, id)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	if gp == nil {
		http.NotFound(w, r)
		return
	}
	httputil.RespondJSON(w, gp)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	list, err := h.svc.List(r.Context(), u.OrganizationID, id)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, map[string]interface{}{"items": list})
}

// RegisterAuthed registra rutas autenticadas del módulo plan.
func RegisterAuthed(r chi.Router, h *Handler) {
	r.Post("/projects/{id}/plan", h.Generate)
	r.Get("/projects/{id}/plan", h.Latest)
	r.Get("/projects/{id}/plans", h.List)
}
