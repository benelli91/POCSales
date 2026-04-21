package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"pocsales/internal/project/entity"
)

type Repo struct{ db *sql.DB }

func New(db *sql.DB) *Repo { return &Repo{db: db} }

func (r *Repo) List(ctx context.Context, orgID int64) ([]entity.Project, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, organization_id, name, COALESCE(industry,''), COALESCE(description,''), status, created_at, updated_at
		 FROM projects WHERE organization_id = ? ORDER BY created_at DESC`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []entity.Project
	for rows.Next() {
		var p entity.Project
		if err := rows.Scan(&p.ID, &p.OrganizationID, &p.Name, &p.Industry, &p.Description, &p.Status, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *Repo) GetByID(ctx context.Context, orgID, id int64) (*entity.Project, error) {
	var p entity.Project
	err := r.db.QueryRowContext(ctx,
		`SELECT id, organization_id, name, COALESCE(industry,''), COALESCE(description,''), status, created_at, updated_at
		 FROM projects WHERE id = ? AND organization_id = ?`, id, orgID).
		Scan(&p.ID, &p.OrganizationID, &p.Name, &p.Industry, &p.Description, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repo) Create(ctx context.Context, p *entity.Project) error {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO projects (organization_id, name, industry, description, status) VALUES (?, ?, ?, ?, ?)`,
		p.OrganizationID, p.Name, p.Industry, p.Description, p.Status)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	p.ID = id
	row := r.db.QueryRowContext(ctx, `SELECT created_at, updated_at FROM projects WHERE id = ?`, id)
	return row.Scan(&p.CreatedAt, &p.UpdatedAt)
}

func (r *Repo) UpdateStatus(ctx context.Context, id int64, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, status, id)
	return err
}

func (r *Repo) GetWizard(ctx context.Context, projectID int64) (*entity.WizardState, error) {
	var raw string
	st := &entity.WizardState{ProjectID: projectID}
	err := r.db.QueryRowContext(ctx,
		`SELECT answers_json, completeness_score, updated_at FROM wizard_answers WHERE project_id = ?`, projectID).
		Scan(&raw, &st.CompletenessScore, &st.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(raw), &st.Answers); err != nil {
		return nil, err
	}
	return st, nil
}

func (r *Repo) UpsertWizard(ctx context.Context, projectID int64, answers entity.WizardAnswers, score int) (*entity.WizardState, error) {
	raw, err := json.Marshal(answers)
	if err != nil {
		return nil, err
	}
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO wizard_answers (project_id, answers_json, completeness_score, updated_at)
		 VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(project_id) DO UPDATE SET
		   answers_json = excluded.answers_json,
		   completeness_score = excluded.completeness_score,
		   updated_at = CURRENT_TIMESTAMP`,
		projectID, string(raw), score)
	if err != nil {
		return nil, err
	}
	return r.GetWizard(ctx, projectID)
}
