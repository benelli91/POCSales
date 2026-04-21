# syntax=docker/dockerfile:1

# ----- Stage 1: build frontend (Vite) -----
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ----- Stage 2: build backend (Go) -----
FROM golang:1.21-alpine AS backend
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api  ./cmd/api \
 && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/seed ./cmd/seed

# ----- Stage 3: runtime -----
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata \
 && adduser -D -u 1000 app \
 && mkdir -p /app /data \
 && chown -R app:app /app /data

WORKDIR /app
COPY --from=backend  --chown=app:app /out/api  /app/api
COPY --from=backend  --chown=app:app /out/seed /app/seed
COPY --from=frontend --chown=app:app /app/frontend/dist /app/web

ENV PORT=8080 \
    STATIC_DIR=/app/web \
    DB_PATH=/data/data.db


USER app
EXPOSE 8080

# seed es idempotente: crea el usuario demo solo si no existe.
# Si seed falla no hacemos fallar el contenedor; api podrá igual arrancar
# (p.ej. si otro proceso ya creó la DB) y Railway reportará el healthcheck.
CMD ["/bin/sh", "-c", "/app/seed || echo 'seed: warning (continuará)'; exec /app/api"]
