# Guide utilisateur

Ce guide explique comment utiliser le Dashboard, sans connaissance technique.

## Sommaire

1. [Créer un compte](#1-créer-un-compte)
2. [Se connecter](#2-se-connecter)
3. [Découvrir le tableau](#3-découvrir-le-tableau)
4. [Ajouter un widget](#4-ajouter-un-widget)
5. [Configurer chaque type de widget](#5-configurer-chaque-type-de-widget)
6. [Modifier, déplacer, supprimer un post-it](#6-modifier-déplacer-supprimer-un-post-it)
7. [Relier GitHub et Google](#7-relier-github-et-google)
8. [Se déconnecter](#8-se-déconnecter)
9. [En cas de problème](#9-en-cas-de-problème)

---

## 1. Créer un compte

Deux possibilités :

**Avec une adresse e-mail**
1. Sur la page d'accueil, choisissez l'inscription.
2. Saisissez votre nom, votre adresse e-mail et un mot de passe d'**au moins 8 caractères**, puis confirmez le mot de passe.
3. Ouvrez l'e-mail « Activez votre compte Dashboard » et cliquez sur **Confirmer mon compte**.
4. Vous revenez sur la page de connexion : votre compte est actif.

> Tant que l'adresse n'est pas confirmée, la connexion est refusée.

**Avec Google**
Cliquez sur **Continuer avec Google** et acceptez les autorisations demandées.
Le compte est créé et confirmé automatiquement. Si un compte existe déjà avec la même adresse e-mail, Google y est simplement relié.

## 2. Se connecter

- Avec votre adresse e-mail et votre mot de passe ;
- ou avec **Continuer avec Google**.

Votre session reste ouverte **24 heures**. Passé ce délai, les widgets ne se chargent plus : déconnectez-vous puis reconnectez-vous.

## 3. Découvrir le tableau

Après connexion, vous arrivez sur votre tableau : une grille de **6 colonnes × 5 lignes**.

- Une case vide sert à **ajouter** un post-it.
- Un post-it occupe 1 à 6 cases selon sa taille.
- Votre tableau est enregistré : vous le retrouvez à chaque connexion, depuis n'importe quel ordinateur.

## 4. Ajouter un widget

1. **Cliquez sur une case vide.**
2. **Choisissez une taille** :

   | Taille | Cases | Idéal pour |
   |---|---|---|
   | Petit | 1 × 1 | une information courte (heure, température, nombre d'e-mails) |
   | Moyen | 2 × 2 | un widget avec quelques détails |
   | Large | 3 × 2 | le plus d'informations (prévisions sur 10 jours, détails d'une carte Pokémon…) |

   Une taille grisée ne rentre pas à cet endroit : choisissez une autre case ou une taille plus petite.

3. **Choisissez le widget** : Horloge, Météo, Pokémon aléatoire, Carte Pokémon, GitHub ou Gmail.
4. **Configurez-le** (voir la section suivante).
5. **Choisissez la fréquence de rafraîchissement**, si le widget en propose une : de *toutes les 30 secondes* à *toutes les heures*.
6. Validez : le post-it apparaît sur le tableau.

## 5. Configurer chaque type de widget

### Horloge
Choisissez un **fuseau horaire** (par défaut, celui de votre ordinateur).
L'affichage s'adapte à la taille : heure numérique en petit, cadran à aiguilles en moyen et en large.

### Météo
- **Météo actuelle** : température, ressenti, humidité et vent.
- **Prévisions** : températures minimale et maximale jour par jour, de 1 à 10 jours (5 au maximum sur un petit post-it).

Saisissez le nom de la **ville** (par exemple *Lille*, *Tokyo*). Si la ville n'est pas trouvée, le post-it affiche « Ville introuvable ».

### Pokémon aléatoire
Choisissez la **langue** des cartes : français, anglais, allemand, espagnol, italien, portugais ou japonais.

Sur le post-it :
- 🔄 **Tirer une autre carte** affiche une nouvelle carte au hasard ;
- ❤️ **Garder cette carte** fixe la carte actuelle, qui ne changera plus. Cliquez de nouveau pour la retirer des favoris et revenir au tirage au hasard.

Passez la souris sur la carte pour l'agrandir. En grand format (3 × 2), ses détails sont affichés à côté : type, points de vie, rareté, extension, illustrateur…

### Carte Pokémon
Saisissez le **nom de la carte** dans la langue choisie : *Dracaufeu* en français, *Charizard* en anglais, *リザードン* en japonais.
La carte dont le nom correspond exactement est préférée ; sinon, la première carte trouvée est affichée.

### GitHub
Nécessite un compte GitHub relié (voir [section 7](#7-relier-github-et-google)). Trois modes :
- **Profil** : un profil GitHub (abonnés, dépôts publics…). Saisissez le nom d'un utilisateur ou d'une organisation (par exemple `torvalds`), ou laissez le champ vide pour afficher votre propre profil ;
- **Dépôt** : les statistiques d'un dépôt, à saisir sous la forme `propriétaire/dépôt` (par exemple `facebook/react`) ;
- **Notifications** : vos notifications GitHub non lues. Un curseur règle le nombre maximum de notifications récupérées (1 à 50) ; au-delà, le compteur affiche par exemple « 50+ ».

### Gmail
Nécessite un compte Google relié. Deux modes :
- **Non lus** : le nombre d'e-mails non lus de votre boîte de réception ;
- **Derniers messages** : l'expéditeur et l'objet des derniers e-mails reçus. Un curseur règle le nombre d'e-mails affichés : jusqu'à 2 sur un petit post-it, 4 sur un moyen, 6 sur un grand.

Le Dashboard lit uniquement l'expéditeur, l'objet et l'état lu / non lu de vos e-mails, **jamais leur contenu**.

## 6. Modifier, déplacer, supprimer un post-it

**Cliquez sur un post-it** pour ouvrir son menu :

| Action | Effet |
|---|---|
| **Changer la taille** | Agrandit ou réduit le post-it, s'il y a la place |
| **Changer de widget** | Modifie la configuration (ville, fuseau, fréquence…) ou remplace le widget par un autre |
| **Supprimer** | Retire le post-it du tableau |

**Pour déplacer un post-it**, faites-le glisser vers un autre emplacement.
Pendant le déplacement, un cadre indique la destination : blanc si la place est libre, rouge si elle est occupée.

Au clavier : `Tab` pour atteindre une case ou un post-it, `Entrée` pour l'ouvrir, `Échap` pour fermer une fenêtre.

## 7. Relier GitHub et Google

Les widgets GitHub et Gmail lisent **vos** données : ils ont besoin de votre autorisation.

- Lorsque vous ajoutez un de ces widgets sans avoir relié le compte, vous êtes redirigé vers GitHub ou Google pour autoriser le Dashboard, puis vous revenez sur votre tableau.
- Le compte GitHub ou Google est relié à **votre** compte Dashboard, même s'il utilise une autre adresse e-mail.
- Un compte GitHub ou Google ne peut être relié qu'à un seul utilisateur du Dashboard. S'il l'est déjà à quelqu'un d'autre, le message « Ce compte est déjà relié à un autre utilisateur du Dashboard. » s'affiche.
- Si l'autorisation expire ou est retirée, le post-it propose un bouton pour vous reconnecter.

Les autorisations demandées sont limitées au nécessaire :

| Compte | Ce que le Dashboard peut lire |
|---|---|
| GitHub | votre profil, vos dépôts et vos notifications |
| Google | votre nom, votre adresse e-mail, et les en-têtes de vos e-mails (expéditeur, objet), pas leur contenu |

Vous pouvez retirer ces autorisations à tout moment :
- GitHub : *Settings → Applications → Authorized OAuth Apps* ;
- Google : https://myaccount.google.com/permissions.

## 8. Se déconnecter

Cliquez sur le bouton de **déconnexion** du tableau. Votre tableau reste enregistré pour la prochaine connexion.

## 9. En cas de problème

| Message ou situation | Que faire |
|---|---|
| « Please confirm your email before logging in. » | Cliquez sur le lien de l'e-mail de confirmation |
| « Invalid credentials. » | Vérifiez l'adresse et le mot de passe |
| « Ville introuvable » | Vérifiez l'orthographe, ou essayez le nom en anglais |
| « Carte introuvable » | Écrivez le nom dans la langue choisie pour le widget |
| « Connectez-vous avec GitHub… » ou « Reconnectez-vous avec GitHub » | Le compte n'est pas relié ou l'autorisation a expiré : cliquez sur le bouton du post-it et acceptez |
| « Limite GitHub atteinte » ou « Limite Google atteinte » | Trop de requêtes : attendez quelques minutes, ou choisissez une fréquence de rafraîchissement plus lente |
| « Dépôt introuvable » | Vérifiez le format `propriétaire/dépôt` et que vous avez accès à ce dépôt |
| Tous les widgets sont en erreur après une longue période | Votre session de 24 heures a expiré : déconnectez-vous puis reconnectez-vous |
