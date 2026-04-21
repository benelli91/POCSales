# POC Sales — Plataforma Ads (estilo SaleADS)

POC funcional de la plataforma descrita en [`PLAN_PLATAFORMA_ADS.md`](PLAN_PLATAFORMA_ADS.md): wizard de diagnóstico
estructurado, generación de plan estratégico + brief creativo (con supuestos declarados), y publicación de
campañas reales en **Meta Ads** (Marketing API, estado `PAUSED`).

## Stack

- **Backend:** Go 1.21, [chi v5](https://github.com/go-chi/chi), JWT (`golang-jwt/jwt`), SQLite (`modernc.org/sqlite`).
  Arquitectura hexagonal por dominio (`internal/<domain>/{entity,repository,service,delivery/http}`).
- **Frontend:** Vite + React 18 + TypeScript + TailwindCSS + react-router-dom.
- **Persistencia:** SQLite (un único archivo, migraciones embebidas).
- **Integración:** Meta Marketing API (Graph API v19.0).

## Estructura

```
POCSales/
├── backend/
│   ├── cmd/api/         # entrypoint del servidor HTTP
│   ├── cmd/seed/        # crea organización demo + admin
│   └── internal/
│       ├── adapters/
│       │   ├── http/             # server, router, middleware, CORS
│       │   └── persistence/sqlite # apertura DB + migraciones embebidas
│       ├── pkg/                  # httputil, authcontext (compartido)
│       ├── user/                 # auth, organizaciones, JWT
│       ├── project/              # proyectos + wizard answers
│       ├── plan/                 # generador plan + brief + supuestos
│       └── meta/                 # credenciales Meta + cliente Graph + campañas
├── frontend/
│   └── src/
│       ├── api/        # cliente fetch + tipos
│       ├── context/    # AuthProvider
│       ├── components/ # Layout
│       └── pages/      # Login, Register, Dashboard, NewProject, Wizard, ProjectDetail, MetaSettings
└── PLAN_PLATAFORMA_ADS.md
```

## Cómo correr

### Backend

```bash
# Crear/migrar DB y dejar listo el admin demo (idempotente)
go run ./cmd/seed --prefix=backend
```

> Si tu shell no tiene `--prefix`, posicionate en `backend/` y ejecutá los comandos desde ahí.

```bash
# Desde la carpeta backend/
go run ./cmd/seed   # genera SQLite + crea demo@pocsales.local / demo1234
go run ./cmd/api    # arranca API en :8080
```

Variables de entorno opcionales:

| Variable           | Default                                      | Descripción                                  |
|--------------------|----------------------------------------------|----------------------------------------------|
| `PORT`             | `8080`                                       | Puerto HTTP                                  |
| `DB_PATH`          | `data.db`                                    | Ruta del archivo SQLite                      |
| `JWT_SECRET`       | `pocsales-secret-change-in-production`       | Secreto HMAC del JWT                         |
| `STATIC_DIR`       | *(vacío)*                                    | Si está seteado, sirve el SPA desde esa ruta |
| `META_API_BASE`    | `https://graph.facebook.com`                 | Base de Graph API (útil para mockear)        |
| `META_API_VERSION` | `v19.0`                                      | Versión de la Graph API                      |

### Frontend

```bash
# Desde la carpeta frontend/
npm install
npm run dev
```

Abrí http://localhost:5173. Vite proxea `/api` → `http://localhost:8080`.

### Credenciales del seed

- Email: `demo@pocsales.local`
- Password: `demo1234`

(Se crean automáticamente al correr `go run ./cmd/seed` si no existe el usuario.)

## Flujo de la POC (cubre Fase 1 + atajo a Fase 4)

1. **Login** con el usuario demo (o `Crear cuenta` para una nueva organización).
2. **Crear proyecto** → al guardar, se entra automáticamente al wizard.
3. **Wizard de diagnóstico** (6 pasos, guardado incremental):
   - Objetivo & KPI (ventas/leads/tráfico, ROAS o CPA target)
   - Producto, ticket, margen
   - Público y data disponible
   - Tipos de creativos + hooks
   - Destino (URL) + tracking (pixel/CAPI/eventos)
   - Historial + presupuesto diario + ventana de testeo
   - Score de completitud en vivo (`completeness_score` en la DB).
4. **Generar plan**: persiste en `generated_plans` con versión incremental, e incluye:
   - Plan estratégico tipado (`strategy_steps`, `audiences`, `budget`, `metrics`, `risks`).
   - Brief creativo tipado (`hooks`, `headlines`, `primary_texts`, `ctas`, `formats`).
   - Lista de supuestos declarados (`assumptions[]`) con `field/issue/impact/suggestion`,
     reflejando el principio del plan: *"verdad antes que magia"*.
5. **Configurar Meta Ads** en `Meta Ads` (sidebar): pegar `Ad Account ID` y `Access Token`
   (System User Token recomendado). Guardado por organización.
6. **Crear campaña en Meta**: desde la pantalla del proyecto, botón
   *"Crear campaña en Meta (PAUSED)"* — llama a
   `POST /{version}/act_{ad_account}/campaigns` con `objective` traducido
   (ventas → `OUTCOME_SALES`, leads → `OUTCOME_LEADS`, tráfico → `OUTCOME_TRAFFIC`),
   estado `PAUSED` y `daily_budget` del plan.

> La campaña queda **siempre en PAUSED** (la POC no publica ad sets ni ads), respetando el principio de
> *human-in-the-loop* y *guardrails* del documento de plan.

## Endpoints HTTP (resumen)

Públicos:

```
POST   /api/auth/register          { organization_name, email, password, name }
POST   /api/auth/login             { email, password }
GET    /health
```

Autenticados (header `Authorization: Bearer <jwt>`):

```
GET    /api/me

GET    /api/projects
POST   /api/projects               { name, industry, description }
GET    /api/projects/:id
GET    /api/projects/:id/wizard
PUT    /api/projects/:id/wizard    { answers: WizardAnswers }
POST   /api/projects/:id/plan      → genera nueva versión
GET    /api/projects/:id/plan      → última versión
GET    /api/projects/:id/plans     → todas las versiones

GET    /api/meta/credentials
PUT    /api/meta/credentials       { access_token, ad_account_id }
POST   /api/projects/:id/meta/campaigns   { name? }
GET    /api/projects/:id/meta/campaigns
```

## Esquema de datos (SQLite)

- `organizations`, `users` — multi-tenant mínimo (1 owner por org en la POC).
- `projects` — un negocio/cliente por proyecto, con `status` (`draft|wizard|generated|published`).
- `wizard_answers` — JSON serializado (1:1 con project) + `completeness_score`.
- `generated_plans` — versionado por proyecto: `plan_json`, `brief_json`, `assumptions_json`.
- `meta_credentials` — token + ad account por organización.
- `meta_campaigns` — mirror local de cada `POST /campaigns` ejecutado contra Meta.
- `audit_log` — tabla preparada para registrar acciones (Fase 4 del plan).

Migración inicial completa: [`backend/internal/adapters/persistence/sqlite/migrations/001_init.sql`](backend/internal/adapters/persistence/sqlite/migrations/001_init.sql).

## Limitaciones explícitas (POC)

- El **access token** de Meta se guarda **en claro** en SQLite. En producción usar secret manager y nunca exponerlo
  al frontend.
- La generación de plan/brief es **template-based** (sin LLM). Está estructurada para ser reemplazada por una capa
  con LLM + JSON schema sin tocar el resto: ver `internal/plan/service/generator.go`.
- Solo se crea **la campaña** en Meta (campaign group). No se crean ad sets, ads ni creatives —
  fuera del scope de la Fase 1/4 inicial del plan.
- Multi-tenant simplificado: 1 organización por usuario, sin invitaciones ni roles avanzados.
- Auditoría: la tabla existe pero la POC aún no escribe entradas; se deja como placeholder para Fase 4.

## Deploy en Railway

El proyecto está preparado para correr como **un único servicio** en [Railway](https://railway.app):
backend Go + frontend Vite servidos desde el mismo origen (puerto `$PORT`).

Archivos clave:

- [`Dockerfile`](Dockerfile) — multi-stage: build del frontend → build del backend → imagen `alpine` mínima
  con binarios estáticos. Setea `STATIC_DIR=/app/web` para que la API sirva el SPA.
- [`railway.json`](railway.json) — usa el Dockerfile, healthcheck en `/health`, política de restart on-failure.
- [`.dockerignore`](.dockerignore) — excluye `node_modules`, `dist` y la DB local.

### Pasos

1. **Conectar el repo** en Railway → *New project* → *Deploy from GitHub repo* → elegir `benelli91/POCSales`.
2. Railway detecta el `Dockerfile` automáticamente. No hay que configurar build commands.
3. Variables de entorno **mínimas** a setear en el servicio:

   | Variable           | Valor recomendado                              |
   |--------------------|------------------------------------------------|
   | `JWT_SECRET`       | string aleatorio largo (`openssl rand -hex 32`) |

   Variables opcionales:

   | Variable           | Para qué                                                                  |
   |--------------------|----------------------------------------------------------------------------|
   | `DB_PATH`          | Ruta del archivo SQLite. Para **persistencia**: ver paso 4.                |
   | `META_API_VERSION` | Cambiar la versión de Graph API si Meta libera nuevas.                     |
   | `PORT`             | Railway lo inyecta solo, no hace falta tocarlo.                            |

4. **Persistencia de la DB SQLite**: la DB vive en `/data/data.db` (`DB_PATH` por defecto).
   Railway **prohíbe** la instrucción `VOLUME` en el `Dockerfile`; sin un volumen montado los datos se pierden en cada redeploy. Para
   mantenerlos:
   - Crear un *Volume* en el servicio de Railway y montarlo en `/data`.
   - No hace falta tocar `DB_PATH`: ya apunta a `/data/data.db`.

5. El contenedor ejecuta `seed; api`: si el usuario `demo@pocsales.local` no existe, lo crea
   (idempotente). En el primer deploy ya podés loguearte con `demo@pocsales.local / demo1234`.

6. Una vez deployado, abrir la URL pública que asigna Railway:
   - **Storefront del POC**: `/` (SPA con Login → Dashboard → Wizard → Plan → Meta).
   - **Health**: `/health`.
   - **API**: `/api/...`.

> Como la API y el frontend viven en el mismo origen, las rutas `/api/...` del cliente funcionan sin
> proxy ni configuración adicional.

### Probar el build localmente con Docker

```bash
docker build -t pocsales .
docker run --rm -p 8080:8080 \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  pocsales
# abrir http://localhost:8080
```

## Próximos pasos sugeridos

- **Fase 2:** comentarios, estados borrador→aprobado, biblioteca de creativos.
- **Fase 3:** sincronizar métricas reales por OAuth (campaign insights), dashboard "planificado vs medido".
- **Fase 4:** acciones reversibles con policy engine y cola async (pausar/duplicar/ajustar presupuesto con topes).
- Reemplazar plantilla del generador por **LLM con salida JSON validada** contra los structs ya definidos.
