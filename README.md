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

## 🚀 Mise en route (cloner + Docker)

1. **Cloner le dépôt**
   ```bash
   git clone git@github.com:Raphael-Moris/music_stream.git
   cd music_stream
   # ou en HTTPS :
   # git clone https://github.com/Raphael-Moris/music_stream.git
   ```

2. **Copier le fichier d’environnement Docker**
   ```bash
   # Windows PowerShell
   copy .env.docker .env
   # Linux / macOS
   cp .env.docker .env
   ```
   `.env.docker` contient déjà les clés Cloudinary partagées et l’URI Mongo interne.  
   Aucun compte externe n’est requis pour tester l’application.

3. **Lancer la stack**
   ```bash
   docker compose up --build
   ```
   - Télécharge les images Node/Mongo et construit l’application.
   - Restaure automatiquement la base grâce à `Streaming_platform/`.
   - Expose l’UI / API sur `http://localhost:3500`.

4. **Tester l’application**
   - Interface utilisateur : `http://localhost:3500`
   - Page admin : `http://localhost:3500/admin.html`
   - BlindTest : `http://localhost:3500/blindtest.html`
   - Identifiants de test : voir `README-DOCKER.md` ou la collection `users`.

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

## 📚 Documentation & support

- `README-DOCKER.md` : procédures avancées, sauvegarde/restauration, FAQ.
- Scripts utiles : `init-mongo.sh`, `fix-email-index.js`, `check-songs-duration.js`.
- Page diagnostic : `http://localhost:3500/diagnostic.html`.

---

© SAE 3.02 – IUT Réseaux & Télécommunications – Promotion 2025
