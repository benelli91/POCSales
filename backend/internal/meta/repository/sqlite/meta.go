package sqlite

import (
	"context"
	"database/sql"
	"errors"

	"pocsales/internal/meta/entity"
)

type Repo struct{ db *sql.DB }

func New(db *sql.DB) *Repo { return &Repo{db: db} }

func (r *Repo) GetCredentials(ctx context.Context, orgID int64) (*entity.Credentials, error) {
	var c entity.Credentials
	err := r.db.QueryRowContext(ctx,
		`SELECT organization_id, access_token, ad_account_id, updated_at
		 FROM meta_credentials WHERE organization_id = ?`, orgID).
		Scan(&c.OrganizationID, &c.AccessToken, &c.AdAccountID, &c.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	c.HasToken = c.AccessToken != ""
	return &c, nil
}

func (r *Repo) UpsertCredentials(ctx context.Context, orgID int64, accessToken, adAccountID string) (*entity.Credentials, error) {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO meta_credentials (organization_id, access_token, ad_account_id, updated_at)
		 VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(organization_id) DO UPDATE SET
		   access_token = excluded.access_token,
		   ad_account_id = excluded.ad_account_id,
		   updated_at = CURRENT_TIMESTAMP`,
		orgID, accessToken, adAccountID)
	if err != nil {
		return nil, err
	}
	return r.GetCredentials(ctx, orgID)
}

func (r *Repo) CreateCampaign(ctx context.Context, c *entity.Campaign) error {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO meta_campaigns (project_id, plan_id, meta_campaign_id, name, objective, status, daily_budget_cents, raw_response)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		c.ProjectID, c.PlanID, c.MetaCampaignID, c.Name, c.Objective, c.Status, c.DailyBudgetCents, c.RawResponse)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	c.ID = id
	return r.db.QueryRowContext(ctx, `SELECT created_at FROM meta_campaigns WHERE id = ?`, id).Scan(&c.CreatedAt)
}

func (r *Repo) ListCampaigns(ctx context.Context, projectID int64) ([]entity.Campaign, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, project_id, plan_id, meta_campaign_id, name, objective, status, daily_budget_cents, COALESCE(raw_response,''), created_at
		 FROM meta_campaigns WHERE project_id = ? ORDER BY created_at DESC`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []entity.Campaign
	for rows.Next() {
		var c entity.Campaign
		var planID sql.NullInt64
		if err := rows.Scan(&c.ID, &c.ProjectID, &planID, &c.MetaCampaignID, &c.Name, &c.Objective, &c.Status, &c.DailyBudgetCents, &c.RawResponse, &c.CreatedAt); err != nil {
			return nil, err
		}
		if planID.Valid {
			v := planID.Int64
			c.PlanID = &v
		}
		list = append(list, c)
	}
	return list, rows.Err()
}
