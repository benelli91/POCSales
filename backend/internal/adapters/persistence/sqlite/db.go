package sqlite

import (
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"sort"

	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Open abre (o crea) la base SQLite y aplica las migraciones embebidas.
func Open(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}
	if _, err := db.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		return nil, fmt.Errorf("pragma fk: %w", err)
	}
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("migrations: %w", err)
	}
	return db, nil
}

func runMigrations(db *sql.DB) error {
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)`); err != nil {
		return err
	}
	entries, err := fs.Glob(migrationsFS, "migrations/*.sql")
	if err != nil {
		return err
	}
	sort.Strings(entries)
	for _, name := range entries {
		var applied int
		if err := db.QueryRow(`SELECT 1 FROM _migrations WHERE name = ?`, name).Scan(&applied); err == nil {
			continue
		}
		data, err := fs.ReadFile(migrationsFS, name)
		if err != nil {
			return err
		}
		if _, err := db.Exec(string(data)); err != nil {
			return fmt.Errorf("%s: %w", name, err)
		}
		if _, err := db.Exec(`INSERT INTO _migrations (name) VALUES (?)`, name); err != nil {
			return fmt.Errorf("%s (record): %w", name, err)
		}
	}
	return nil
}
