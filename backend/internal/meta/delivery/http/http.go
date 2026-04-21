package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"pocsales/internal/pkg/authcontext"
	"pocsales/internal/pkg/httputil"
	"pocsales/internal/meta/service"
)

type Handler struct {
	svc *service.Service
}

func NewHandler(svc *service.Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) GetCredentials(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	c, err := h.svc.GetCredentials(r.Context(), u.OrganizationID)
	if err != nil {
		httputil.RespondMsg(w, http.StatusInternalServerError, err.Error())
		return
	}
	httputil.RespondJSON(w, c)
}

type credsBody struct {
	AccessToken string `json:"access_token"`
	AdAccountID string `json:"ad_account_id"`
}

func (h *Handler) SaveCredentials(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	var body credsBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	c, err := h.svc.SaveCredentials(r.Context(), u.OrganizationID, body.AccessToken, body.AdAccountID)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, c)
}

type createCampaignBody struct {
	Name string `json:"name"`
}

func (h *Handler) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var body createCampaignBody
	_ = json.NewDecoder(r.Body).Decode(&body)
	c, err := h.svc.CreateCampaign(r.Context(), u.OrganizationID, id, body.Name)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, c)
}

func (h *Handler) ListCampaigns(w http.ResponseWriter, r *http.Request) {
	u := authcontext.GetUser(r.Context())
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	list, err := h.svc.ListCampaigns(r.Context(), u.OrganizationID, id)
	if err != nil {
		httputil.RespondMsg(w, http.StatusBadRequest, err.Error())
		return
	}
	httputil.RespondJSON(w, map[string]interface{}{"items": list})
}

// RegisterAuthed registra rutas autenticadas del módulo meta.
func RegisterAuthed(r chi.Router, h *Handler) {
	r.Get("/meta/credentials", h.GetCredentials)
	r.Put("/meta/credentials", h.SaveCredentials)
	r.Post("/projects/{id}/meta/campaigns", h.CreateCampaign)
	r.Get("/projects/{id}/meta/campaigns", h.ListCampaigns)
}
