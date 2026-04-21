package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"pocsales/internal/plan/entity"
)

type Repo struct{ db *sql.DB }

func New(db *sql.DB) *Repo { return &Repo{db: db} }

func (r *Repo) Create(ctx context.Context, projectID int64, gp *entity.GeneratedPlan) error {
	planJSON, err := json.Marshal(gp.Plan)
	if err != nil {
		return err
	}
	briefJSON, err := json.Marshal(gp.Brief)
	if err != nil {
		return err
	}
	assJSON, err := json.Marshal(gp.Assumptions)
	if err != nil {
		return err
	}
	var nextVersion int
	if err := r.db.QueryRowContext(ctx,
		`SELECT COALESCE(MAX(version), 0) + 1 FROM generated_plans WHERE project_id = ?`, projectID).
		Scan(&nextVersion); err != nil {
		return err
	}
	gp.Version = nextVersion
	gp.ProjectID = projectID
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO generated_plans (project_id, version, plan_json, brief_json, assumptions_json)
		 VALUES (?, ?, ?, ?, ?)`,
		projectID, nextVersion, string(planJSON), string(briefJSON), string(assJSON))
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	gp.ID = id
	row := r.db.QueryRowContext(ctx, `SELECT created_at FROM generated_plans WHERE id = ?`, id)
	return row.Scan(&gp.CreatedAt)
}

func (r *Repo) GetLatest(ctx context.Context, projectID int64) (*entity.GeneratedPlan, error) {
	var (
		gp                                      entity.GeneratedPlan
		planJSON, briefJSON, assJSON            string
	)
	err := r.db.QueryRowContext(ctx,
		`SELECT id, project_id, version, plan_json, brief_json, assumptions_json, created_at
		 FROM generated_plans WHERE project_id = ? ORDER BY version DESC LIMIT 1`, projectID).
		Scan(&gp.ID, &gp.ProjectID, &gp.Version, &planJSON, &briefJSON, &assJSON, &gp.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(planJSON), &gp.Plan); err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(briefJSON), &gp.Brief); err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(assJSON), &gp.Assumptions); err != nil {
		return nil, err
	}
	return &gp, nil
}

func (r *Repo) List(ctx context.Context, projectID int64) ([]entity.GeneratedPlan, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, project_id, version, plan_json, brief_json, assumptions_json, created_at
		 FROM generated_plans WHERE project_id = ? ORDER BY version DESC`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []entity.GeneratedPlan
	for rows.Next() {
		var (
			gp                           entity.GeneratedPlan
			planJSON, briefJSON, assJSON string
		)
		if err := rows.Scan(&gp.ID, &gp.ProjectID, &gp.Version, &planJSON, &briefJSON, &assJSON, &gp.CreatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(planJSON), &gp.Plan)
		_ = json.Unmarshal([]byte(briefJSON), &gp.Brief)
		_ = json.Unmarshal([]byte(assJSON), &gp.Assumptions)
		list = append(list, gp)
	}
	return list, rows.Err()
}

func (r *Repo) GetByID(ctx context.Context, id int64) (*entity.GeneratedPlan, error) {
	var (
		gp                           entity.GeneratedPlan
		planJSON, briefJSON, assJSON string
	)
	err := r.db.QueryRowContext(ctx,
		`SELECT id, project_id, version, plan_json, brief_json, assumptions_json, created_at
		 FROM generated_plans WHERE id = ?`, id).
		Scan(&gp.ID, &gp.ProjectID, &gp.Version, &planJSON, &briefJSON, &assJSON, &gp.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(planJSON), &gp.Plan)
	_ = json.Unmarshal([]byte(briefJSON), &gp.Brief)
	_ = json.Unmarshal([]byte(assJSON), &gp.Assumptions)
	return &gp, nil
}
