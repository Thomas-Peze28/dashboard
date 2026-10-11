# Guide de développement

Ce document s'adresse aux personnes qui modifient le code : environnement de travail, tests, intégration continue, conventions, et ajout d'un nouveau widget pas à pas.
Pour installer le projet, voir d'abord [INSTALLATION.md](INSTALLATION.md) ; pour comprendre son fonctionnement, [ARCHITECTURE.md](ARCHITECTURE.md).

## Sommaire

- [Guide de développement](#guide-de-développement)
  - [Sommaire](#sommaire)
  - [1. Environnement de développement](#1-environnement-de-développement)
  - [2. Tests](#2-tests)
    - [Lancer les tests en local](#lancer-les-tests-en-local)
  - [3. Qualité du code](#3-qualité-du-code)
  - [4. Intégration continue](#4-intégration-continue)
  - [5. Ajouter un nouveau widget](#5-ajouter-un-nouveau-widget)
    - [Backend](#backend)
    - [Frontend](#frontend)
    - [Pour finir](#pour-finir)
  - [6. Modifier la base de données](#6-modifier-la-base-de-données)

---

## 1. Environnement de développement

Deux façons de travailler :

| Mode | Commande | Rechargement à chaud | Quand l'utiliser |
|---|---|---|---|
| Tout dans Docker | `docker compose up -d` | Oui (le code est monté dans les conteneurs) | Vérifier le comportement final, démonstration |
| Base dans Docker, code en local | `make -C bonus dev` | Oui | Développement quotidien, débogage, tests |

Le mode local est décrit dans [INSTALLATION.md, section 6](INSTALLATION.md#6-lancer-sans-docker-développement).

Outils pratiques :
- **Swagger UI** (http://localhost:8080/api/docs) pour appeler l'API à la main ;
- **Prisma Studio** (`make -C bonus db-studio`, http://localhost:5555) pour consulter et modifier la base ;
- **Mailpit** (http://localhost:8025) pour lire les e-mails envoyés.

## 2. Tests

Les tests sont des **tests d'intégration** du backend (Vitest + Supertest), dans `backend/src/__tests__/` :

| Fichier | Ce qui est testé |
|---|---|
| `auth.test.ts` | Inscription, confirmation, connexion, `/api/users/me` |
| `oauth.google.test.ts`, `oauth.github.test.ts` | Connexion OAuth, création et liaison des comptes |
| `widgets.test.ts` | Ajout, modification, suppression des widgets d'un utilisateur |
| `weather.test.ts`, `github.test.ts`, `gmail.test.ts`, `pokemon.test.ts` | Données et erreurs de chaque service de widgets |

Chaque test envoie une vraie requête HTTP à l'application, branchée sur une vraie base PostgreSQL.
Les APIs externes ne sont **jamais** appelées : `fetch` est remplacé par une fausse réponse (`vi.stubGlobal('fetch', …)`). Les tests ne dépendent donc ni du réseau ni des quotas, et peuvent simuler les erreurs (service indisponible, token révoqué…).

### Lancer les tests en local

Les tests ont besoin d'une base PostgreSQL et d'un serveur SMTP. Le plus simple est de lancer des conteneurs dédiés, comme la CI :

```bash
# 1. Base de test et serveur SMTP, sur des ports différents de ceux de l'application
docker run -d --name postgres-test -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dashboard_test -p 5433:5432 postgres:16-alpine
docker run -d --name mailpit-test -p 1026:1025 axllent/mailpit:latest

# 2. Variables pour les tests
cd backend
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dashboard_test?schema=public"
export JWT_SECRET=test SMTP_HOST=localhost SMTP_PORT=1026

# 3. Créer les tables, puis lancer les tests
npx prisma migrate deploy
npm test                                  # tous les tests
npx vitest run src/__tests__/gmail.test.ts   # un seul fichier

# 4. Nettoyer
docker rm -f postgres-test mailpit-test
```

Les tests créent leurs propres utilisateurs (adresses `…_test_…@epitech.eu`) et les suppriment à la fin.

## 3. Qualité du code

| Commande | Vérification |
|---|---|
| `make -C bonus lint` | ESLint sur le backend et le frontend |
| `make -C bonus typecheck` | Vérification des types TypeScript, sans compiler |
| `npm --prefix frontend run build` | Build de production du frontend |

À lancer avant chaque push : la CI refuse le code qui ne passe pas ces vérifications.

## 4. Intégration continue

Le fichier `.github/workflows/ci.yml` s'exécute à chaque push et pull request sur `main`, `dev` et `CI/CD` (runner GitHub Actions auto-hébergé) :

```mermaid
flowchart LR
    A["Lint, types, build<br/>(backend et frontend)"] --> C["Construction des<br/>images Docker"]
    B["Tests d'intégration<br/>(PostgreSQL + Mailpit éphémères)"] --> C
```

1. **Lint & Typecheck** : installation, validation du schéma Prisma, ESLint, `tsc --noEmit` et build, pour le backend et le frontend.
2. **Backend Integration Tests** : démarre PostgreSQL et Mailpit dans des conteneurs, applique les migrations et lance `npm test`.
3. **Build Docker Images** : construit les images backend et frontend, uniquement si les deux étapes précédentes réussissent.

## 5. Ajouter un nouveau widget

Exemple : un widget `weather_wind` qui affiche le vent d'une ville.

### Backend

1. **Écrire le handler** dans le dossier du service, ex. `backend/src/services/widgets/weather/wind.ts`.
   Il reçoit la configuration de l'instance et l'identifiant de l'utilisateur, et renvoie uniquement les données utiles :

   ```ts
   /**
   * Retrieves the wind of a city with Open-Meteo.
   * @param config - Widget configuration ({ city }).
   * @returns Wind data.
   **/
   export const getWind = async (config: Record<string, unknown>) => {

       const location = await geocodeCity(getCityFromConfig(config));
       const { current } = await fetchForecast(location, { current: 'wind_speed_10m' }) as WindResponse;

       return { city: location.name, windSpeed: current.wind_speed_10m };
   };
   ```

   Vérifiez la configuration reçue : si elle est invalide, lancez `INVALID_WIDGET_CONFIG` ; si une ressource est introuvable, un code dédié.

2. **Enregistrer le handler** dans `backend/src/services/widgets/index.ts` :

   ```ts
   weather_wind: getWind,
   ```

3. **Déclarer le widget** dans le catalogue `backend/src/config/services.config.ts`, avec ses paramètres (au moins un : le sujet ne compte pas les widgets sans paramètre) :

   ```ts
   {
       name: 'weather_wind',
       description: "Current wind of a city.",
       params: [
           { name: 'city', type: 'string', description: 'City name (ex: Lille, Paris, Tokyo)' },
       ],
   },
   ```

4. **Nouveaux codes d'erreur** : s'il y en a, ajoutez-les à `WIDGET_DATA_ERRORS` dans `backend/src/controllers/widget.controller.ts`.
5. **Documenter** la route dans `backend/src/docs/swagger.yaml`, sur le modèle des autres widgets (`'/api/widgets/{id}/data#weather_wind'`).
6. **Tester** dans le fichier de test du service : cas normal, configuration invalide, service externe indisponible.
7. **Mettre à jour la base** : `docker compose restart backend` (le seed est relancé au démarrage) ou `make -C bonus db-seed` en local. Le widget apparaît dans `/api/services`, et immédiatement dans `/about.json` qui lit directement le catalogue.

### Frontend

1. **Type** : ajoutez le contenu du post-it à `StickyNoteContent` dans `frontend/src/types/stickyNote.ts`, ex. `{ kind: 'weatherWind'; city: string }`.
2. **Correspondance avec le catalogue** dans `frontend/src/api/stickyNotes.ts` :
   - `catalogNames` : `weatherWind: 'weather_wind'` ;
   - `toContent` : configuration enregistrée → contenu du post-it ;
   - `toConfig` : contenu du post-it → configuration à envoyer.
3. **Affichage** : un composant dans `frontend/src/components/dashboard/<service>/`, qui charge ses données avec le hook `useStickyNoteData(noteId, refreshInterval * 1000)` et s'adapte aux trois tailles de post-it ; branchez-le dans `StickyNoteCard.tsx`.
4. **Configuration** : ajoutez le choix et ses champs dans `StickyNoteContentDialog.tsx`. Pour un paramètre numérique (un nombre d'éléments, par exemple), réutilisez le curseur `CountSlider`.
5. **Rafraîchissement** : donnez une fréquence par défaut dans `frontend/src/constants/refresh.ts`.

### Pour finir

- Ajoutez le widget à [WIDGETS.md](WIDGETS.md) et au tableau du [README](../README.md).
- Lancez `make -C bonus lint`, `make -C bonus typecheck` et les tests.

## 6. Modifier la base de données

1. Modifiez `backend/prisma/schema.prisma`.
2. Créez la migration : `make -C bonus db-migrate` (Prisma demande un nom, ex. `add_favorite_to_user_widget`).
3. Commitez le dossier créé dans `backend/prisma/migrations/` avec le schéma.

Les migrations sont appliquées automatiquement au démarrage du conteneur backend (`prisma migrate deploy`, suivi du seed) et dans la CI. Ne modifiez jamais une migration déjà partagée : créez-en une nouvelle.
