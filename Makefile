.PHONY: dev build down logs restart clean dev-build prod prod-build

# Start frontend in development mode via pnpm workspace (Docker)
dev:
	docker compose up dev

# Build and start frontend in dev mode
dev-build:
	docker compose up --build dev

# Start all services (db + api + dev)
all:
	docker compose up

# Build images without starting
build:
	docker compose build

# Production mode (nginx serving built frontend)
prod:
	docker compose up web

prod-build:
	docker compose up --build web

# Stop and remove containers
down:
	docker compose down

# Tail logs of all services
logs:
	docker compose logs -f

# Restart frontend service
restart:
	docker compose restart dev

# Remove containers, networks, volumes, and orphans
clean:
	docker compose down -v --remove-orphans

# Run commands inside the dev container
exec:
	docker compose exec dev sh