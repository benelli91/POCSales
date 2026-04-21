-- Origen de la generación: llm | template | llm_fallback (LLM habilitado pero falló → plantilla)
ALTER TABLE generated_plans ADD COLUMN plan_source TEXT NOT NULL DEFAULT 'template';
