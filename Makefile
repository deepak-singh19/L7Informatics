.PHONY: lint test build up down seed clean install-dev

# Install development dependencies
install-dev:
	cd backend && pip install -r requirements.txt -r requirements-dev.txt

# Lint the backend code
lint:
	cd backend && ruff check .

# Run tests
test:
	cd backend && pytest -v

# Build step (lint + test + docker build)
build: lint test
	docker-compose build

# Start services
up:
	docker-compose up -d

# Stop services
down:
	docker-compose down

# Seed the database with MovieLens data
seed:
	docker-compose run --rm -e TMDB_API_KEY=${TMDB_API_KEY} backend python seed_movielens.py

# Clean up Docker resources
clean:
	docker-compose down -v
	docker system prune -f

# Development commands
dev-install:
	cd backend && pip install -r requirements.txt -r requirements-dev.txt

dev-run:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-seed:
	cd backend && python seed_movielens.py

dev-test:
	cd backend && pytest -v

# Help
help:
	@echo "Available targets:"
	@echo "  install-dev  - Install development dependencies"
	@echo "  lint         - Run code linting with ruff"
	@echo "  test         - Run pytest tests"
	@echo "  build        - Lint, test, and build Docker images"
	@echo "  up           - Start Docker Compose services"
	@echo "  down         - Stop Docker Compose services"
	@echo "  seed         - Seed database with MovieLens data"
	@echo "  clean        - Clean up Docker resources"
	@echo "  dev-install  - Install deps for local development"
	@echo "  dev-run      - Run backend locally with auto-reload"
	@echo "  dev-seed     - Seed database locally"
	@echo "  dev-test     - Run tests locally"
	@echo "  help         - Show this help message"
