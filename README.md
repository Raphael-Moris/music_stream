# Music Streaming Platform – SAE 3.02

Plateforme de streaming musical et de blind test temps réel réalisée dans le cadre de l’IUT Réseaux & Télécommunications. Le projet est intégralement conteneurisé afin de fonctionner de manière identique sur Windows, macOS ou Linux.

---

## ✨ Fonctionnalités principales

- Authentification (inscription, connexion) sécurisée par JWT + Bcrypt.
- Lecture audio, gestion de playlists, profil utilisateur avec avatar Cloudinary.
- Mode BlindTest solo & multijoueur (Socket.io) avec génération dynamique de questions.
- Back-office administrateur (gestion utilisateurs/chansons/playlists/statistiques).
- Script d’initialisation MongoDB important automatiquement le dump `Streaming_platform/`.

---

## 🧱 Stack Technique

| Côté | Technologies |
|------|--------------|
| Backend | Node.js 18, Express, Socket.io, Mongoose |
| Frontend | HTML/CSS/JS vanilla |
| Stockage | MongoDB 7 (volume Docker), Cloudinary (fichiers médias) |
| Auth | JWT, Bcrypt |
| Conteneurisation | Docker, Docker Compose |

---

## 📁 Structure rapide

```
Projet/
├─ backend/            # routes, modèles, scripts Node
├─ frontend/           # pages et assets statiques
├─ config/, temp/, data/
├─ Streaming_platform/ # dump BSON importé au démarrage Mongo
├─ docker-compose.yml
├─ Dockerfile
├─ init-mongo.sh       # restauration automatique
├─ README-DOCKER.md    # guide complet Docker (détails avancés)
└─ README.md           # ce document
```

---

## ✅ Prérequis (tous OS)

1. **Docker Desktop** (Windows/macOS) ou **Docker Engine + Docker Compose** (Linux).  
   - Vérification : `docker --version` & `docker compose version`.
2. Accès Internet pour télécharger les images Docker et accéder à Cloudinary.
3. Cloner ou décompresser le dépôt dans un chemin sans espace si possible.

---

## 🚀 Mise en route 

1. **Copier la configuration**  
   ```bash
   # Windows PowerShell
   copy .env.docker .env
   # Linux / macOS
   cp .env.docker .env
   ```
   Le fichier `.env.docker` contient déjà les identifiants nécessaires à Cloudinary et la connexion Mongo interne (pas de compte externe requis).

2. **Lancer l’application**  
   ```bash
   docker compose up --build
   ```
   - Télécharge les images, construit l’app, installe les dépendances.
   - Monte MongoDB + restaure automatiquement le dump `Streaming_platform/`.
   - Expose l’API/Frontend sur `http://localhost:3500`.

3. **Tester**  
   - Interface utilisateur : `http://localhost:3500`.  
   - Administration : `http://localhost:3500/admin.html`.  
   - Blind Test : `http://localhost:3500/blindtest.html`.  
   - Identifiants de test : voir `README-DOCKER.md` ou la collection `users`.

4. **Arrêter / relancer**  
   ```bash
   docker compose stop            # stop sans suppression
   docker compose up -d           # relance en arrière-plan
   docker compose down -v         # reset complet (containeurs + volume Mongo)
   ```

---

## 📦 Cloner & tester rapidement

1. **Récupérer le code**  
   ```bash
   git clone git@github.com:Raphael-Moris/music_stream.git
   cd music_stream
   # ou en HTTPS :
   # git clone https://github.com/Raphael-Moris/music_stream.git
   ```
2. **Préparer l’environnement**  
   ```bash
   cp .env.docker .env          # copy .env.docker .env sous PowerShell
   ```
3. **Démarrer la stack**  
   ```bash
   docker compose up --build
   ```
4. **Tester**  
   - Interface : [http://localhost:3500](http://localhost:3500)  
   - Admin : `/admin.html` – BlindTest : `/blindtest.html`
5. **Vérifier Mongo (optionnel)**  
   ```bash
   docker compose exec mongodb \
     mongosh Streaming_platform --eval "db.users.countDocuments()"
   ```
6. **Arrêter**  
   ```bash
   docker compose down
   # ou docker compose stop pour conserver les conteneurs
   ```

---

## 🧪 Vérifications rapides

```bash
# État des services
docker compose ps

# Logs applicatifs
docker compose logs -f app

# Comptage des utilisateurs importés
docker compose exec mongodb \
  mongosh Streaming_platform --eval "db.users.countDocuments()"
```

---

## 🔄 Collaboration multi-OS

- Utilisez ce README + `README-DOCKER.md` comme procédure commune (aucune différence entre Windows, Linux, macOS tant que Docker fonctionne).
- Avant de partager à un tiers (professeur, camarade) :
  1. Vérifier que `docker compose up` fonctionne sur votre OS.
  2. Confirmer que l’upload Cloudinary et le blind test fonctionnent.
  3. Mettre à jour `README-DOCKER.md` si un nouvel ajustement est nécessaire.
- Pour livrer : archive (`zip`/`tar.gz`) ou dépôt Git. Inclure `Streaming_platform/` pour garder les données.

---

## 🛠️ Développement hors Docker (optionnel)

1. Installer Node.js 18+, MongoDB local, et configurer `.env`.
2. `npm install` à la racine.
3. `npm run dev` (via `nodemon`) et ajuster `MONGODB_URI`.
4. Importer manuellement le dump avec `mongorestore`.

Docker reste la référence pour les tests croisés.

---

## ❓ Support & docs complémentaires

- `README-DOCKER.md` : guide exhaustif (dépannage, sauvegarde, FAQ).
- Scripts utilitaires : `init-mongo.sh`, `fix-email-index.js`, `check-songs-duration.js`.
- Pour toute anomalie : `docker compose logs -f`, page `diagnostic.html`, vérification du service Mongo.

---

© SAE 3.02 – IUT Réseaux & Télécommunications • Promotion 2025
