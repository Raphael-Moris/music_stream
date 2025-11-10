# 🎵 Music Streaming Platform - Guide Docker

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux)
  - Téléchargement : https://www.docker.com/products/docker-desktop
  - Version minimale : Docker 20.10+, Docker Compose 2.0+

Pour vérifier votre installation :
```bash
docker --version
docker-compose --version
```

## 🚀 Démarrage Rapide

### 1. Préparer l'environnement

Renommez le fichier de configuration Docker :
```bash
# Windows (PowerShell)
copy .env.docker .env

# Linux/Mac
cp .env.docker .env
```

### 2. Lancer l'application

Une seule commande suffit pour tout démarrer :
```bash
docker-compose up -d
```

Cette commande va :
- ✅ Télécharger les images Docker nécessaires (Node.js, MongoDB)
- ✅ Construire l'image de l'application
- ✅ Créer les conteneurs (app + base de données)
- ✅ Restaurer automatiquement les données depuis `Streaming_platform/`
- ✅ Démarrer l'application sur le port 3500

### 3. Accéder à l'application

Ouvrez votre navigateur et rendez-vous sur :
- **Interface principale** : http://localhost:3500
- **Page d'administration** : http://localhost:3500/admin.html
- **BlindTest** : http://localhost:3500/blindtest.html
- **Diagnostic** : http://localhost:3500/diagnostic.html

## 🔐 Identifiants par défaut

### Administrateur (accès complet)
- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin`

### Utilisateurs de test (si importés depuis la base)
Consultez la base de données MongoDB ou créez de nouveaux comptes via l'interface d'inscription.

## 📊 Commandes Docker Utiles

### Voir les logs en temps réel
```bash
# Tous les services
docker-compose logs -f

# Seulement l'application
docker-compose logs -f app

# Seulement MongoDB
docker-compose logs -f mongodb
```

### Arrêter l'application
```bash
# Arrêter sans supprimer les données
docker-compose stop

# Arrêter et supprimer les conteneurs (les données MongoDB restent dans le volume)
docker-compose down

# Supprimer TOUT (conteneurs + volumes + données MongoDB)
docker-compose down -v
```

### Redémarrer après une modification du code
```bash
# Reconstruire et redémarrer
docker-compose up -d --build
```

### Vérifier l'état des conteneurs
```bash
docker-compose ps
```

### Accéder au shell d'un conteneur
```bash
# Shell de l'application
docker-compose exec app sh

# Shell MongoDB
docker-compose exec mongodb mongosh Streaming_platform
```

## 🗄️ Gestion de la Base de Données

### Restaurer les données manuellement

Si la restauration automatique n'a pas fonctionné :
```bash
docker-compose exec mongodb mongorestore --db=Streaming_platform /docker-entrypoint-initdb.d/backup/Streaming_platform
```

### Sauvegarder les données actuelles
```bash
docker-compose exec mongodb mongodump --db=Streaming_platform --out=/backup
docker cp musicstream-mongodb:/backup ./backup_$(date +%Y%m%d)
```

### Accéder à MongoDB avec un client
```bash
docker-compose exec mongodb mongosh Streaming_platform
```

Commandes MongoDB utiles :
```javascript
// Lister les collections
show collections

// Compter les utilisateurs
db.users.countDocuments()

// Compter les chansons
db.songs.countDocuments()

// Lister les playlists
db.playlists.find().pretty()
```

## 🏗️ Architecture du Projet

```
Projet/
├── docker-compose.yml      # Orchestration des services
├── Dockerfile              # Image de l'application Node.js
├── .dockerignore           # Fichiers exclus du build
├── .env.docker             # Variables d'environnement Docker
├── init-mongo.sh           # Script d'initialisation MongoDB
├── server.js               # Point d'entrée de l'application
├── package.json            # Dépendances Node.js
├── config/                 # Configuration (DB, etc.)
├── backend/                # Code serveur
│   ├── routes/            # Routes API (auth, songs, playlists, blindtest)
│   ├── models/            # Modèles MongoDB (User, Song, Playlist, etc.)
│   └── data/              # Données statiques (admin.json)
├── frontend/               # Interface utilisateur
│   ├── index.html         # Page principale
│   ├── login.html         # Connexion/Inscription
│   ├── admin.html         # Panel administrateur
│   ├── blindtest.html     # Mode BlindTest
│   └── *.js, *.css        # Scripts et styles
└── Streaming_platform/     # Backup MongoDB (BSON files)
```

## 🔧 Configuration Avancée

### Changer le port de l'application

Modifiez le fichier `.env` :
```env
PORT=8080
```

Puis dans `docker-compose.yml`, changez le mapping de port :
```yaml
ports:
  - "8080:8080"
```

### Persister les modifications du code en développement

Décommentez les lignes dans `docker-compose.yml` (service `app`) :
```yaml
volumes:
  - ./:/app
  - /app/node_modules
```

Puis redémarrez :
```bash
docker-compose up -d --build
```

### Activer le mode debug

Ajoutez dans `.env` :
```env
NODE_ENV=development
DEBUG=*
```

## 🐛 Dépannage

### L'application ne démarre pas
```bash
# Vérifier les logs
docker-compose logs app

# Vérifier que MongoDB est prêt
docker-compose logs mongodb
```

### MongoDB ne se connecte pas
```bash
# Vérifier le healthcheck
docker-compose ps

# Redémarrer MongoDB
docker-compose restart mongodb
```

### Port 3500 déjà utilisé
Modifiez le port dans `.env` et `docker-compose.yml`, ou arrêtez le service utilisant le port :
```bash
# Windows : trouver le processus utilisant le port 3500
netstat -ano | findstr :3500
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3500 | xargs kill -9
```

### Réinitialiser complètement le projet
```bash
# Supprimer tout (conteneurs, volumes, images)
docker-compose down -v --rmi all

# Relancer depuis zéro
docker-compose up -d --build
```

### Les données MongoDB ne s'importent pas

Vérifiez que le dossier `Streaming_platform/` contient des fichiers `.bson` et `.metadata.json` :
```bash
# Windows
dir Streaming_platform\Streaming_platform

# Linux/Mac
ls -la Streaming_platform/Streaming_platform
```

## 📦 Partager le Projet

### Option 1 : Partager le code source

Compressez tout le dossier et partagez-le :
```bash
# Windows (PowerShell)
Compress-Archive -Path Projet -DestinationPath music-streaming-docker.zip

# Linux/Mac
tar -czf music-streaming-docker.tar.gz Projet/
```

Le destinataire n'aura qu'à :
1. Extraire l'archive
2. Installer Docker Desktop
3. Exécuter `docker-compose up -d`

### Option 2 : Créer une image Docker prête à l'emploi

```bash
# Construire l'image
docker build -t music-streaming-app .

# Sauvegarder l'image
docker save music-streaming-app > music-streaming-app.tar

# Le destinataire chargera l'image avec :
docker load < music-streaming-app.tar
```

## 🎯 Fonctionnalités de l'Application

### Pour les Utilisateurs
- ✅ Inscription et connexion sécurisées (JWT)
- ✅ Écoute de musique en streaming
- ✅ Création et gestion de playlists personnalisées
- ✅ Profil utilisateur avec photo (Cloudinary)
- ✅ Mode BlindTest solo et multijoueur en temps réel

### Pour les Administrateurs
- ✅ Gestion des utilisateurs
- ✅ Ajout/suppression de chansons
- ✅ Gestion des playlists
- ✅ Statistiques globales
- ✅ Modération du contenu

### Multijoueur en Temps Réel (Socket.io)
- ✅ Création de salons de jeu
- ✅ Code de salon partageable
- ✅ Système de points avec bonus de rapidité
- ✅ Classement en direct

## 📞 Support

En cas de problème :
1. Consultez les logs : `docker-compose logs -f`
2. Vérifiez la page de diagnostic : http://localhost:3500/diagnostic.html
3. Vérifiez que Docker Desktop est bien démarré
4. Assurez-vous d'avoir les droits administrateur

## 📝 Notes Importantes

- Les données MongoDB sont persistées dans un volume Docker nommé `musicstream_mongodb_data`
- La première installation peut prendre quelques minutes (téléchargement des images)
- Le healthcheck de MongoDB attend 40 secondes avant de démarrer l'application
- Les images Cloudinary sont hébergées en ligne (connexion internet requise)
- L'application écoute sur toutes les interfaces réseau (0.0.0.0) pour permettre l'accès depuis d'autres machines du réseau local

## 🎓 Technologies Utilisées

- **Backend** : Node.js 18, Express.js, Socket.io
- **Base de données** : MongoDB 7.0
- **Authentification** : JWT (JSON Web Tokens), Bcrypt
- **Upload de fichiers** : Multer, Cloudinary
- **Frontend** : HTML5, CSS3, JavaScript (vanilla)
- **Conteneurisation** : Docker, Docker Compose

---

**Version** : 1.0.0
**Dernière mise à jour** : Janvier 2025
**Auteur** : Projet SAÉ 3.02 - IUT Réseaux et Télécommunications
