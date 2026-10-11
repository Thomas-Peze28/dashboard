# Installation et configuration

Ce document explique comment installer, configurer et lancer le Dashboard, avec ou sans Docker.

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Installation avec Docker (recommandée)](#2-installation-avec-docker-recommandée)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Configurer la connexion Google (et Gmail)](#4-configurer-la-connexion-google-et-gmail)
5. [Configurer la connexion GitHub](#5-configurer-la-connexion-github)
6. [Lancer sans Docker (développement)](#6-lancer-sans-docker-développement)
7. [Commandes utiles](#7-commandes-utiles)
8. [Dépannage](#8-dépannage)

---

## 1. Prérequis

| Outil | Version | Utile pour |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) et Docker Compose | récente | Lancer l'application (obligatoire) |
| [Node.js](https://nodejs.org/) | 22 | Uniquement pour développer sans Docker ou lancer les tests |
| `make` | — | Facultatif : raccourcis de commandes du dossier `bonus/` (voir [section 7](#7-commandes-utiles)) |

Ports utilisés : **3000** (frontend), **8080** (backend), **5432** (PostgreSQL), **1025** et **8025** (Mailpit).

## 2. Installation avec Docker (recommandée)

```bash
# 1. Récupérer le projet
git clone <url-du-dépôt> dashboard
cd dashboard

# 2. Créer le fichier de configuration, puis le compléter (voir section 3)
cp .env.example .env

# 3. Construire les images
docker compose build

# 4. Lancer les conteneurs en arrière-plan
docker compose up -d
```

À chaque démarrage, le conteneur backend :
1. applique les migrations : il crée ou met à jour les tables de la base ;
2. remplit le catalogue des services et widgets (seed), sans créer de doublon s'il existe déjà ;
3. lance le serveur sur le port 8080.

Le premier démarrage peut prendre quelques secondes de plus : suivez-le avec `docker compose logs -f backend`.

**Vérifier que tout fonctionne**

| Adresse | Résultat attendu |
|---|---|
| http://localhost:8080/about.json | Un JSON listant 5 services et 11 widgets |
| http://localhost:3000 | La page de connexion |
| http://localhost:8080/api/docs | La documentation interactive de l'API |
| http://localhost:8025 | L'interface de Mailpit |

**Les quatre conteneurs**

| Service Compose | Rôle | Port |
|---|---|---|
| `db` | Base de données PostgreSQL 15 (données conservées dans le volume `pgdata`) | 5432 |
| `mailpit` | Faux serveur d'e-mails : capture les e-mails envoyés et les affiche dans une interface web | 1025 (SMTP), 8025 (web) |
| `backend` | API Express | 8080 |
| `frontend` | Application React (serveur Vite) | 3000 |

## 3. Variables d'environnement

Le fichier `.env` à la racine contient les secrets. Il n'est **jamais** versionné (il est dans `.gitignore`) ; `.env.example` sert de modèle.

Avec Docker, `docker-compose.yml` fixe déjà la plupart des valeurs (adresses, base de données, SMTP). Seules la clé des sessions (`JWT_SECRET`) et les clés OAuth sont lues dans `.env`.

| Variable | Utilisée par | Obligatoire | Description | Valeur avec Docker |
|---|---|---|---|---|
| `JWT_SECRET` | backend | Recommandée | Clé de signature des sessions, **32 caractères minimum** : générez-la avec `openssl rand -hex 32`. Absente, le backend utilise une clé aléatoire (sessions perdues à chaque redémarrage) ; trop courte, il refuse de démarrer | à renseigner dans `.env` |
| `GOOGLE_CLIENT_ID` | backend | Pour Google et Gmail | Identifiant du client OAuth Google | à renseigner dans `.env` |
| `GOOGLE_CLIENT_SECRET` | backend | Pour Google et Gmail | Secret du client OAuth Google | à renseigner dans `.env` |
| `GITHUB_CLIENT_ID` | backend | Pour GitHub | Identifiant de l'application OAuth GitHub | à renseigner dans `.env` |
| `GITHUB_CLIENT_SECRET` | backend | Pour GitHub | Secret de l'application OAuth GitHub | à renseigner dans `.env` |
| `DATABASE_URL` | backend | Oui | Adresse de connexion PostgreSQL | `postgresql://user:password@db:5432/dashboard_db` |
| `PORT` | backend | Non | Port du backend | `8080` |
| `BACKEND_URL` | backend | Non | Adresse publique du backend (liens des e-mails de confirmation) | `http://localhost:8080` |
| `FRONTEND_URL` | backend | Non | Adresse du frontend : redirection après connexion, et seule origine autorisée à appeler l'API depuis un navigateur (CORS) | `http://localhost:3000` |
| `GOOGLE_REDIRECT_URI` | backend | Non | Adresse de retour OAuth Google | `http://localhost:8080/api/auth/google/callback` |
| `GITHUB_REDIRECT_URI` | backend | Non | Adresse de retour OAuth GitHub | `http://localhost:8080/api/auth/github/callback` |
| `SMTP_HOST`, `SMTP_PORT` | backend | Non | Serveur d'envoi des e-mails | `mailpit`, `1025` |
| `SMTP_FROM` | backend | Non | Expéditeur des e-mails | `"Dashboard" <no-reply@dashboard.local>` |
| `VITE_API_URL` | frontend | Non | Adresse du backend vue par le navigateur | `http://localhost:8080` |

> Sans clés Google ni GitHub, l'application fonctionne avec les comptes par e-mail et les widgets Heure, Météo et Pokémon.
> Les boutons de connexion Google et GitHub mènent alors à une page d'erreur du fournisseur.

## 4. Configurer la connexion Google (et Gmail)

La connexion Google sert à se connecter au Dashboard **et** aux widgets Gmail.

1. Ouvrez la [Google Cloud Console](https://console.cloud.google.com/) et créez un projet.
2. **APIs & Services → Library** : activez la **Gmail API**.
3. **APIs & Services → OAuth consent screen** :
   - type d'utilisateur : *External* ;
   - ajoutez les scopes `.../auth/userinfo.email`, `.../auth/userinfo.profile` et `.../auth/gmail.metadata` ;
   - tant que l'application est en mode *Testing*, ajoutez les adresses autorisées dans **Test users**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** :
   - type : *Web application* ;
   - *Authorized redirect URIs* : `http://localhost:8080/api/auth/google/callback`.
5. Copiez l'identifiant et le secret dans `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
6. Redémarrez le backend : `docker compose up -d backend`.

> Le scope `gmail.metadata` ne donne accès qu'aux en-têtes et libellés des e-mails, jamais à leur contenu.
> En mode *Testing*, Google invalide l'autorisation au bout de 7 jours : il faut alors se reconnecter avec Google.

## 5. Configurer la connexion GitHub

1. Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Renseignez :
   - *Homepage URL* : `http://localhost:3000` ;
   - *Authorization callback URL* : `http://localhost:8080/api/auth/github/callback`.
3. Générez un *client secret*.
4. Copiez l'identifiant et le secret dans `.env` (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`).
5. Redémarrez le backend : `docker compose up -d backend`.

Les permissions demandées sont `read:user`, `user:email` et `repo` (dépôts privés et notifications).

## 6. Lancer sans Docker (développement)

Utile pour développer avec rechargement à chaud et lancer les tests. Seule la base de données tourne dans Docker.

```bash
# 1. Installer les dépendances du backend et du frontend
make -C bonus install

# 2. Configurer le backend : créer backend/.env à partir du modèle
cp .env.example backend/.env
```

Dans `backend/.env`, adaptez au minimum :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard_db
JWT_SECRET=<résultat de : openssl rand -hex 32>
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
GITHUB_REDIRECT_URI=http://localhost:8080/api/auth/github/callback
```

```bash
# 3. Lancer PostgreSQL et Mailpit
make -C bonus db-up

# 4. Créer les tables puis remplir le catalogue
make -C bonus db-migrate
make -C bonus db-seed

# 5. Lancer le backend et le frontend ensemble
make -C bonus dev
```

Le backend lit `backend/.env` ; le frontend lit le `.env` de la racine (seulement `VITE_API_URL`, facultatif).

## 7. Commandes utiles

Ces raccourcis sont des **bonus** : ils ne sont pas nécessaires pour construire ou lancer le projet (`docker compose` suffit).
Ils se trouvent dans `bonus/Makefile` et se lancent depuis la racine du dépôt avec `make -C bonus <commande>`.

| Commande | Effet |
|---|---|
| `make -C bonus help` | Liste toutes les commandes |
| `make -C bonus up` / `make -C bonus down` | Démarre / arrête tous les conteneurs |
| `make -C bonus build` | Reconstruit les images Docker |
| `make -C bonus logs` | Affiche les journaux de tous les conteneurs en direct |
| `make -C bonus clean` | Supprime les conteneurs et les volumes (**efface la base de données**) |
| `make -C bonus install` | Installe les dépendances backend, frontend et des outils bonus en local |
| `make -C bonus dev` | Lance la base dans Docker, puis le backend et le frontend en local |
| `make -C bonus db-up` / `make -C bonus db-down` | Démarre PostgreSQL et Mailpit / arrête PostgreSQL |
| `make -C bonus db-migrate` | Crée et applique une migration à partir de `schema.prisma` |
| `make -C bonus db-seed` | Remplit le catalogue des services et widgets (en local) |
| `make -C bonus db-studio` | Ouvre Prisma Studio pour explorer la base (port 5555) |
| `make -C bonus db-reset` | Réinitialise complètement la base (**supprime toutes les données**) |
| `make -C bonus lint` / `make -C bonus typecheck` | Vérifie le style et les types du code |

## 8. Dépannage

| Problème | Cause | Solution |
|---|---|---|
| « Le catalogue … est absent. Relancez le backend pour le remplir. » | Le catalogue n'a pas été rempli (backend lancé sans Docker, ou démarrage du conteneur interrompu) | `docker compose restart backend` avec Docker, ou `make -C bonus db-seed` en local |
| Erreur Vite `Failed to resolve import "…"` dans le navigateur | Les dépendances du conteneur frontend sont anciennes (volume `node_modules` réutilisé) | `docker compose up -d --build --renew-anon-volumes frontend` |
| L'e-mail de confirmation n'arrive pas | En local, les e-mails ne partent pas vraiment | Ouvrez Mailpit (http://localhost:8025) ; le lien est aussi écrit dans les journaux du backend (`docker compose logs backend`) |
| `port is already allocated` | Un autre programme utilise un des ports | Arrêtez-le, ou changez le port de gauche dans `docker-compose.yml` |
| Google : `redirect_uri_mismatch` | L'adresse de retour ne correspond pas | Ajoutez exactement `http://localhost:8080/api/auth/google/callback` au client OAuth |
| Google : « Access blocked » ou erreur 403 | Adresse absente des *Test users* | Ajoutez-la dans l'écran de consentement OAuth |
| Widget Gmail : « Reconnectez-vous » | Gmail API désactivée, scope `gmail.metadata` absent, ou autorisation expirée | Vérifiez la [section 4](#4-configurer-la-connexion-google-et-gmail), puis reconnectez-vous avec Google |
| GitHub : « The redirect_uri is not associated with this application » | Mauvaise *callback URL* | Mettez `http://localhost:8080/api/auth/github/callback` dans l'application OAuth |
| Les modifications du schéma Prisma ne sont pas prises en compte | Client Prisma non régénéré | `make -C bonus db-generate`, puis redémarrez le backend |
