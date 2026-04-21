package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	planentity "pocsales/internal/plan/entity"
	projentity "pocsales/internal/project/entity"
)

type Planner interface {
	Generate(ctx context.Context, project *projentity.Project, answers projentity.WizardAnswers) (planentity.Plan, planentity.CreativeBrief, []planentity.Assumption, error)
}

type LLMConfig struct {
	Enabled  bool
	Provider string
	APIKey   string
	BaseURL  string
	Model    string
}

type LLMPlanner struct {
	cfg    LLMConfig
	client *http.Client
}

func NewLLMPlanner(cfg LLMConfig) *LLMPlanner {
	return &LLMPlanner{
		cfg:    cfg,
		client: &http.Client{},
	}
}

type chatReq struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResp struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type plannerOutput struct {
	Plan        planentity.Plan          `json:"plan"`
	Brief       planentity.CreativeBrief `json:"brief"`
	Assumptions []planentity.Assumption  `json:"assumptions"`
}

func (p *LLMPlanner) Generate(ctx context.Context, project *projentity.Project, answers projentity.WizardAnswers) (planentity.Plan, planentity.CreativeBrief, []planentity.Assumption, error) {
	if !p.cfg.Enabled || p.cfg.APIKey == "" {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, errors.New("llm deshabilitado o sin api key")
	}

	payload := map[string]interface{}{
		"project": map[string]interface{}{
			"name":        project.Name,
			"industry":    project.Industry,
			"description": project.Description,
		},
		"answers": answers,
	}
	rawInput, _ := json.Marshal(payload)

	reqBody := chatReq{
		Model: p.cfg.Model,
		Messages: []chatMessage{
			{
				Role: "system",
				Content: "Sos un planner de performance marketing senior enfocado en Meta Ads. Respondé SIEMPRE JSON válido sin markdown ni texto extra. " +
					"Debés devolver exactamente {plan, brief, assumptions}. " +
					"No inventes métricas imposibles: si falta info, usá supuestos explícitos y realistas.",
			},
			{
				Role: "user",
				Content: "Construí un plan y brief optimizado para conversión con estos datos:\n" + string(rawInput) + "\n" +
					"Estructura estricta de salida:\n" +
					"{\"plan\":{\"headline\":\"\",\"objective\":\"\",\"strategy_steps\":[],\"audiences\":[{\"name\":\"\",\"description\":\"\",\"source\":\"\"}],\"budget\":{\"daily_budget\":0,\"test_window_days\":0,\"total_estimated\":0},\"metrics\":{\"kpi\":\"\",\"target_value\":0,\"max_sustainable_cpa\":0},\"risks\":[]},\"brief\":{\"hooks\":[],\"headlines\":[],\"primary_texts\":[],\"ctas\":[],\"formats\":[{\"type\":\"\",\"description\":\"\"}],\"do_not_mention\":[]},\"assumptions\":[{\"field\":\"\",\"issue\":\"\",\"impact\":\"\",\"suggestion\":\"\"}]}",
			},
		},
		Temperature: 0.3,
	}

	bodyJSON, _ := json.Marshal(reqBody)
	u := strings.TrimRight(p.cfg.BaseURL, "/") + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(bodyJSON))
	if err != nil {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.cfg.APIKey)

	res, err := p.client.Do(req)
	if err != nil {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, err
	}
	defer res.Body.Close()

	b, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, fmt.Errorf("llm http %d: %s", res.StatusCode, string(b))
	}

	var parsed chatResp
	if err := json.Unmarshal(b, &parsed); err != nil {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, fmt.Errorf("llm respuesta inválida: %w", err)
	}
	if parsed.Error != nil {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, errors.New(parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, errors.New("llm sin choices")
	}

	content := strings.TrimSpace(parsed.Choices[0].Message.Content)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	var out plannerOutput
	if err := json.Unmarshal([]byte(content), &out); err != nil {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, fmt.Errorf("llm json parse error: %w", err)
	}

	if out.Plan.Headline == "" || len(out.Plan.StrategySteps) == 0 || len(out.Brief.Hooks) == 0 {
		return planentity.Plan{}, planentity.CreativeBrief{}, nil, errors.New("llm devolvió estructura incompleta")
	}

	return out.Plan, out.Brief, out.Assumptions, nil
}
