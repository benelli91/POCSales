package service

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"pocsales/internal/user/entity"
	"pocsales/internal/user/repository"
	usersqlite "pocsales/internal/user/repository/sqlite"
)

// AuthService maneja registro, login y validación de tokens JWT.
type AuthService struct {
	repo   repository.Repository
	secret []byte
}

func NewAuthService(db *sql.DB, secret string) *AuthService {
	return &AuthService{
		repo:   usersqlite.New(db),
		secret: []byte(secret),
	}
}

// Register crea organización + usuario inicial (rol owner) en una sola operación.
func (s *AuthService) Register(ctx context.Context, orgName, email, password, name string) (*entity.User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" || orgName == "" {
		return nil, "", errors.New("orgName, email y password son obligatorios")
	}
	existing, _, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, "", err
	}
	if existing != nil {
		return nil, "", errors.New("ya existe un usuario con ese email")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}
	org, err := s.repo.CreateOrganization(ctx, orgName)
	if err != nil {
		return nil, "", err
	}
	u, err := s.repo.CreateUser(ctx, org.ID, email, string(hash), name, "owner")
	if err != nil {
		return nil, "", err
	}
	tok, err := s.issueToken(u)
	return u, tok, err
}

// Login valida credenciales y devuelve user + token.
func (s *AuthService) Login(ctx context.Context, email, password string) (*entity.User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	u, hash, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, "", err
	}
	if u == nil {
		return nil, "", errors.New("credenciales inválidas")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return nil, "", errors.New("credenciales inválidas")
	}
	tok, err := s.issueToken(u)
	return u, tok, err
}

// ValidateToken implementa AuthUseCase.
func (s *AuthService) ValidateToken(ctx context.Context, tokenStr string) (*entity.User, error) {
	claims := jwt.MapClaims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de firma inesperado")
		}
		return s.secret, nil
	})
	if err != nil || !tok.Valid {
		return nil, errors.New("token inválido")
	}
	rawID, ok := claims["sub"]
	if !ok {
		return nil, errors.New("claim sub faltante")
	}
	var id int64
	switch v := rawID.(type) {
	case float64:
		id = int64(v)
	case int64:
		id = v
	default:
		return nil, errors.New("claim sub inválido")
	}
	return s.repo.GetUserByID(ctx, id)
}

// SeedOrgAndAdmin crea la organización y el admin de demo si el email no existe.
func (s *AuthService) SeedOrgAndAdmin(ctx context.Context, orgName, email, password, name string) (bool, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	existing, _, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return false, err
	}
	if existing != nil {
		return false, nil
	}
	if _, _, err := s.Register(ctx, orgName, email, password, name); err != nil {
		return false, err
	}
	return true, nil
}

func (s *AuthService) issueToken(u *entity.User) (string, error) {
	claims := jwt.MapClaims{
		"sub": u.ID,
		"org": u.OrganizationID,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString(s.secret)
}
