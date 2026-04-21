package config

import "os"

// Config agrupa la configuración de la aplicación (lectura desde env).
type Config struct {
	DBPath         string
	JWTSecret      string
	Port           string
	StaticDir      string
	MetaAPIBase    string
	MetaAPIVersion string
}

// Load lee la configuración desde variables de entorno y aplica valores por defecto.
func Load() Config {
	cfg := Config{
		DBPath:         os.Getenv("DB_PATH"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		Port:           os.Getenv("PORT"),
		StaticDir:      os.Getenv("STATIC_DIR"),
		MetaAPIBase:    os.Getenv("META_API_BASE"),
		MetaAPIVersion: os.Getenv("META_API_VERSION"),
	}
	if cfg.DBPath == "" {
		cfg.DBPath = "data.db"
	}
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "pocsales-secret-change-in-production"
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.MetaAPIBase == "" {
		cfg.MetaAPIBase = "https://graph.facebook.com"
	}
	if cfg.MetaAPIVersion == "" {
		cfg.MetaAPIVersion = "v19.0"
	}
	return cfg
}
