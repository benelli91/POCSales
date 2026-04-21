# Plan de implementación — Plataforma tipo SaleADS + diagnóstico estructurado

Documento para **compartir con el equipo** y **retomar el trabajo en Cursor** pegando el bloque de contexto al inicio de un chat nuevo.

**Referencias de inspiración**

- Propuesta de producto similar: [SaleADS.ai](https://saleads.ai/es) (estrategia, creativos, publicación y optimización en canales publicitarios).
- Proceso de diagnóstico (framework tipo “Gravit”): flujo de preguntas que cubre objetivo, economía unitaria, público, creativos, destino, tracking, historial y presupuesto — con salidas a plan, brief y dashboard.

---

## Objetivo del producto (resumen)

Construir una plataforma que guía al usuario por un **diagnóstico estructurado** (wizard con ramificación), produce **estrategia + copy + brief creativo** con validaciones y trazabilidad de supuestos, y evoluciona hacia **métricas reales y acciones** (primero lectura vía APIs, luego publicación/optimización con guardrails y auditoría).

---

## Principios de alcance (para no explotar el proyecto)

1. **Verdad antes que “magia”**: cada output declara supuestos y nivel de confianza. Sin pixel/CAPI y eventos razonablemente configurados, no prometer optimización automática creíble.
2. **Humano en el loop** en etapas tempranas: aprobación de textos/creativos y de cambios sensibles en cuentas publicitarias.
3. **Un canal primero**: arrancar con **Meta Ads**; Google/TikTok después de tener patrón estable de integración, datos y soporte.
4. **Multi-tenant desde el día 1** (aunque sea mínimo): `Organization` → `Project` / `Business` → `Campaign` (o equivalente).

---

## Fase 0 — Alineación (3–7 días)

**Entregables**

- Definición de **ICP** (ecommerce, servicios locales, B2B, agencias, etc.) y del **MVP** (¿solo diagnóstico y outputs, o también conexión a cuentas?).
- Lista de **datos mínimos** por paso del wizard (obligatorios / opcionales / “no sé”).
- Textos legales y **disclaimers** (estimaciones, no asesoría financiera, responsabilidad del usuario en cuentas y gasto).
- Inventario de **riesgos**: OAuth, permisos, almacenamiento de tokens, retención de datos, políticas de plataforma.

**Definición de hecho (DoD)**

- Documento de alcance acordado + un **mock de flujo** (una sola vertical de pantallas es suficiente).

---

## Fase 1 — MVP “Diagnóstico + outputs” (4–8 semanas, 1–2 desarrolladores)

**Valor sin integraciones pesadas**

- Autenticación, organizaciones y proyectos.
- **Wizard** con ramificación según objetivo: ventas | leads | tráfico.
- Modelo de datos orientado a negocio, por ejemplo:
  - `BusinessProfile`, `WizardAnswers`, `Assumptions`, `GeneratedPlan`, `CreativeBrief`.
- Motor de generación: **plantillas + LLM** con salida **JSON validada** (schema) y reglas de negocio (límites de caracteres, secciones obligatorias).
- Exportación: Markdown / PDF / “copiar al portapapeles” (elegir según tiempo).
- **Score de completitud** del perfil + checklist explícito de tracking (pixel, CAPI, eventos clave).
- Auditoría mínima: quién cambió qué y cuándo.

**DoD**

- Un usuario puede completar el flujo y obtener un **plan accionable** coherente **sin** depender de APIs de anuncios.

---

## Fase 2 — Biblioteca y colaboración (3–6 semanas)

- Versionado de planes y briefs.
- Estados y flujo: borrador → revisión → aprobado.
- Comentarios por sección o por asset.
- Biblioteca de creativos: carga, metadatos, variantes (tamaños/placements si aplica).
- Playbooks por industria u objetivo.

**DoD**

- Un equipo pequeño (2–5 personas) puede colaborar sin pisarse versiones críticas.

---

## Fase 3 — Datos reales en modo “solo lectura” (6–12 semanas)

- OAuth con **Meta** (scopes mínimos necesarios).
- Sincronización de entidades según alcance elegido (cuenta, campañas, conjuntos, anuncios).
- **Dashboard** con métricas básicas: gasto, impresiones, clics, conversiones si el tracking lo permite.
- Alertas simples (umbrales, caídas bruscas, “sin conversiones con gasto X”).

**DoD**

- El usuario ve números reales y puede contrastar “lo planificado vs lo medido” en el mismo proyecto.

---

## Fase 4 — Acciones asistidas (8–16+ semanas)

- Acciones acotadas, reversibles donde sea posible: pausar, duplicar, ajustar presupuesto con **topes** configurables.
- **Policy engine** (reglas explícitas) + cola asíncrona + reintentos + manejo de errores de API.
- Registro completo de acciones para soporte y auditoría.

**DoD**

- Acciones con permisos granulares, logs completos y guardrails que eviten cambios catastróficos por defecto.

---

## Fase 5 — Automatización avanzada (continuo)

- Experimentación (A/B, bandits simples al inicio).
- Pipelines de creativos con moderación y límites por plan (“créditos”).
- Ampliación multi-canal (**Google Ads**, **TikTok Ads**) y modo agencia (multi-cliente avanzado, reporting comparativo).

**DoD**

- Automatización solo donde haya **señal suficiente** en datos y controles explícitos del usuario.

---

## Stack sugerido (ajustable al equipo)

| Capa | Opciones típicas |
|------|------------------|
| Frontend | Next.js (o SPA equivalente) + diseño de wizard accesible y guardado incremental |
| Backend | FastAPI, NestJS, Go, etc. — priorizar **contratos API claros** (OpenAPI) |
| Base de datos | PostgreSQL |
| Colas / jobs | Celery, RQ, BullMQ, SQS + workers para sync y acciones |
| IA | LLM + salida JSON + validación; prompts versionados; dataset de evaluación interna |
| Infra | Docker, CI/CD, logs/métricas/trazas, backups |

---

## Métricas de éxito por fase

| Fase | Métricas orientativas |
|------|------------------------|
| 1 | Tasa de finalización del wizard, tiempo hasta “plan listo”, tasa de errores de validación, feedback cualitativo |
| 3 | % de proyectos conectados, frescura de datos, uso del dashboard |
| 4 | Tasa de error en acciones, tiempo medio de ejecución, incidentes sin rollback |

---

## Contenido del wizard (checklist de dominio)

Inspirado en el framework de diagnóstico (objetivo → economía → público → creativos → destino → tracking → historial → presupuesto):

- Objetivo principal: ventas | leads | tráfico.
- Objetivo de eficiencia: p. ej. ROAS / CPA target (según objetivo).
- Producto u oferta empujada; ticket promedio; bundles/upsells; **margen** (para estimar CPA/ROAS máximo sostenible).
- Público: a quién se vende; compradores existentes; datos disponibles (emails, compras) para remarketing / audiencias similares cuando aplique.
- Creativos: tipos (UGC, producto, testimonio, oferta), hooks, qué ya funcionó.
- Destino del tráfico: home, PDP, landing, app; **conversión** (aunque sea estimada).
- Tracking: pixel, **API de conversiones**, calidad de eventos.
- Historial: campañas previas, qué funcionó/no, CPA histórico.
- Presupuesto: inversión diaria sostenible y **ventana de testeo**.

**Regla de producto**: marcar explícitamente cuando los datos son débiles o inferidos, para no replicar el problema de “datos inventados” sin base.

---

## Paquete de retoma para Cursor (copiar y pegar en un chat nuevo)

```text
Contexto: Queremos construir un SaaS tipo SaleADS + framework de diagnóstico (wizard) que captura: objetivo (ventas/leads/tráfico), ROAS o equivalente de eficiencia, producto/ticket/margen, público y data (remarketing/lookalike cuando aplique), tipos de creativos/hooks/historial, destino y conversión, tracking (pixel/CAPI/eventos), historial de campañas/CPA, presupuesto diario y ventana de testeo.

Outputs: plan estratégico + brief creativo + “canvas”/resumen de cliente; evolución a dashboard con datos reales y luego acciones con guardrails.

Restricciones: un canal primero (Meta), human-in-the-loop, multi-tenant simple, salidas validadas (JSON schema), no prometer optimización automática sin tracking razonable.

Documento de referencia en el repo: docs/PLAN_PLATAFORMA_ADS.md

Pedido: Continuar desde Fase X. Revisar el código existente y proponer cambios mínimos: modelos DB, endpoints, UI del wizard, jobs de integración. Si no hay base, priorizar MVP Fase 1.
```

---

## Notas finales

- Este plan es **deliberadamente por fases** para reducir riesgo técnico y de producto.
- La **Fase 1** ya puede ser un negocio si el diagnóstico y los outputs son superiores a un chat genérico (estructura, validación, exportación, colaboración).
- Las fases 3–5 son donde aumenta fuerte la complejidad (OAuth, límites de API, cumplimiento, costos operativos).

Última actualización: abril 2026.
