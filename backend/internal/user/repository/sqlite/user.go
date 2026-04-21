package sqlite

import (
	"context"
	"database/sql"
	"errors"

	"pocsales/internal/user/entity"
)

type Repo struct{ db *sql.DB }

func New(db *sql.DB) *Repo { return &Repo{db: db} }

func (r *Repo) CreateOrganization(ctx context.Context, name string) (*entity.Organization, error) {
	res, err := r.db.ExecContext(ctx, `INSERT INTO organizations (name) VALUES (?)`, name)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return r.GetOrganization(ctx, id)
}

func (r *Repo) GetOrganization(ctx context.Context, id int64) (*entity.Organization, error) {
	var o entity.Organization
	err := r.db.QueryRowContext(ctx,
		`SELECT id, name, created_at FROM organizations WHERE id = ?`, id).
		Scan(&o.ID, &o.Name, &o.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) CreateUser(ctx context.Context, orgID int64, email, passwordHash, name, role string) (*entity.User, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO users (organization_id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
		orgID, email, passwordHash, name, role)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return r.GetUserByID(ctx, id)
}

func (r *Repo) GetUserByEmail(ctx context.Context, email string) (*entity.User, string, error) {
	var u entity.User
	var hash string
	err := r.db.QueryRowContext(ctx,
		`SELECT id, organization_id, email, COALESCE(name, ''), role, created_at, password_hash
		 FROM users WHERE email = ?`, email).
		Scan(&u.ID, &u.OrganizationID, &u.Email, &u.Name, &u.Role, &u.CreatedAt, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, "", nil
	}
	if err != nil {
		return nil, "", err
	}
	return &u, hash, nil
}

func (r *Repo) GetUserByID(ctx context.Context, id int64) (*entity.User, error) {
	var u entity.User
	err := r.db.QueryRowContext(ctx,
		`SELECT id, organization_id, email, COALESCE(name, ''), role, created_at
		 FROM users WHERE id = ?`, id).
		Scan(&u.ID, &u.OrganizationID, &u.Email, &u.Name, &u.Role, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}
