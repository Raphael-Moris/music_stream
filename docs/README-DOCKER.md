# Guide Docker - Plateforme de Streaming Musical

## Table des matières

1. [Introduction à Docker](#introduction-à-docker)
2. [Architecture Docker du projet](#architecture-docker-du-projet)
3. [Prérequis](#prérequis)
4. [Images Docker utilisées](#images-docker-utilisées)
5. [Configuration Docker Compose](#configuration-docker-compose)
6. [Commandes essentielles](#commandes-essentielles)
7. [Gestion des conteneurs](#gestion-des-conteneurs)
8. [Volumes et persistance des données](#volumes-et-persistance-des-données)
9. [Réseaux Docker](#réseaux-docker)
10. [Débogage et logs](#débogage-et-logs)
11. [Optimisation et bonnes pratiques](#optimisation-et-bonnes-pratiques)

---

## Introduction à Docker

Docker permet de conteneuriser l'application et ses dépendances dans des environnements isolés et reproductibles. Notre projet utilise Docker Compose pour orchestrer deux services :

- **MongoDB** : Base de données
- **Node.js App** : Serveur Express + API + Socket.io

### Avantages de Docker pour ce projet

✅ **Installation simplifiée** : Une seule commande pour tout installer
✅ **Environnement cohérent** : Identique sur tous les systèmes (Windows, macOS, Linux)
✅ **Isolation** : Pas de conflit avec d'autres applications
✅ **Reproductibilité** : Garantie que ça fonctionne partout pareil
✅ **Nettoyage facile** : Suppression complète sans traces

---

## Architecture Docker du projet

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────┐      ┌──────────────────┐  │
│  │  musicstream-app   │      │ musicstream-     │  │
│  │  (Node.js 18)      │◄────►│   mongodb        │  │
│  │                    │      │  (MongoDB 7.0)   │  │
│  │  Port: 3500        │      │                  │  │
│  │  Express + Socket  │      │  Port: 27017     │  │
│  └────────────────────┘      └──────────────────┘  │
│         │                            │              │
│         │                            │              │
│  ┌──────▼────────┐          ┌───────▼─────────┐   │
│  │  Network:     │          │  Volume:        │   │
│  │  musicstream- │          │  mongodb_data   │   │
│  │  network      │          │  (persistent)   │   │
│  └───────────────┘          └─────────────────┘   │
└─────────────────────────────────────────────────────┘
        │
        ▼
   Host: localhost:3500
```

---

## Prérequis

### Installation de Docker

#### Windows

1. **Télécharger Docker Desktop**
   - Site officiel : https://www.docker.com/products/docker-desktop/
   - Télécharger "Docker Desktop for Windows"

2. **Installation**
   - Exécuter l'installeur
   - Accepter les paramètres par défaut
   - Redémarrer si demandé

3. **Configuration minimale**
   - Windows 10/11 64-bit
   - WSL 2 activé (Windows Subsystem for Linux)
   - Virtualisation activée dans le BIOS
   - 4 Go de RAM minimum (2 Go alloués à Docker)

4. **Vérification**
   ```bash
   docker --version
   docker compose version
   ```

#### macOS

1. **Télécharger Docker Desktop**
   - Site officiel : https://www.docker.com/products/docker-desktop/
   - Choisir "Mac with Intel chip" ou "Mac with Apple chip"

2. **Installation**
   - Ouvrir le fichier `.dmg`
   - Glisser Docker dans Applications
   - Lancer Docker Desktop

3. **Vérification**
   ```bash
   docker --version
   docker compose version
   ```

#### Linux (Ubuntu/Debian)

```bash
# Mettre à jour les paquets
sudo apt-get update

# Installer les dépendances
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Ajouter la clé GPG Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Ajouter l'utilisateur au groupe docker (évite sudo)
sudo usermod -aG docker $USER

# Se reconnecter ou exécuter
newgrp docker

# Vérifier
docker --version
docker compose version
```

---

## Images Docker utilisées

### 1. Node.js Application (Image personnalisée)

**Fichier** : `Dockerfile` (racine du projet)

**Base** : `node:18-alpine`
- Distribution Linux Alpine (ultra-légère, ~50 Mo)
- Node.js 18 LTS préinstallé
- Optimisée pour la production

**Contenu de l'image** :

```dockerfile
# Image de base
FROM node:18-alpine

# Installation des outils de build (nécessaires pour bcrypt)
RUN apk add --no-cache python3 make g++

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --omit=dev

# Copie du code source
COPY . .

# Port exposé
EXPOSE 3500

# Health check (vérifie que l'API répond)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3500/api/songs', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Commande de démarrage
CMD ["node", "server.js"]
```

**Taille finale** : ~200 Mo (optimisée)

**Optimisations** :
- Utilisation de `npm ci` au lieu de `npm install` (plus rapide, déterministe)
- Installation uniquement des dépendances de production
- Multi-stage build (pas utilisé ici car image Alpine déjà légère)

### 2. MongoDB (Image officielle)

**Image** : `mongo:7.0`
- Image officielle MongoDB
- Version 7.0 (dernière version stable)
- Taille : ~700 Mo

**Fonctionnalités** :
- MongoDB Shell (mongosh) inclus
- Support de mongorestore/mongodump
- Optimisée pour les conteneurs
- Journalisation configurée

---

## Configuration Docker Compose

### Fichier `docker-compose.yml`

Notre orchestration définit 2 services :

```yaml
version: '3.8'

services:
  # Service MongoDB
  mongodb:
    container_name: musicstream-mongodb
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./Streaming_platform:/docker-entrypoint-initdb.d/backup
      - ./init-mongo.sh:/docker-entrypoint-initdb.d/init-mongo.sh
    networks:
      - musicstream-network
    restart: unless-stopped
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 40s

  # Service Node.js Application
  app:
    container_name: musicstream-app
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3500:3500"
    depends_on:
      mongodb:
        condition: service_healthy
    env_file:
      - .env
    volumes:
      - ./backend/data:/app/backend/data
    networks:
      - musicstream-network
    restart: unless-stopped

# Définition du réseau
networks:
  musicstream-network:
    driver: bridge

# Définition des volumes
volumes:
  mongodb_data:
    driver: local
```

### Explication détaillée

#### Service `mongodb`

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `container_name` | `musicstream-mongodb` | Nom fixe du conteneur |
| `image` | `mongo:7.0` | Image Docker Hub officielle |
| `ports` | `27017:27017` | Exposition du port MongoDB |
| `volumes` | 3 volumes montés | Données + scripts d'init |
| `networks` | `musicstream-network` | Réseau privé |
| `restart` | `unless-stopped` | Redémarrage automatique |

**Volumes montés** :
1. `mongodb_data:/data/db` - Persistance des données MongoDB
2. `./Streaming_platform:/docker-entrypoint-initdb.d/backup` - Données de seed
3. `./init-mongo.sh:/docker-entrypoint-initdb.d/init-mongo.sh` - Script d'initialisation

**Health check** :
- Commande : Ping MongoDB via mongosh
- Intervalle : 10 secondes
- Timeout : 5 secondes
- Période de démarrage : 40 secondes (grace period)
- Tentatives : 5 retries

#### Service `app`

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `container_name` | `musicstream-app` | Nom fixe du conteneur |
| `build` | `./Dockerfile` | Construction depuis Dockerfile local |
| `ports` | `3500:3500` | Exposition du port Express |
| `depends_on` | `mongodb` (healthy) | Attend que MongoDB soit opérationnel |
| `env_file` | `.env` | Variables d'environnement |
| `volumes` | `./backend/data` | Montage pour fichiers backend |
| `networks` | `musicstream-network` | Même réseau que MongoDB |

**Dépendance intelligente** :
```yaml
depends_on:
  mongodb:
    condition: service_healthy
```
→ L'app ne démarre que quand MongoDB est healthy (évite les erreurs de connexion)

---

## Commandes essentielles

### Démarrage initial

```bash
# Se placer dans le répertoire du projet
cd path/to/Projet

# Construire les images et démarrer
docker compose up --build

# Ou en arrière-plan (mode détaché)
docker compose up -d --build
```

**Première exécution** : Prend 2-3 minutes
- Téléchargement des images (node:18-alpine, mongo:7.0)
- Construction de l'image de l'application
- Démarrage des conteneurs
- Import de la base de données (via init-mongo.sh)

### Démarrages suivants

```bash
# Démarrer les conteneurs existants
docker compose up

# Ou en mode détaché
docker compose up -d
```

**Démarrages ultérieurs** : ~20-30 secondes (images déjà en cache)

### Arrêt

```bash
# Arrêter les conteneurs (préserve les données)
docker compose stop

# Arrêter et supprimer les conteneurs (données préservées dans volumes)
docker compose down

# Arrêter, supprimer conteneurs ET volumes (⚠️ perte de données)
docker compose down -v

# Arrêter, supprimer conteneurs, volumes ET images
docker compose down -v --rmi all
```

### Redémarrage

```bash
# Redémarrer tous les services
docker compose restart

# Redémarrer un service spécifique
docker compose restart app
docker compose restart mongodb
```

### Reconstruction

```bash
# Reconstruire les images (après modification du code)
docker compose build

# Reconstruire sans cache (force la reconstruction complète)
docker compose build --no-cache

# Reconstruire et redémarrer
docker compose up --build
```

---

## Gestion des conteneurs

### Visualiser les conteneurs

```bash
# Lister les conteneurs en cours
docker compose ps

# Ou avec Docker natif
docker ps

# Lister tous les conteneurs (actifs et arrêtés)
docker ps -a
```

**Sortie attendue** :
```
NAME                    IMAGE              STATUS        PORTS
musicstream-app         projet-app         Up (healthy)  0.0.0.0:3500->3500/tcp
musicstream-mongodb     mongo:7.0          Up (healthy)  0.0.0.0:27017->27017/tcp
```

### Inspecter un conteneur

```bash
# Détails complets du conteneur app
docker inspect musicstream-app

# IP du conteneur
docker inspect musicstream-app | grep IPAddress

# Voir les variables d'environnement
docker inspect musicstream-app | grep -A 20 Env
```

### Statistiques en temps réel

```bash
# Utilisation CPU, RAM, réseau, disque
docker stats

# Pour un conteneur spécifique
docker stats musicstream-app
```

### Accéder à un conteneur

```bash
# Shell interactif dans le conteneur app
docker compose exec app sh

# Shell interactif dans MongoDB
docker compose exec mongodb sh

# Exécuter une commande dans le conteneur
docker compose exec app ls -la
docker compose exec app npm list
```

### Accéder à MongoDB Shell

```bash
# Ouvrir mongosh dans le conteneur
docker compose exec mongodb mongosh Streaming_platform

# Ou directement depuis l'hôte (si MongoDB client installé)
mongosh mongodb://localhost:27017/Streaming_platform

# Exécuter une commande directement
docker compose exec mongodb mongosh Streaming_platform --eval "db.users.countDocuments()"
```

---

## Volumes et persistance des données

### Volumes définis

Notre projet utilise 2 types de volumes :

#### 1. Volume nommé (pour MongoDB)

```yaml
volumes:
  mongodb_data:
    driver: local
```

**Caractéristiques** :
- Géré par Docker
- Persistant (survit à `docker compose down`)
- Emplacement : `/var/lib/docker/volumes/` (Linux) ou Docker Desktop UI (Windows/Mac)
- Partageable entre conteneurs

#### 2. Bind mount (pour fichiers app)

```yaml
volumes:
  - ./backend/data:/app/backend/data
```

**Caractéristiques** :
- Lien direct avec le système de fichiers hôte
- Modifications instantanées (bidirectionnelles)
- Utilisé pour développement ou fichiers temporaires

### Commandes de gestion des volumes

```bash
# Lister tous les volumes Docker
docker volume ls

# Inspecter le volume MongoDB
docker volume inspect projet_mongodb_data

# Voir l'utilisation d'espace
docker system df -v

# Supprimer le volume (⚠️ perte de données)
docker compose down -v
# Ou
docker volume rm projet_mongodb_data

# Supprimer tous les volumes non utilisés
docker volume prune
```

### Sauvegarde du volume MongoDB

#### Méthode 1 : Avec mongodump (recommandée)

```bash
# Export de la base de données
docker compose exec mongodb mongodump --db Streaming_platform --out /tmp/backup

# Copier le backup vers l'hôte
docker cp musicstream-mongodb:/tmp/backup ./backup_$(date +%Y%m%d)
```

#### Méthode 2 : Backup du volume Docker

```bash
# Créer un backup complet du volume
docker run --rm \
  -v projet_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mongodb_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### Restauration depuis un backup

```bash
# Arrêter les conteneurs
docker compose down

# Supprimer l'ancien volume
docker volume rm projet_mongodb_data

# Redémarrer (réimport automatique depuis Streaming_platform/)
docker compose up

# Ou restaurer manuellement depuis un backup
docker compose exec mongodb mongorestore --db Streaming_platform /tmp/backup/Streaming_platform
```

---

## Réseaux Docker

### Réseau défini

```yaml
networks:
  musicstream-network:
    driver: bridge
```

**Type** : Bridge (réseau privé virtuel)

### Caractéristiques

- Les conteneurs sur le même réseau peuvent communiquer par nom de service
- Isolation des autres conteneurs Docker sur la machine
- Résolution DNS automatique

**Exemple** : Dans `.env`, on utilise `mongodb://mongodb:27017` au lieu de `localhost` car `mongodb` est le nom du service Docker.

### Commandes réseau

```bash
# Lister les réseaux
docker network ls

# Inspecter le réseau du projet
docker network inspect projet_musicstream-network

# Voir les conteneurs connectés
docker network inspect projet_musicstream-network | grep Name
```

### Test de connectivité

```bash
# Depuis le conteneur app, ping MongoDB
docker compose exec app ping mongodb

# Tester la connexion MongoDB depuis l'app
docker compose exec app node -e "require('mongoose').connect('mongodb://mongodb:27017/test').then(() => console.log('OK'))"
```

---

## Débogage et logs

### Consulter les logs

```bash
# Logs de tous les services
docker compose logs

# Logs en temps réel (follow)
docker compose logs -f

# Logs d'un service spécifique
docker compose logs app
docker compose logs mongodb

# Logs avec horodatage
docker compose logs -f --timestamps

# Dernières 100 lignes
docker compose logs --tail=100

# Logs depuis un moment précis
docker compose logs --since 10m
docker compose logs --since 2024-01-15T10:00:00

# Exporter les logs dans un fichier
docker compose logs > debug.log
```

### Logs en direct par service

```bash
# Terminal 1 : Logs de l'application
docker compose logs -f app

# Terminal 2 : Logs de MongoDB
docker compose logs -f mongodb
```

### Debugging dans les conteneurs

#### Vérifier la connectivité MongoDB

```bash
# Depuis le conteneur app
docker compose exec app node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb:27017/Streaming_platform')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));
"
```

#### Vérifier les variables d'environnement

```bash
# Voir toutes les variables d'env de l'app
docker compose exec app env

# Filtrer une variable spécifique
docker compose exec app env | grep MONGODB_URI
docker compose exec app env | grep JWT_SECRET
```

#### Tester les endpoints

```bash
# Depuis l'hôte
curl http://localhost:3500/api/songs

# Depuis le conteneur app (tester en interne)
docker compose exec app wget -qO- http://localhost:3500/api/songs
```

#### Vérifier les processus

```bash
# Processus dans le conteneur app
docker compose exec app ps aux

# Processus dans MongoDB
docker compose exec mongodb ps aux
```

### Health checks

Les health checks vérifient automatiquement la santé des services.

#### Vérifier l'état de santé

```bash
# État de santé global
docker compose ps

# Détails du health check
docker inspect musicstream-app --format='{{json .State.Health}}' | jq

# Historique du health check (dernières vérifications)
docker inspect musicstream-app --format='{{json .State.Health.Log}}' | jq
```

#### Déclencher manuellement le health check

```bash
# Pour l'app (teste l'endpoint /api/songs)
docker compose exec app node -e "require('http').get('http://localhost:3500/api/songs', (r) => {console.log('Status:', r.statusCode)})"

# Pour MongoDB
docker compose exec mongodb mongosh --eval "db.runCommand('ping')"
```

---

## Optimisation et bonnes pratiques

### Optimisation de l'image

#### Multi-stage builds (avancé)

Pour une image encore plus légère :

```dockerfile
# Stage 1 : Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2 : Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY . .
EXPOSE 3500
CMD ["node", "server.js"]
```

#### .dockerignore

Créer un fichier `.dockerignore` pour exclure les fichiers inutiles :

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
docs
*.md
Streaming_platform
```

→ Réduit la taille du contexte de build et accélère la construction

### Sécurité

#### Éviter root dans les conteneurs

```dockerfile
# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

#### Secrets et variables sensibles

```bash
# Ne JAMAIS commit .env dans Git
echo ".env" >> .gitignore

# Utiliser Docker secrets pour la production
docker secret create mongodb_password ./mongodb_password.txt
```

### Performance

#### Allocation de ressources

Limiter les ressources des conteneurs :

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

#### Mise en cache des layers

Les layers Docker sont mis en cache :
- Copier `package.json` **avant** le code source
- Permet de ne pas réinstaller les dépendances si package.json n'a pas changé

```dockerfile
# ✅ Bon : package.json copié séparément
COPY package*.json ./
RUN npm ci
COPY . .

# ❌ Mauvais : tout copié ensemble
COPY . .
RUN npm ci
```

### Nettoyage et maintenance

#### Nettoyage régulier

```bash
# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer les images non utilisées
docker image prune

# Supprimer les volumes non utilisés
docker volume prune

# Supprimer les réseaux non utilisés
docker network prune

# Tout nettoyer d'un coup (⚠️ attention)
docker system prune -a --volumes
```

#### Voir l'utilisation d'espace

```bash
# Résumé de l'utilisation disque
docker system df

# Détails complets
docker system df -v
```

### Monitoring en production

#### Docker Stats

```bash
# Monitoring en temps réel
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

#### Logs externes

Pour la production, exporter les logs vers un service externe :

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Scénarios courants

### Développement : Rechargement à chaud

Pour le développement, monter le code source :

```yaml
volumes:
  - .:/app
  - /app/node_modules  # Éviter d'écraser node_modules
```

Puis utiliser nodemon :

```dockerfile
CMD ["npx", "nodemon", "server.js"]
```

### Production : Déploiement sur serveur

```bash
# Sur le serveur distant
git clone <repo>
cd Projet
cp .env.docker .env
# Éditer .env avec les vrais secrets
docker compose -f docker-compose.prod.yml up -d
```

### CI/CD : Build automatique

```bash
# Dans un pipeline CI/CD
docker compose build --no-cache
docker compose up -d
docker compose run --rm app npm test
```

### Scaling : Plusieurs instances

```bash
# Lancer 3 instances de l'app
docker compose up --scale app=3
```

Nécessite un load balancer (nginx, traefik).

---

## Conclusion

Ce guide couvre l'utilisation complète de Docker pour ce projet. Pour aller plus loin :

- **Documentation officielle** : https://docs.docker.com
- **Docker Compose reference** : https://docs.docker.com/compose/compose-file/
- **Best practices** : https://docs.docker.com/develop/dev-best-practices/

**Commandes de diagnostic rapide** :

```bash
# Statut global
docker compose ps
docker stats --no-stream

# Logs récents
docker compose logs --tail=50

# Santé des services
docker inspect musicstream-app --format='{{.State.Health.Status}}'
docker inspect musicstream-mongodb --format='{{.State.Health.Status}}'

# Connectivité
docker compose exec app ping mongodb
curl http://localhost:3500/api/songs
```

**Développé dans le cadre de la SAE 302 - BUT Réseaux et Télécommunications**
