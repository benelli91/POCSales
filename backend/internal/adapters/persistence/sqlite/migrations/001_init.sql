-- Multi-tenant base: organizations + users
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);

-- Projects = "negocio / cliente" para el cual se construye estrategia
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    -- Estado de alto nivel del proyecto en la POC: draft | wizard | generated | published
    status TEXT NOT NULL DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);

-- Respuestas del wizard (1:1 con project para la POC). Se guarda como JSON
-- para poder iterar sin migraciones constantes.
CREATE TABLE IF NOT EXISTS wizard_answers (
    project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    answers_json TEXT NOT NULL DEFAULT '{}',
    completeness_score INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plan generado a partir del wizard (estrategia + copys + brief).
-- Versionado: nuevas generaciones crean nueva fila.
CREATE TABLE IF NOT EXISTS generated_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    plan_json TEXT NOT NULL,
    brief_json TEXT NOT NULL,
    assumptions_json TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_project ON generated_plans(project_id);

-- Credenciales Meta por organización (POC: token guardado en claro en SQLite,
-- documentar en README que es solo para POC y NO para producción).
CREATE TABLE IF NOT EXISTS meta_credentials (
    organization_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    ad_account_id TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Campañas creadas en Meta (mirror local mínimo)
CREATE TABLE IF NOT EXISTS meta_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES generated_plans(id) ON DELETE SET NULL,
    meta_campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT NOT NULL,
    daily_budget_cents INTEGER NOT NULL DEFAULT 0,
    raw_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meta_campaigns_project ON meta_campaigns(project_id);

-- Auditoría mínima (Fase 1): quién hizo qué, cuándo
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_log(project_id);
