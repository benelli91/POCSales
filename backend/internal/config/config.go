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
	LLMEnabled     bool
	LLMProvider    string
	LLMAPIKey      string
	LLMBaseURL     string
	LLMModel       string
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
		LLMEnabled:     os.Getenv("LLM_ENABLED") == "1" || os.Getenv("LLM_ENABLED") == "true",
		LLMProvider:    os.Getenv("LLM_PROVIDER"),
		LLMAPIKey:      os.Getenv("LLM_API_KEY"),
		LLMBaseURL:     os.Getenv("LLM_BASE_URL"),
		LLMModel:       os.Getenv("LLM_MODEL"),
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
	if cfg.LLMProvider == "" {
		cfg.LLMProvider = "openai"
	}
	if cfg.LLMBaseURL == "" {
		if cfg.LLMProvider == "minimax" {
			cfg.LLMBaseURL = "https://api.minimax.chat/v1"
		} else {
			cfg.LLMBaseURL = "https://api.openai.com/v1"
		}
	}
	if cfg.LLMModel == "" {
		if cfg.LLMProvider == "minimax" {
			cfg.LLMModel = "MiniMax-Text-01"
		} else {
			cfg.LLMModel = "gpt-4o-mini"
		}
	}
	return cfg
}
