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
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 1000 app
COPY --from=backend  /out/api  /app/api
COPY --from=backend  /out/seed /app/seed
COPY --from=frontend /app/frontend/dist /app/web

ENV PORT=8080 \
    STATIC_DIR=/app/web \
    DB_PATH=/app/data.db

USER app
EXPOSE 8080

# Seed idempotente (no falla si el usuario demo ya existe) y luego arranca la API.
CMD ["/bin/sh", "-c", "/app/seed; exec /app/api"]
