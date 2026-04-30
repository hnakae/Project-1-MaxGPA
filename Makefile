.PHONY: help install dev-fe dev-be test-fe test-be lint db-seed docker-up docker-down push

# Default target: show help
help:
	@echo "Available commands:"
	@echo "  install        Install all dependencies (frontend & backend)"
	@echo "  dev-fe         Run Next.js frontend in development mode"
	@echo "  dev-be         Run FastAPI backend in development mode"
	@echo "  test-fe        Run frontend tests with Vitest"
	@echo "  test-be        Run backend tests with Pytest"
	@echo "  lint           Run ESLint"
	@echo "  db-seed        Reset and seed the database"
	@echo "  docker-up      Start services using docker-compose"
	@echo "  docker-down    Stop services using docker-compose"
	@echo "  push m=\"msg\"   Git add, commit, and push (e.g., make push m=\"feature: xyz\")"

# Installation
install:
	npm install
	cd api && pip install -r requirements.txt

# Development
dev-fe:
	npm run dev

dev-be:
	fastapi dev api/main.py

# Testing
test-fe:
	npm run test

test-be:
	pytest tests/api_tests

# Linting
lint:
	npm run lint

# Database
db-seed:
	python3 db/seed_data.py

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Git utility (requires m="message")
push:
	@if [ -z "$(m)" ]; then echo "Error: m is required (e.g., make push m=\"message\")"; exit 1; fi
	git add .
	git commit -m "$(m)"
	git push
