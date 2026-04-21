package main

import (
	"log"
	nethttp "net/http"

	httpadapter "pocsales/internal/adapters/http"
	sqlitedb "pocsales/internal/adapters/persistence/sqlite"
	"pocsales/internal/config"
)

func main() {
	cfg := config.Load()
	log.Printf("pocsales: starting | port=%s db_path=%s static_dir=%q meta_api=%s/%s",
		cfg.Port, cfg.DBPath, cfg.StaticDir, cfg.MetaAPIBase, cfg.MetaAPIVersion)

	db, err := sqlitedb.Open(cfg.DBPath)
	if err != nil {
		log.Fatalf("pocsales: no pude abrir SQLite en %q: %v", cfg.DBPath, err)
	}
	defer db.Close()
	log.Printf("pocsales: SQLite ok, migraciones aplicadas (%s)", cfg.DBPath)

	srv := httpadapter.NewServer(httpadapter.Config{
		DB:             db,
		JWTSecret:      cfg.JWTSecret,
		StaticDir:      cfg.StaticDir,
		MetaAPIBase:    cfg.MetaAPIBase,
		MetaAPIVersion: cfg.MetaAPIVersion,
	})

	addr := "0.0.0.0:" + cfg.Port
	log.Printf("pocsales: HTTP listening on %s (healthcheck: /health)", addr)
	if err := nethttp.ListenAndServe(addr, srv.Routes()); err != nil {
		log.Fatalf("pocsales: listen: %v", err)
	}
}
