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

	db, err := sqlitedb.Open(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	srv := httpadapter.NewServer(httpadapter.Config{
		DB:             db,
		JWTSecret:      cfg.JWTSecret,
		StaticDir:      cfg.StaticDir,
		MetaAPIBase:    cfg.MetaAPIBase,
		MetaAPIVersion: cfg.MetaAPIVersion,
	})

	log.Printf("API escuchando en :%s", cfg.Port)
	if err := nethttp.ListenAndServe(":"+cfg.Port, srv.Routes()); err != nil {
		log.Fatal(err)
	}
}
