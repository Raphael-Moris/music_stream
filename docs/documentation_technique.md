# Documentation Technique - Plateforme de Streaming Musical

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Utilisation](#utilisation)
6. [Base de données](#base-de-données)
7. [Tests](#tests)
8. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

Cette plateforme est une application web full-stack de streaming musical avec fonctionnalité de blind test (mode solo et multijoueur en temps réel).

### Architecture technique

- **Frontend** : HTML5, CSS3, JavaScript ES6 (Vanilla JS)
- **Backend** : Node.js 18 + Express.js
- **Base de données** : MongoDB 7.0 avec Mongoose ODM
- **Temps réel** : Socket.io pour le multijoueur
- **Stockage** : Cloudinary (hébergement cloud des médias)
- **Authentification** : JWT (JSON Web Tokens) + Bcrypt
- **Conteneurisation** : Docker + Docker Compose

### Fonctionnalités principales

- Streaming audio en ligne
- Upload et gestion de bibliothèque musicale
- Création et gestion de playlists
- Blind test solo (choix multiple, 4 options)
- Blind test multijoueur (jusqu'à 6 joueurs en temps réel)
- Dashboard administrateur
- Gestion de profils utilisateurs avec avatar

---

## Prérequis

### Option 1 : Installation avec Docker (recommandée)

- **Docker Desktop** (Windows/macOS) ou **Docker Engine** (Linux)
- **Docker Compose** (inclus avec Docker Desktop)
- Minimum 2 Go de RAM disponible
- 500 Mo d'espace disque

### Option 2 : Installation locale (sans Docker)

- **Node.js** version 18 ou supérieure
- **npm** (inclus avec Node.js)
- **MongoDB** version 7.0 ou supérieure
- Minimum 2 Go de RAM disponible
- 500 Mo d'espace disque

### Vérification des versions

```bash
# Vérifier Docker
docker --version
docker compose version

# Vérifier Node.js et npm
node --version
npm --version

# Vérifier MongoDB (si installation locale)
mongod --version
```

---

## Installation

### Méthode 1 : Installation avec Docker (recommandée)

Cette méthode est la plus simple et garantit un environnement cohérent.

#### Étape 1 : Télécharger le projet

```bash
# Extraire l'archive zip du projet
unzip SAE_302_projet.zip
cd Projet
```

#### Étape 2 : Configuration de l'environnement

```bash
# Copier le fichier de configuration
cp .env.docker .env
```

Le fichier `.env` créé contient les variables par défaut pour Docker. Voir la section [Configuration](#configuration) pour plus de détails.

#### Étape 3 : Lancer l'application

```bash
# Construire et démarrer les conteneurs
docker compose up --build
```

L'application sera accessible à l'adresse : **http://localhost:3500**

**Note** : Le premier démarrage prend 2-3 minutes (téléchargement des images Docker, construction, import de la base de données).

#### Étape 4 : Vérifier le bon fonctionnement

```bash
# Dans un autre terminal, vérifier l'état des conteneurs
docker compose ps

# Vous devriez voir :
# - musicstream-mongodb (healthy)
# - musicstream-app (healthy)
```

#### Arrêt de l'application

```bash
# Arrêter les conteneurs (préserve les données)
docker compose stop

# Ou arrêter et supprimer les conteneurs (préserve toujours les données)
docker compose down
```

---

### Méthode 2 : Installation locale (sans Docker)

#### Étape 1 : Installer MongoDB

**Windows :**
1. Télécharger MongoDB Community Server sur https://www.mongodb.com/try/download/community
2. Installer avec les options par défaut
3. Démarrer MongoDB : `net start MongoDB`

**macOS (avec Homebrew) :**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Linux (Ubuntu/Debian) :**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### Étape 2 : Installer les dépendances Node.js

```bash
cd Projet
npm install
```

Cette commande installe toutes les dépendances listées dans `package.json` :
- express, mongoose, socket.io
- jsonwebtoken, bcrypt
- cloudinary, multer, music-metadata
- etc.

#### Étape 3 : Restaurer la base de données

```bash
# Importer les données de test
mongorestore --db Streaming_platform Streaming_platform/
```

Cette commande importe :
- Utilisateurs de test
- Catalogue de musiques
- Playlists prédéfinies
- Historique de jeux

#### Étape 4 : Configuration

```bash
# Copier le fichier de configuration
cp .env.docker .env
```

Éditer le fichier `.env` et modifier la variable `MONGODB_URI` :

```env
# Remplacer mongodb://mongodb:27017 par localhost
MONGODB_URI=mongodb://localhost:27017/Streaming_platform
```

#### Étape 5 : Démarrer le serveur

```bash
# Mode production
npm start

# Ou mode développement (redémarrage automatique avec nodemon)
npm run dev
```

L'application sera accessible à l'adresse : **http://localhost:3500**

---

## Configuration

### Variables d'environnement

Le fichier `.env` contient toutes les variables de configuration nécessaires.

#### Variables obligatoires

| Variable | Valeur par défaut (Docker) | Description |
|----------|---------------------------|-------------|
| `MONGODB_URI` | `mongodb://mongodb:27017/Streaming_platform` | URI de connexion MongoDB |
| `PORT` | `3500` | Port d'écoute du serveur Express |
| `JWT_SECRET` | `music_stream` | Clé secrète pour signer les tokens JWT |

#### Variables Cloudinary (stockage cloud)

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Nom de votre cloud Cloudinary | Oui |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | Oui |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | Oui |

**Note importante** : Les identifiants Cloudinary fournis dans `.env.docker` sont des identifiants de test. Pour une utilisation en production, créez votre propre compte sur https://cloudinary.com (gratuit).

#### Exemple de fichier .env complet

```env
# Configuration de la base de données
MONGODB_URI=mongodb://mongodb:27017/Streaming_platform

# Configuration du serveur
PORT=3500

# Sécurité - Token JWT
JWT_SECRET=music_stream

# Cloudinary - Stockage des médias
CLOUDINARY_CLOUD_NAME=dcyyqpt4a
CLOUDINARY_API_KEY=999954749786322
CLOUDINARY_API_SECRET=LXtGpTO0eN2t1dR5HOWihCUmKPQ
```

### Configuration de sécurité pour la production

Pour un déploiement en production, modifiez impérativement :

1. **JWT_SECRET** : Utilisez une chaîne aléatoire complexe
   ```bash
   # Générer un secret sécurisé (Linux/macOS)
   openssl rand -hex 32
   ```

2. **Identifiants MongoDB** : Activez l'authentification MongoDB
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017/Streaming_platform
   ```

3. **Cloudinary** : Utilisez vos propres identifiants

---

## Utilisation

### Accès à l'application

Une fois l'application démarrée, accédez aux différentes pages :

| Page | URL | Description |
|------|-----|-------------|
| Page de connexion | http://localhost:3500/login.html | Authentification |
| Page principale | http://localhost:3500/ | Streaming et playlists |
| Blind test | http://localhost:3500/blindtest.html | Jeu blind test |
| Administration | http://localhost:3500/admin.html | Dashboard admin |
| Diagnostic | http://localhost:3500/diagnostic.html | Vérification système |

### Comptes de test

#### Compte administrateur

- **Identifiant** : `admin`
- **Mot de passe** : `admin`
- **Privilèges** : Accès complet (gestion utilisateurs, musiques, playlists, statistiques)

#### Comptes utilisateurs (depuis la base de données importée)

Après l'import de la base de données, vous pouvez également créer vos propres comptes via la page de connexion (bouton "S'inscrire").

### Fonctionnalités par profil

#### Utilisateur standard

1. **Écouter de la musique**
   - Parcourir le catalogue
   - Rechercher des morceaux
   - Contrôles lecture/pause/volume
   - Affichage des pochettes d'album

2. **Gérer ses playlists**
   - Créer des playlists personnalisées
   - Ajouter/retirer des morceaux
   - Renommer ou supprimer des playlists

3. **Jouer au blind test**
   - Mode solo : défis personnels avec score
   - Mode multijoueur : créer ou rejoindre une salle (code à 6 chiffres)
   - Système de points avec bonus de rapidité

4. **Gérer son profil**
   - Modifier ses informations
   - Uploader un avatar
   - Consulter ses statistiques de jeu

#### Administrateur

Toutes les fonctionnalités utilisateur, plus :

1. **Gestion des utilisateurs**
   - Voir tous les utilisateurs
   - Supprimer des utilisateurs
   - Consulter les statistiques par utilisateur

2. **Gestion de la bibliothèque**
   - Uploader de nouvelles musiques
   - Supprimer des morceaux
   - Consulter les statistiques d'écoute

3. **Gestion des playlists**
   - Voir toutes les playlists (publiques et privées)
   - Créer des playlists administrateur
   - Supprimer des playlists

4. **Statistiques système**
   - Nombre total d'utilisateurs, morceaux, playlists
   - Statistiques des jeux (parties jouées, scores)
   - État de santé du système

### Workflow typique

#### Pour un utilisateur

1. **Première visite** : Créer un compte sur `/login.html`
2. **Connexion** : Se connecter avec ses identifiants
3. **Découverte** : Explorer le catalogue musical
4. **Organisation** : Créer des playlists personnalisées
5. **Jeu** : Tester ses connaissances en mode blind test

#### Pour un administrateur

1. **Connexion** : Se connecter avec `admin/admin`
2. **Gestion** : Accéder au dashboard admin (`/admin.html`)
3. **Upload** : Ajouter de nouveaux morceaux à la bibliothèque
4. **Modération** : Gérer les utilisateurs et contenus
5. **Monitoring** : Consulter les statistiques système

---

## Base de données

### Structure de la base de données

La base `Streaming_platform` contient 6 collections principales :

#### Collection `users`

Stocke les informations des utilisateurs.

```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (optionnel),
  password: String (hash bcrypt),
  profileImage: String (URL Cloudinary),
  role: String ("user" ou "admin"),
  createdAt: Date,
  updatedAt: Date
}
```

**Index** : `username` (unique)

#### Collection `songs`

Catalogue des morceaux de musique.

```javascript
{
  _id: ObjectId,
  title: String,
  artist: String,
  album: String,
  duration: Number (secondes),
  audioUrl: String (URL Cloudinary),
  coverImage: String (URL image),
  year: Number,
  playCount: Number,
  cloudinaryPublicId: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Index** : `title`, `artist`, `album` (recherche full-text)

#### Collection `playlists`

Playlists utilisateurs et administrateur.

```javascript
{
  _id: ObjectId,
  name: String,
  user: Mixed (ObjectId ou "admin"),
  songs: [ObjectId] (références vers songs),
  coverImage: String,
  createdAt: Date
}
```

#### Collection `blindTestRoom`

Salles de jeu multijoueur.

```javascript
{
  _id: ObjectId,
  code: String (unique, 6 chiffres),
  hostId: ObjectId,
  playlistId: Mixed,
  players: [{
    userId: ObjectId,
    username: String,
    score: Number,
    ready: Boolean,
    answers: [...]
  }],
  status: String ("waiting", "playing", "finished"),
  questions: [...],
  createdAt: Date,
  finishedAt: Date
}
```

#### Collection `blindTestGame`

Parties solo.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  questions: [...],
  score: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  startedAt: Date,
  finishedAt: Date
}
```

#### Collection `playerStats`

Statistiques de jeu par joueur.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  totalGames: Number,
  totalScore: Number,
  averageScore: Number,
  correctAnswers: Number,
  bestScore: Number,
  wonGames: Number,
  lastPlayedAt: Date
}
```

### Import et export de données

#### Import initial (seed)

L'import de la base de données de test se fait automatiquement au démarrage avec Docker, ou manuellement :

```bash
mongorestore --db Streaming_platform Streaming_platform/
```

Cette commande importe tous les fichiers `.bson` du dossier `Streaming_platform/` :
- `users.bson` : Utilisateurs de test
- `songs.bson` : Catalogue musical
- `playlists.bson` : Playlists prédéfinies
- `blindtestgames.bson` : Historique de parties
- `blindtestrooms.bson` : Salles de jeu archivées
- `playerStats.bson` : Statistiques de joueurs

#### Export (backup)

Pour sauvegarder l'état actuel de la base de données :

```bash
# Export complet
mongodump --db Streaming_platform --out ./backup

# Export d'une collection spécifique
mongodump --db Streaming_platform --collection users --out ./backup
```

#### Réinitialisation de la base

Pour repartir de zéro avec les données de test :

```bash
# Supprimer la base actuelle
mongo Streaming_platform --eval "db.dropDatabase()"

# Réimporter les données de test
mongorestore --db Streaming_platform Streaming_platform/
```

Avec Docker :

```bash
# Arrêter les conteneurs
docker compose down

# Supprimer le volume de données
docker volume rm projet_mongodb_data

# Redémarrer (réimport automatique)
docker compose up
```

### Requêtes utiles

#### Avec MongoDB Shell (mongosh)

```bash
# Se connecter à la base
mongosh Streaming_platform

# Compter les utilisateurs
db.users.countDocuments()

# Lister tous les utilisateurs
db.users.find().pretty()

# Trouver l'administrateur
db.users.findOne({role: "admin"})

# Compter les morceaux
db.songs.countDocuments()

# Voir les 5 morceaux les plus écoutés
db.songs.find().sort({playCount: -1}).limit(5)

# Voir toutes les playlists d'un utilisateur
db.playlists.find({user: ObjectId("USER_ID")})

# Statistiques de jeu d'un joueur
db.playerStats.findOne({userId: ObjectId("USER_ID")})
```

#### Avec Docker

```bash
# Accéder au shell MongoDB dans le conteneur
docker compose exec mongodb mongosh Streaming_platform

# Ou exécuter directement une commande
docker compose exec mongodb mongosh Streaming_platform --eval "db.users.countDocuments()"
```

---

## Tests

### Tests manuels disponibles

Le projet inclut plusieurs scripts de test dans le répertoire racine :

#### 1. Test de la logique du blind test

```bash
node test-blindtest.js
```

Vérifie :
- Génération correcte des questions
- Logique de scoring
- Gestion des réponses correctes/incorrectes

#### 2. Vérification des tokens JWT

```bash
node check-token.js
```

Teste :
- Génération de tokens JWT
- Validation et décodage
- Gestion de l'expiration (7 jours)

#### 3. Vérification des durées audio

```bash
node check-songs-duration.js
```

Vérifie que tous les morceaux en base ont une durée valide.

#### 4. Réparation des index

```bash
node fix-email-index.js
```

Utilitaire pour réparer l'index `email` (legacy) s'il pose problème.

### Tests fonctionnels (checklist manuelle)

Utilisez cette checklist pour valider toutes les fonctionnalités :

#### Authentification

- [ ] Inscription d'un nouvel utilisateur
- [ ] Connexion avec des identifiants valides
- [ ] Rejet de connexion avec identifiants invalides
- [ ] Persistance de la session (token JWT)
- [ ] Déconnexion

#### Streaming musical

- [ ] Affichage du catalogue complet
- [ ] Lecture d'un morceau
- [ ] Pause et reprise
- [ ] Contrôle du volume
- [ ] Affichage de la pochette et des métadonnées
- [ ] Barre de progression

#### Playlists

- [ ] Création d'une nouvelle playlist
- [ ] Ajout de morceaux à une playlist
- [ ] Retrait de morceaux d'une playlist
- [ ] Suppression d'une playlist
- [ ] Lecture d'une playlist complète

#### Blind test solo

- [ ] Démarrage d'une partie solo
- [ ] Affichage des questions (4 options)
- [ ] Soumission de réponses
- [ ] Calcul du score (bonus de rapidité)
- [ ] Affichage des résultats finaux

#### Blind test multijoueur

- [ ] Création d'une salle (code à 6 chiffres)
- [ ] Partage du code de salle
- [ ] Connexion d'un second joueur
- [ ] Marquage "prêt" de tous les joueurs
- [ ] Démarrage de la partie par l'hôte
- [ ] Synchronisation des questions en temps réel
- [ ] Mise à jour du leaderboard en direct
- [ ] Affichage du classement final

#### Profil utilisateur

- [ ] Affichage des informations de profil
- [ ] Modification du profil
- [ ] Upload d'un avatar
- [ ] Affichage des statistiques de jeu

#### Administration

- [ ] Connexion admin (admin/admin)
- [ ] Affichage des statistiques système
- [ ] Liste de tous les utilisateurs
- [ ] Suppression d'un utilisateur
- [ ] Liste de toutes les musiques
- [ ] Upload d'un nouveau morceau
- [ ] Suppression d'un morceau
- [ ] Gestion des playlists admin

#### Recherche

- [ ] Recherche par titre
- [ ] Recherche par artiste
- [ ] Recherche par album
- [ ] Gestion des résultats vides

### Tests Docker

#### Health checks

Les conteneurs Docker incluent des health checks automatiques.

Vérifier l'état :

```bash
# État des conteneurs
docker compose ps

# Logs en temps réel
docker compose logs -f

# Logs spécifiques à l'application
docker compose logs -f app

# Logs MongoDB
docker compose logs -f mongodb
```

Les conteneurs doivent afficher le statut `healthy` après le démarrage.

#### Test de connectivité

```bash
# Tester l'endpoint de santé de l'API
curl http://localhost:3500/api/songs

# Devrait retourner la liste des morceaux (JSON)
```

---

## Troubleshooting

### Problèmes fréquents et solutions

#### 1. "Cannot connect to MongoDB"

**Symptômes** : Erreur de connexion à la base de données

**Solutions** :

**Avec Docker** :
```bash
# Vérifier que MongoDB est démarré et healthy
docker compose ps

# Si unhealthy, consulter les logs
docker compose logs mongodb

# Redémarrer MongoDB
docker compose restart mongodb
```

**Sans Docker** :
```bash
# Vérifier que MongoDB est en cours d'exécution
# Windows
net start MongoDB

# macOS
brew services start mongodb-community@7.0

# Linux
sudo systemctl start mongod
sudo systemctl status mongod

# Vérifier la connexion
mongosh --eval "db.version()"
```

#### 2. "Port 3500 already in use"

**Symptômes** : Impossible de démarrer le serveur, port déjà occupé

**Solutions** :

**Changer le port** :
```env
# Dans .env, modifier PORT
PORT=5000
```

**Ou libérer le port** :

```bash
# Windows - Trouver le processus
netstat -ano | findstr :3500
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3500 | xargs kill -9
```

#### 3. "JWT secret is not defined"

**Symptômes** : Erreur au démarrage ou lors de l'authentification

**Solution** :

```bash
# Vérifier que le fichier .env existe
ls -la .env

# Si absent, le créer
cp .env.docker .env

# Vérifier que JWT_SECRET est défini
cat .env | grep JWT_SECRET
```

#### 4. Erreurs Cloudinary lors de l'upload

**Symptômes** : Échec de l'upload de musiques ou d'images

**Solutions** :

1. **Vérifier les identifiants Cloudinary**
   ```bash
   # Dans .env
   CLOUDINARY_CLOUD_NAME=votre_cloud_name
   CLOUDINARY_API_KEY=votre_api_key
   CLOUDINARY_API_SECRET=votre_api_secret
   ```

2. **Créer un compte gratuit** sur https://cloudinary.com
3. **Copier les identifiants** depuis le dashboard Cloudinary

#### 5. "Database authentication failed"

**Symptômes** : Erreur d'authentification MongoDB

**Solution** :

Avec Docker, le problème vient généralement de `MONGODB_URI` :

```env
# Pour Docker, utiliser le nom du service
MONGODB_URI=mongodb://mongodb:27017/Streaming_platform

# Pour installation locale, utiliser localhost
MONGODB_URI=mongodb://localhost:27017/Streaming_platform
```

#### 6. Les données ne sont pas importées

**Symptômes** : Base de données vide après démarrage

**Solutions** :

**Avec Docker** :
```bash
# Vérifier que le dossier Streaming_platform existe
ls -la Streaming_platform/

# Forcer la réimportation
docker compose down -v
docker compose up --build
```

**Sans Docker** :
```bash
# Import manuel
mongorestore --db Streaming_platform Streaming_platform/

# Vérifier l'import
mongosh Streaming_platform --eval "db.users.countDocuments()"
```

#### 7. Le multijoueur ne fonctionne pas

**Symptômes** : Impossible de créer ou rejoindre une salle

**Solutions** :

1. **Vérifier Socket.io dans les logs**
   ```bash
   docker compose logs app | grep socket
   ```

2. **Vérifier la connexion WebSocket**
   - Ouvrir la console du navigateur (F12)
   - Onglet "Network" → filtrer "WS" (WebSocket)
   - Doit montrer une connexion active

3. **Problème de CORS**
   ```javascript
   // Dans server.js, vérifier la config CORS
   app.use(cors());
   ```

#### 8. Conteneurs Docker qui redémarrent en boucle

**Symptômes** : `docker compose ps` montre des conteneurs en `Restarting`

**Solutions** :

```bash
# Consulter les logs détaillés
docker compose logs --tail=100

# Vérifier les ressources système
docker stats

# Si problème de mémoire, augmenter la RAM Docker
# Docker Desktop → Settings → Resources → Memory (min 2GB)

# Rebuild complet
docker compose down -v
docker compose up --build
```

#### 9. "Module not found" ou erreurs npm

**Symptômes** : Erreurs de dépendances manquantes

**Solutions** :

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Avec Docker, rebuild l'image
docker compose build --no-cache
```

#### 10. Les fichiers audio ne se lisent pas

**Symptômes** : Erreur de lecture audio dans le navigateur

**Solutions** :

1. **Vérifier le format** : MP3, WAV, M4A supportés
2. **Vérifier Cloudinary** : Les URLs doivent être accessibles
3. **Console navigateur** : Vérifier les erreurs CORS ou 404
4. **Tester l'URL directement** : Copier l'URL audio et l'ouvrir dans un nouvel onglet

### Logs et débogage

#### Activer les logs détaillés

**Avec Docker** :
```bash
# Logs en temps réel avec horodatage
docker compose logs -f --timestamps

# Logs depuis les 10 dernières minutes
docker compose logs --since 10m

# Exporter les logs dans un fichier
docker compose logs > debug.log
```

**Sans Docker** :
```bash
# Lancer en mode développement (logs verbeux)
npm run dev

# Ou avec debug explicite
DEBUG=* npm start
```

#### Vérifier les endpoints

```bash
# Santé de l'API
curl http://localhost:3500/api/songs

# Authentification
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Avec jq pour formater le JSON
curl http://localhost:3500/api/songs | jq
```

### Page de diagnostic

L'application inclut une page de diagnostic accessible à :

**http://localhost:3500/diagnostic.html**

Cette page affiche :
- État de connexion à l'API
- État de connexion MongoDB
- État de connexion Socket.io (multijoueur)
- Versions des dépendances
- Configuration réseau

### Support et aide

Pour des problèmes non résolus :

1. **Consulter les logs** complets
2. **Vérifier le fichier .env**
3. **Tester avec les données de base** (réimport)
4. **Consulter la documentation Docker** : [docs/README-DOCKER.md](./README-DOCKER.md)
5. **Consulter la référence API** : [docs/api_reference.md](./api_reference.md)

---

## Conclusion

Cette documentation couvre l'installation, la configuration et l'utilisation complète de la plateforme de streaming musical. Pour des informations spécifiques :

- **Docker** : Consultez [README-DOCKER.md](./README-DOCKER.md)
- **API** : Consultez [api_reference.md](./api_reference.md)
- **Contenu du projet** : Consultez [project_contents.txt](./project_contents.txt)

**Développé dans le cadre de la SAE 302 - BUT Réseaux et Télécommunications**
