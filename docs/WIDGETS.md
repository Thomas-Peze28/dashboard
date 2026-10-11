# Services et widgets

Le Dashboard propose **5 services** et **11 widgets**.
Un **service** est une source d'informations (la météo, GitHub…). Un **widget** est une façon d'afficher une information de ce service ; on en place autant d'**instances** que l'on veut sur son tableau, chacune avec sa propre configuration.

Ce catalogue est déclaré dans `backend/src/config/services.config.ts` et publié sur http://localhost:8080/about.json.

## Sommaire

- [Vue d'ensemble](#vue-densemble)
- [Heure (`time`)](#heure-time)
- [Météo (`weather`)](#météo-weather)
- [Pokémon (`pokemon`)](#pokémon-pokemon)
- [GitHub (`github`)](#github-github)
- [Gmail (`gmail`)](#gmail-gmail)
- [Rafraîchissement](#rafraîchissement)

## Vue d'ensemble

| Service | Widget | Paramètres | Source des données | Compte nécessaire |
|---|---|---|---|---|
| Heure | `digital_clock` | `timezone` | Navigateur / serveur | Aucun |
| Heure | `analog_clock` | `timezone` | Navigateur / serveur | Aucun |
| Météo | `weather_current` | `city` | [Open-Meteo](https://open-meteo.com/) | Aucun |
| Météo | `weather_forecast` | `city`, `days` | Open-Meteo | Aucun |
| Pokémon | `pokemon_random_card` | `language` | [TCGdex](https://tcgdex.dev/) | Aucun |
| Pokémon | `pokemon_card` | `name`, `id`, `language` | TCGdex | Aucun |
| GitHub | `github_repo` | `repository` | API GitHub | GitHub |
| GitHub | `github_profile` | `username` | API GitHub | GitHub |
| GitHub | `github_notifications` | `limit` | API GitHub | GitHub |
| Gmail | `gmail_unread_count` | aucun | API Gmail | Google |
| Gmail | `gmail_recent_threads` | `limit` | API Gmail | Google |

Les tableaux ci-dessous donnent, pour chaque paramètre, son type, sa valeur par défaut et ses limites.
Une valeur absente ou invalide est remplacée par la valeur par défaut ; une valeur hors limites est ramenée à la limite la plus proche.

---

## Heure (`time`)

Affiche l'heure et la date d'un fuseau horaire. Aucun appel à un service externe : l'heure est calculée avec l'API `Intl` de JavaScript.

### `digital_clock` et `analog_clock`

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `timezone` | string | `UTC` | Fuseau horaire IANA, ex. `Europe/Paris`, `America/New_York` |

**Données renvoyées :** `timezone`, `time` (HH:mm:ss), `date` (date complète en français).

**Dans l'interface :** le widget « Horloge » est enregistré comme `digital_clock` (`analog_clock` est disponible par l'API). Il propose une liste de fuseaux horaires (celui de l'ordinateur par défaut). L'affichage dépend de la taille du post-it : heure numérique en petit (1 × 1), cadran à aiguilles en moyen et en large. L'heure est mise à jour chaque seconde dans le navigateur.

---

## Météo (`weather`)

Données de [Open-Meteo](https://open-meteo.com/), un service gratuit sans clé d'API. Le nom de la ville est d'abord converti en coordonnées (géocodage, mis en cache par le backend), puis la météo de ces coordonnées est demandée.

### `weather_current` : météo actuelle

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `city` | string | `Paris` | Nom de la ville, ex. `Lille`, `Tokyo` |

**Données renvoyées :** ville, pays, température, température ressentie, humidité, vitesse du vent, code météo et sa description, jour ou nuit.

### `weather_forecast` : prévisions

| Paramètre | Type | Défaut | Limites | Description |
|---|---|---|---|---|
| `city` | string | `Paris` | — | Nom de la ville |
| `days` | integer | `5` | 1 à 10 | Nombre de jours de prévision |

**Données renvoyées :** pour chaque jour, la date, le code météo, les températures minimale et maximale et les précipitations.

**Dans l'interface :** un curseur règle le nombre de jours. Sur un petit post-it (1 × 1), il est limité à 5 jours faute de place.

**Erreur :** une ville inconnue affiche « Ville introuvable ».

---

## Pokémon (`pokemon`)

Cartes du jeu de cartes Pokémon, fournies par [TCGdex](https://tcgdex.dev/), un service gratuit sans clé d'API.

Langues disponibles (`language`) : `fr` (par défaut), `en`, `de`, `es`, `it`, `pt`, `ja`.
Seules les cartes qui ont une image dans la langue choisie sont affichées.

### `pokemon_random_card` : carte au hasard

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `language` | string | `fr` | Langue des cartes |

Chaque appel tire une nouvelle carte. Certaines cartes n'ont pas d'image : le backend fait jusqu'à 5 tirages pour en trouver une affichable.

### `pokemon_card` : carte choisie

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `name` | string | — (obligatoire sans `id`) | Nom de la carte dans la langue choisie, ex. `Dracaufeu` (fr), `Charizard` (en) |
| `id` | string | — | Identifiant TCGdex d'une carte précise, ex. `base1-4`. S'il est renseigné, il est prioritaire sur `name` |
| `language` | string | `fr` | Langue de la carte |

Avec `name`, la carte dont le nom correspond exactement est préférée (« Pikachu » plutôt que « Pikachu V ») ; sinon, la première carte trouvée est affichée.

**Données renvoyées (les deux widgets) :** identifiant, nom, image, catégorie, points de vie, types, stade, rareté, extension, illustrateur.

**Dans l'interface :**
- « Pokémon aléatoire » utilise `pokemon_random_card`. Un bouton tire une autre carte ; le bouton cœur **garde la carte** : le post-it devient alors un `pokemon_card` avec l'`id` de cette carte, qui ne change plus.
- « Carte Pokémon » utilise `pokemon_card` avec un nom.
- Survoler la carte l'agrandit ; en grand format (3 × 2), ses détails s'affichent à côté.

**Erreur :** aucune carte correspondante affiche « Carte introuvable ».

---

## GitHub (`github`)

Utilise l'API GitHub avec le compte GitHub de l'utilisateur, relié par OAuth (permissions `read:user`, `user:email`, `repo`).

### `github_repo` : statistiques d'un dépôt

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `repository` | string | — (obligatoire) | Dépôt au format `propriétaire/dépôt`, ex. `facebook/react` |

**Données renvoyées :** nom, description, propriétaire, langage principal, étoiles, forks, issues ouvertes, abonnés, visibilité (public / privé), branche par défaut, date du dernier push.

### `github_profile` : profil

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `username` | string | vide = votre propre profil | Nom d'utilisateur ou d'organisation GitHub |

**Données renvoyées :** identifiant, nom, type (utilisateur ou organisation), avatar, bio, entreprise, localisation, nombre de dépôts publics, d'abonnés et d'abonnements, date de création.

**Dans l'interface :** le mode « Profil » propose un champ « Utilisateur GitHub » facultatif : vide, il affiche votre propre profil. Un nom invalide (caractères interdits, plus de 39 caractères) bloque l'enregistrement.

### `github_notifications` : notifications non lues

| Paramètre | Type | Défaut | Limites | Description |
|---|---|---|---|---|
| `limit` | integer | `10` | 1 à 50 | Nombre maximal de notifications |

**Données renvoyées :** nombre de notifications et, pour chacune, titre, type (pull request, issue, release…), raison (mention, revue demandée…), dépôt, lien vers la page GitHub et date.

**Dans l'interface :** le mode « Notifications » propose un curseur de 1 à 50 (50 par défaut). Le compteur affiche « N+ » quand le nombre de notifications atteint la limite choisie ; la liste en montre jusqu'à 4 (post-it moyen) ou 8 (grand).

**Erreurs GitHub :** compte non relié ou autorisation expirée (le post-it propose de se reconnecter), dépôt ou utilisateur introuvable, limite de requêtes atteinte.

---

## Gmail (`gmail`)

Utilise l'API Gmail avec le compte Google de l'utilisateur, relié par OAuth.
Seule la permission `gmail.metadata` est demandée : **le contenu des e-mails n'est jamais lu**, seulement les libellés et les en-têtes (expéditeur, objet).
L'autorisation Google expire au bout d'une heure ; le backend la renouvelle automatiquement.

### `gmail_unread_count` : nombre d'e-mails non lus

Aucun paramètre.

**Données renvoyées :** `unread`, le nombre de messages non lus dans la boîte de réception (libellé `INBOX`, onglets Promotions et Réseaux sociaux compris).

### `gmail_recent_threads` : derniers e-mails reçus

| Paramètre | Type | Défaut | Limites | Description |
|---|---|---|---|---|
| `limit` | integer | `5` | 1 à 20 | Nombre d'e-mails à afficher |

**Données renvoyées :** pour chaque e-mail, l'expéditeur (nom et adresse), l'objet, la date de réception, l'état lu / non lu et un lien vers la conversation dans Gmail.

**Dans l'interface :** le mode « Derniers messages » propose un curseur dont le maximum dépend de la taille du post-it : 2 (petit), 4 (moyen) ou 6 (grand), 6 par défaut dans la limite de la taille.

---

## Rafraîchissement

Chaque instance de widget a sa propre fréquence de rafraîchissement, choisie lors de l'ajout ou de la modification du post-it.

| Widgets | Fréquence par défaut | Fréquences possibles |
|---|---|---|
| Météo, profil et dépôt GitHub | 10 minutes | 30 s, 1 min, 2 min, 5 min, 10 min, 30 min, 1 h |
| Notifications GitHub, Gmail | 2 minutes | idem |
| Horloge | — | mise à jour chaque seconde dans le navigateur |
| Pokémon | — | pas de rafraîchissement automatique : nouvelle carte à la demande |

La fréquence est enregistrée avec l'instance (`refreshInterval`, en secondes) ; l'API refuse les valeurs inférieures à 5 secondes.
