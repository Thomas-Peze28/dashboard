# API

Le backend expose une API REST sur **http://localhost:8080**. Toutes les réponses sont en JSON.

La référence complète (schémas, exemples, codes d'erreur de chaque widget) est sur **Swagger UI : http://localhost:8080/api/docs**. On peut y tester chaque route : connectez-vous avec `POST /api/auth/login`, copiez le `token`, puis cliquez sur **Authorize**.
Ce document en donne une vue d'ensemble.

## Sommaire

1. [Authentification des requêtes](#1-authentification-des-requêtes)
2. [Liste des routes](#2-liste-des-routes)
3. [`GET /about.json`](#3-get-aboutjson)
4. [Gérer les widgets d'un utilisateur](#4-gérer-les-widgets-dun-utilisateur)
5. [Erreurs](#5-erreurs)

---

## 1. Authentification des requêtes

Les routes privées attendent le JWT obtenu à la connexion, dans l'en-tête :

```http
Authorization: Bearer <token>
```

Sans token valide, la réponse est `401`. Un token est valable 24 heures.

## 2. Liste des routes

### Système

| Méthode | Route | JWT | Description |
|---|---|---|---|
| GET | `/about.json` | Non | Adresse du client, heure du serveur, services et widgets disponibles |
| GET | `/api/health` | Non | Vérifie que le serveur répond : `{ "status": "ok" }` |
| GET | `/api/docs` | Non | Documentation interactive (Swagger UI) |

### Authentification

| Méthode | Route | JWT | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Non | Crée un compte et envoie l'e-mail de confirmation. Corps : `{ email, password, name? }` ; mot de passe d'au moins 8 caractères |
| GET | `/api/auth/confirm/{token}` | Non | Confirme l'adresse (lien de l'e-mail), puis redirige vers le frontend |
| POST | `/api/auth/login` | Non | Connexion. Corps : `{ email, password }`. Renvoie `{ token, user }` |
| GET | `/api/auth/google` | Non | Connexion : redirige vers l'autorisation Google |
| POST | `/api/auth/google/link` | Oui | Liaison : renvoie `{ url }`, l'adresse d'autorisation Google qui reliera le compte à l'utilisateur connecté |
| GET | `/api/auth/google/callback` | Non | Retour de Google : vérifie le `state`, crée ou relie le compte, puis redirige vers le frontend |
| GET | `/api/auth/github` | Non | Connexion : redirige vers l'autorisation GitHub |
| POST | `/api/auth/github/link` | Oui | Liaison : renvoie `{ url }`, l'adresse d'autorisation GitHub qui reliera le compte à l'utilisateur connecté |
| GET | `/api/auth/github/callback` | Non | Retour de GitHub : vérifie le `state`, crée ou relie le compte, puis redirige vers le frontend |

### Utilisateur, catalogue et widgets

| Méthode | Route | JWT | Description |
|---|---|---|---|
| GET | `/api/users/me` | Oui | Informations de l'utilisateur connecté |
| GET | `/api/services` | Oui | Catalogue : services et widgets, avec leurs identifiants et paramètres |
| GET | `/api/widgets` | Oui | Widgets (post-it) de l'utilisateur |
| POST | `/api/widgets` | Oui | Ajoute un widget au tableau |
| PATCH | `/api/widgets/{id}` | Oui | Modifie un widget : configuration, fréquence, position, taille ou type |
| DELETE | `/api/widgets/{id}` | Oui | Supprime un widget du tableau |
| GET | `/api/widgets/{id}/data` | Oui | Données à afficher pour ce widget, calculées à partir de sa configuration |

## 3. `GET /about.json`

Route imposée par le sujet. Elle décrit le serveur et tout ce qu'il propose.

```json
{
  "client": { "host": "10.101.53.35" },
  "server": {
    "current_time": 1791533700,
    "services": [
      {
        "name": "weather",
        "widgets": [
          {
            "name": "weather_forecast",
            "description": "Daily weather forecast of a city.",
            "params": [
              { "name": "city", "type": "string" },
              { "name": "days", "type": "integer" }
            ]
          }
        ]
      }
    ]
  }
}
```

| Champ | Description |
|---|---|
| `client.host` | Adresse IP du client qui fait la requête |
| `server.current_time` | Heure du serveur, en secondes depuis le 1er janvier 1970 (timestamp Unix) |
| `server.services[]` | Les 5 services et leurs 11 widgets, avec le nom et le type (`string` ou `integer`) de chaque paramètre |

La liste est générée à partir de `backend/src/config/services.config.ts`. Le détail de chaque widget est dans [WIDGETS.md](WIDGETS.md).

## 4. Gérer les widgets d'un utilisateur

### Ajouter un widget

```http
POST /api/widgets
Authorization: Bearer <token>
Content-Type: application/json

{
  "widgetId": "<identifiant du widget dans GET /api/services>",
  "config": { "city": "Lille" },
  "refreshInterval": 600,
  "positionX": 0,
  "positionY": 0,
  "width": 2,
  "height": 2
}
```

| Champ | Obligatoire | Défaut | Description |
|---|---|---|---|
| `widgetId` | Oui | — | Identifiant du widget du catalogue |
| `config` | Oui | — | Paramètres du widget (voir [WIDGETS.md](WIDGETS.md)) ; `{}` si aucun |
| `refreshInterval` | Non | `30` | Fréquence de rafraîchissement en secondes, entier ≥ 5 |
| `positionX`, `positionY` | Non | `0` | Colonne et ligne dans la grille |
| `width`, `height` | Non | `2` | Taille en nombre de cases |

Réponse `201` : `{ "widget": { … } }`, l'instance créée avec son `id`.

### Lire les données d'un widget

```http
GET /api/widgets/{id}/data
Authorization: Bearer <token>
```

Réponse `200` : `{ "data": { … } }`. Le contenu de `data` dépend du widget, par exemple pour `weather_current` :

```json
{
  "data": {
    "city": "Lille",
    "country": "France",
    "temperature": 14.2,
    "apparentTemperature": 12.9,
    "humidity": 81,
    "windSpeed": 17.5,
    "weatherCode": 3,
    "description": "Overcast",
    "isDay": true,
    "units": { "temperature": "°C", "humidity": "%", "windSpeed": "km/h" }
  }
}
```

Le format exact de chaque widget est décrit dans Swagger UI, dans les sections « Widget - … ».

### Modifier ou supprimer

- `PATCH /api/widgets/{id}` : envoyer seulement les champs à modifier (ex. `{ "positionX": 3, "positionY": 1 }` pour déplacer).
- `DELETE /api/widgets/{id}` : réponse `204` sans contenu.

Un utilisateur ne peut lire, modifier ou supprimer que ses propres widgets ; sinon la réponse est `404`.

## 5. Erreurs

Toutes les erreurs ont la même forme :

```json
{ "error": "City not found." }
```

| Code | Signification | Exemples |
|---|---|---|
| `400` | Requête ou configuration invalide, ressource externe introuvable | mot de passe trop court, `refreshInterval` < 5, ville ou carte introuvable |
| `401` | JWT absent, invalide ou expiré ; identifiants incorrects | session de plus de 24 h |
| `403` | Accès refusé | e-mail non confirmé ; compte GitHub / Google non relié, autorisation expirée ou permission manquante |
| `404` | Introuvable | widget qui n'existe pas ou appartient à un autre utilisateur |
| `409` | Conflit | adresse e-mail déjà utilisée |
| `429` | Trop de requêtes vers GitHub ou Google | fréquence de rafraîchissement trop élevée |
| `502` | Service externe indisponible | Open-Meteo, GitHub, Gmail ou TCGdex ne répond pas |
