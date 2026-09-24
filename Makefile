# ---------------------------------------------------------
# AIDE
# ---------------------------------------------------------
help: ## Affiche la liste des commandes disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------
# DEV LOCAL
# ---------------------------------------------------------
install: ## Installe les dépendances frontend et backend
	npm --prefix backend install
	npm --prefix frontend install

lint: ## Vérifie le formatage et le code (backend & frontend)
	npm --prefix backend run lint --if-present
	npm --prefix frontend run lint --if-present

typecheck: ## Contrôle le typage TypeScript
	npm --prefix backend run typecheck
	npm --prefix frontend run typecheck

# ---------------------------------------------------------
# ORCHESTRATION DOCKER
# ---------------------------------------------------------
up: ## Démarre toute l'application via Docker Compose
	docker compose up -d

down: ## Arrête tous les conteneurs Docker
	docker compose down

build: ## Recompile les images Docker
	docker compose build

logs: ## Affiche les logs de tous les services en temps réel
	docker compose logs -f

clean: ## Supprime conteneurs, volumes orphelins et images inutilisées
	docker compose down -v --remove-orphans
	docker image prune -f

# ---------------------------------------------------------
# BDD
# ---------------------------------------------------------
db-up: ## Démarre uniquement le conteneur PostgreSQL
	docker compose up -d db

db-down: ## Arrête le conteneur PostgreSQL
	docker compose stop db

db-migrate: ## Crée et applique une migration Prisma à partir du schéma
	npm --prefix backend run db:migrate

db-generate: ## Régénère le client TypeScript Prisma
	npm --prefix backend run db:generate

db-studio: ## Ouvre l'interface visuelle Prisma Studio (port 5555)
	npm --prefix backend run db:studio

db-reset: ## Réinitialise complètement la base (supprime toutes les données)
	npm --prefix backend run db:reset

.PHONY: help install dev up down build logs clean lint typecheck db-up db-down db-migrate db-generate db-studio db-reset