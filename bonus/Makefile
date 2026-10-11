ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)
BONUS := $(ROOT)/bonus
COMPOSE := docker compose -f $(ROOT)/docker-compose.yml

# ---------------------------------------------------------
# AIDE
# ---------------------------------------------------------
help: ## Affiche la liste des commandes disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------
# DEV LOCAL
# ---------------------------------------------------------
install: ## Installe les dépendances frontend, backend et des outils bonus
	npm --prefix $(ROOT)/backend install
	npm --prefix $(ROOT)/frontend install
	npm --prefix $(BONUS) install

lint: ## Vérifie le formatage et le code (backend & frontend)
	npm --prefix $(ROOT)/backend run lint --if-present
	npm --prefix $(ROOT)/frontend run lint --if-present

typecheck: ## Contrôle le typage TypeScript
	npm --prefix $(ROOT)/backend run typecheck
	npm --prefix $(ROOT)/frontend run typecheck

dev: db-up ## Démarre Postgres via Docker puis le backend et frontend en parallèle
	cd $(BONUS) && npx concurrently -k -p "[{name}]" -n "BACKEND,FRONTEND" -c "blue.bold,cyan.bold" \
		"npm --prefix $(ROOT)/backend run dev" \
		"npm --prefix $(ROOT)/frontend run dev"

# ---------------------------------------------------------
# ORCHESTRATION DOCKER
# ---------------------------------------------------------
up: ## Démarre toute l'application via Docker Compose
	$(COMPOSE) up -d

down: ## Arrête tous les conteneurs Docker
	$(COMPOSE) down

build: ## Recompile les images Docker
	$(COMPOSE) build

logs: ## Affiche les logs de tous les services en temps réel
	$(COMPOSE) logs -f

clean: ## Supprime conteneurs, volumes orphelins et images inutilisées
	$(COMPOSE) down -v --remove-orphans
	docker image prune -f

# ---------------------------------------------------------
# BDD
# ---------------------------------------------------------
db-up: ## Démarre uniquement les conteneurs PostgreSQL et Mailpit
	$(COMPOSE) up -d db mailpit

db-down: ## Arrête le conteneur PostgreSQL
	$(COMPOSE) stop db

db-migrate: ## Crée et applique une migration Prisma à partir du schéma (synchronise la base de données avec le schéma)
	npm --prefix $(ROOT)/backend run db:migrate

db-generate: ## Régénère le client TypeScript Prisma (permet d'utiliser la base de données dans le code)
	npm --prefix $(ROOT)/backend run db:generate

db-seed: ## Initialise le catalogue des services et widgets en base
	npm --prefix $(ROOT)/backend run db:seed

db-studio: ## Ouvre l'interface visuelle Prisma Studio (port 5555)
	npm --prefix $(ROOT)/backend run db:studio

db-reset: ## Réinitialise complètement la base (supprime toutes les données)
	npm --prefix $(ROOT)/backend run db:reset

.PHONY: help install lint typecheck dev up down build logs clean db-up db-down db-migrate db-generate db-seed db-studio db-reset
