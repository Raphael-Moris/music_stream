# Plateforme de Streaming Musical – SAE 3.02

Plateforme complète de streaming et de blind-test réalisée pour l’IUT R&T (semestre 3).  
Grâce à Docker, l’application se lance à l’identique sous Windows, macOS ou Linux.

---

## ✨ Fonctionnalités clés

- Authentification (inscription / connexion) sécurisée via JWT + Bcrypt.
- Lecture musicale, gestion de playlists, profil utilisateur avec avatar Cloudinary.
- BlindTest solo & multijoueur en temps réel (Socket.io).
- Tableau de bord administrateur (utilisateurs, chansons, playlists, statistiques).
- Import automatique du dump MongoDB (`Streaming_platform/`) au démarrage.

---

## 🧱 Stack technique

| Côté       | Technologies                                 |
|------------|----------------------------------------------|
| Backend    | Node.js 18, Express, Socket.io, Mongoose     |
| Frontend   | HTML, CSS, JavaScript vanilla                |
| Stockage   | MongoDB 7 (volume Docker), Cloudinary        |
| Auth       | JWT, Bcrypt                                  |
| Infrastructure | Docker, Docker Compose                   |

---

## 📁 Organisation du dépôt

```
Projet/
├─ backend/            # Routes Express, modèles Mongoose, scripts
├─ frontend/           # Pages statiques et assets
├─ config/, data/, temp/
├─ Streaming_platform/ # Dump BSON importé dans Mongo
├─ docker-compose.yml
├─ Dockerfile
├─ init-mongo.sh       # Script de restauration automatique
├─ README-DOCKER.md    # Guide détaillé / dépannage
└─ README.md           # Guide rapide (ce fichier)
```

---

## ✅ Prérequis

1. **Docker Desktop** (Windows / macOS) ou **Docker Engine + plugin Compose** (Linux).  
   - Vérification : `docker --version` et `docker compose version`.
2. Connexion Internet (téléchargement des images + accès Cloudinary).
3. Accès Git pour cloner le dépôt.

---

## 🚀 Démarrage rapide

### Méthode 1 : Script automatique (RECOMMANDÉ)

Le script `start_projet.sh` automatise tout le processus de démarrage et vérifie que l'application fonctionne correctement.

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/Raphael-Moris/music_stream.git
   cd music_stream
   ```

2. **Lancer le script de démarrage**
   ```bash
   # Linux / macOS / Git Bash (Windows)
   ./start_projet.sh

   # Windows PowerShell
   bash start_projet.sh
   ```

Le script va :
- ✅ Vérifier que Docker est installé
- ✅ Nettoyer les anciens conteneurs
- ✅ Configurer l'environnement (.env)
- ✅ Démarrer les conteneurs Docker
- ✅ Importer automatiquement 43 documents dans MongoDB
- ✅ Tester que tout fonctionne

**Temps d'exécution** : 2-5 minutes (première fois)

### Méthode 2 : Démarrage manuel avec Docker

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/Raphael-Moris/music_stream.git
   cd music_stream
   ```

2. **Copier le fichier d'environnement**
   ```bash
   # Windows PowerShell
   copy .env.docker .env
   # Linux / macOS
   cp .env.docker .env
   ```
   `.env.docker` contient déjà les clés Cloudinary partagées et l'URI Mongo interne.
   Aucun compte externe n'est requis pour tester l'application.

3. **Lancer Docker Compose**
   ```bash
   docker compose up --build
   ```
   - Télécharge les images Node/Mongo et construit l'application
   - Restaure automatiquement la base grâce à `Streaming_platform/` (43 documents)
   - Expose l'UI / API sur `http://localhost:3500`

4. **Tester l'application**
   - Interface utilisateur : `http://localhost:3500`
   - Page de connexion : `http://localhost:3500/login.html`
   - Page admin : `http://localhost:3500/admin.html`
   - BlindTest : `http://localhost:3500/blindtest.html`

5. **Contrôles / diagnostics (optionnel)**
   ```bash
   docker compose ps
   docker compose logs -f app
   docker compose exec mongodb \
     mongosh Streaming_platform --eval "db.users.countDocuments()"
   ```

6. **Arrêter / relancer**
   ```bash
   docker compose stop          # arrête les conteneurs
   docker compose up -d         # relance en arrière-plan
   docker compose down -v       # reset complet (conteneurs + volume Mongo)
   ```

---

## 🧪 Liste de vérification rapide

- Accéder à `http://localhost:3500`, se connecter et lire une chanson.
- Uploader un titre (Cloudinary) et vérifier son enregistrement dans Mongo.
- Lancer une session BlindTest (`/blindtest.html`).
- Surveiller `docker compose logs -f` pour détecter d’éventuelles erreurs.

---

## 🤝 Collaboration multi-OS

- Tout le monde suit le même workflow Docker, sans adaptation spécifique.
- Avant de livrer à un camarade ou au professeur :
  1. Vérifier que `docker compose up --build` passe sur votre machine.
  2. Tester l’upload Cloudinary et le BlindTest.
  3. Mettre à jour `README-DOCKER.md` si un changement de procédure est nécessaire.
- Livraison : dépôt GitHub ou archive `.zip` / `.tar.gz` incluant `Streaming_platform/`.

---

## 🛠️ Exécution sans Docker (optionnel)

1. Installer Node.js 18+ et MongoDB.
2. `npm install` à la racine du projet.
3. Créer `.env` (copier `.env.docker` puis adapter `MONGODB_URI`).
4. Importer le dump : `mongorestore --db Streaming_platform Streaming_platform/`.
5. Lancer en dev : `npm run dev` (nodemon).

Docker reste toutefois l’environnement de référence pour les démonstrations / corrections.

---

## 📚 Documentation complète

### Documentation principale

Ce projet dispose d'une documentation complète et détaillée pour faciliter l'installation, l'utilisation et le rendu :

| Document | Description | Lien |
|----------|-------------|------|
| **Guide de démarrage rapide** | Ce fichier (installation Docker en 3 étapes) | [README.md](./README.md) |
| **Documentation technique** | Installation complète, configuration, utilisation, tests, troubleshooting | [docs/documentation_technique.md](./docs/documentation_technique.md) |
| **Guide Docker** | Commandes Docker avancées, volumes, réseaux, optimisation | [docs/README-DOCKER.md](./docs/README-DOCKER.md) |
| **Référence API** | Tous les endpoints REST et WebSocket avec exemples curl | [docs/api_reference.md](./docs/api_reference.md) |
| **Contenu du projet** | Liste complète des fichiers et ordre de lancement | [docs/project_contents.txt](./docs/project_contents.txt) |
| **Guide de rendu** | Instructions pour préparer l'archive ZIP finale | [docs/guide_rendu.md](./docs/guide_rendu.md) |

### Configuration

| Fichier | Description |
|---------|-------------|
| `.env.example` | Template des variables d'environnement (sans secrets) |
| `.env.docker` | Configuration Docker prête à l'emploi |

### Outils et scripts utiles

- `init-mongo.sh` : Script d'initialisation et import automatique MongoDB
- `fix-email-index.js` : Réparation des index MongoDB (legacy)
- `check-songs-duration.js` : Vérification des durées audio
- `test-blindtest.js` : Test de la logique du blind test
- `check-token.js` : Vérification des tokens JWT

### Page de diagnostic

Une page de diagnostic système est disponible pour vérifier l'état de l'application :

**URL** : `http://localhost:3500/diagnostic.html`

**Vérifications** :
- Connexion API REST
- Connexion MongoDB
- Connexion Socket.io (multijoueur)
- État des services

### Identifiants de test

La base de données pré-remplie contient plusieurs comptes de test :

**Compte administrateur** :
- Identifiant : `admin`
- Mot de passe : `admin`
- Privilèges : Accès complet (gestion users, songs, playlists, statistiques)

**Compte utilisateur avec données de test** :
- Identifiant : `Raphael`
- Mot de passe : `123456`
- Données : Playlists, historique de blind test, statistiques

**Autres comptes** : Vous pouvez créer un nouveau compte via la page de connexion ou utiliser les autres utilisateurs importés depuis la base de données.

### Points d'accès

| Page | URL | Description |
|------|-----|-------------|
| Connexion | http://localhost:3500/login.html | Authentification |
| Accueil | http://localhost:3500/ | Streaming musical |
| Blind Test | http://localhost:3500/blindtest.html | Jeu blind test (solo/multi) |
| Administration | http://localhost:3500/admin.html | Dashboard admin |
| Diagnostic | http://localhost:3500/diagnostic.html | État du système |

### API REST

**Base URL** : `http://localhost:3500/api`

**Endpoints principaux** :
- `/api/auth` - Authentification (register, login)
- `/api/songs` - Gestion des morceaux (CRUD)
- `/api/playlists` - Gestion des playlists
- `/api/blindtest` - Jeu blind test (solo/multiplayer)
- `/api/profile` - Profil utilisateur
- `/api/admin` - Administration (stats, gestion)

**Documentation complète** : [docs/api_reference.md](./docs/api_reference.md)

---

## 📦 Préparation du rendu

Pour préparer l'archive ZIP du projet pour le rendu, consultez le guide complet :

**[docs/guide_rendu.md](./docs/guide_rendu.md)**

Ce guide contient :
- Checklist complète avant soumission
- Instructions pour créer l'archive ZIP
- Procédure de test de l'archive
- Liste des fichiers à inclure/exclure
- Troubleshooting des problèmes courants

**Résumé rapide** :

```bash
# 1. Nettoyer le projet
rm -rf node_modules

# 2. Vérifier la documentation
ls -la docs/

# 3. Créer l'archive
zip -r SAE_302_Streaming_Musical.zip . \
  -x "node_modules/*" -x ".git/*" -x ".env" -x "*.log"

# 4. Vérifier la taille (doit être < 200 Mo)
du -h SAE_302_Streaming_Musical.zip
```

---

## 🆘 Support et troubleshooting

En cas de problème :

1. **Consulter la documentation technique** : [docs/documentation_technique.md](./docs/documentation_technique.md) (section Troubleshooting)
2. **Consulter le guide Docker** : [docs/README-DOCKER.md](./docs/README-DOCKER.md)
3. **Vérifier les logs** : `docker compose logs -f`
4. **Tester la page de diagnostic** : http://localhost:3500/diagnostic.html
5. **Vérifier l'état des conteneurs** : `docker compose ps`

### Problèmes courants

| Problème | Solution rapide |
|----------|----------------|
| "Cannot connect to MongoDB" | `docker compose restart mongodb` |
| "Port 3500 already in use" | Modifier `PORT` dans `.env` |
| "JWT secret is not defined" | Vérifier que `.env` existe et contient `JWT_SECRET` |
| Données non importées | `docker compose down -v` puis `docker compose up --build` |

**Documentation complète** : [docs/documentation_technique.md#troubleshooting](./docs/documentation_technique.md#troubleshooting)

---

© SAE 3.02 – IUT Réseaux & Télécommunications – Promotion 2025
