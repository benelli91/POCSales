package main

import (
	"context"
	"log"

	sqlitedb "pocsales/internal/adapters/persistence/sqlite"
	"pocsales/internal/config"
	usersvc "pocsales/internal/user/service"
)

// seed crea (de forma idempotente) una organización demo y un usuario admin.
func main() {
	cfg := config.Load()

	db, err := sqlitedb.Open(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	auth := usersvc.NewAuthService(db, cfg.JWTSecret)
	ctx := context.Background()

	const (
		orgName  = "Demo Org"
		email    = "demo@pocsales.local"
		password = "demo1234"
		name     = "Demo Admin"
	)

	created, err := auth.SeedOrgAndAdmin(ctx, orgName, email, password, name)
	if err != nil {
		log.Fatalf("seed: %v", err)
	}
	if created {
		log.Printf("seed: creada organización %q y usuario %q (password=%q)", orgName, email, password)
	} else {
		log.Printf("seed: usuario %q ya existía, no se creó nada nuevo", email)
	}
}
