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
RUN apk add --no-cache ca-certificates tzdata wget \
 && mkdir -p /app /data

WORKDIR /app
COPY --from=backend  /out/api  /app/api
COPY --from=backend  /out/seed /app/seed
COPY --from=frontend /app/frontend/dist /app/web

# PORT es provisto por Railway en runtime; 8080 es el default para pruebas locales.
ENV PORT=8080 \
    STATIC_DIR=/app/web \
    DB_PATH=/data/data.db

# Nota: no usamos `VOLUME` (Railway lo prohíbe). Montá un Railway Volume
# en /data desde el dashboard para persistir la SQLite entre deploys.
EXPOSE 8080

# Healthcheck local (Docker). Railway usa su propia config en railway.json.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

# Arranque robusto:
# 1) Loguea qué va a correr.
# 2) Corre el seed (idempotente). Si falla no bloquea el arranque del API.
# 3) exec al api -> PID 1 correcto para que Railway reciba las señales.
CMD ["/bin/sh", "-c", "echo \"[entrypoint] PORT=$PORT DB_PATH=$DB_PATH STATIC_DIR=$STATIC_DIR\"; /app/seed || echo \"[entrypoint] seed: warning, continuo con api\"; exec /app/api"]
