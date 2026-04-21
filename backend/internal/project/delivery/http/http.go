package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"pocsales/internal/pkg/authcontext"
	"pocsales/internal/pkg/httputil"
	"pocsales/internal/project/entity"
	"pocsales/internal/project/service"
)

type Handler struct {
	svc *service.Service
}

func NewHandler(svc *service.Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	list, err := h.svc.List(r.Context(), u.OrganizationID)
	if err != nil {
		httputil.RespondMsg(w, http.StatusInternalServerError, err.Error())
		return
	}
	httputil.RespondJSON(w, map[string]interface{}{"items": list})
}

type createBody struct {
	Name        string `json:"name"`
	Industry    string `json:"industry"`
	Description string `json:"description"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	var body createBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	p, err := h.svc.Create(r.Context(), u.OrganizationID, body.Name, body.Industry, body.Description)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, p)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	p, err := h.svc.Get(r.Context(), u.OrganizationID, id)
	if err != nil {
		httputil.RespondMsg(w, http.StatusInternalServerError, err.Error())
		return
	}
	if p == nil {
		http.NotFound(w, r)
		return
	}
	httputil.RespondJSON(w, p)
}

func (h *Handler) GetWizard(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	st, err := h.svc.GetWizard(r.Context(), u.OrganizationID, id)
	if err != nil {
		httputil.RespondMsg(w, http.StatusInternalServerError, err.Error())
		return
	}
	if st == nil {
		http.NotFound(w, r)
		return
	}
	httputil.RespondJSON(w, st)
}

func (h *Handler) SaveWizard(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var body struct {
		Answers entity.WizardAnswers `json:"answers"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	st, err := h.svc.SaveWizard(r.Context(), u.OrganizationID, id, body.Answers)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, st)
}

// RegisterAuthed registra rutas autenticadas del módulo project.
func RegisterAuthed(r chi.Router, h *Handler) {
	r.Get("/projects", h.List)
	r.Post("/projects", h.Create)
	r.Get("/projects/{id}", h.Get)
	r.Get("/projects/{id}/wizard", h.GetWizard)
	r.Put("/projects/{id}/wizard", h.SaveWizard)
}
