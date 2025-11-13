# Guide de Préparation du Rendu - SAE 302

## Objectif

Ce guide explique comment préparer l'archive ZIP finale pour le rendu de votre projet.

---

## Contenu attendu de l'archive

Selon les consignes du rendu, l'archive ZIP doit contenir :

1. ✅ **Le rapport final** (à ajouter)
2. ✅ **Documentation technique** (Installation, utilisation...)
3. ✅ **Code source du projet** (client, serveur...)
4. ⚠️ **Les programmes client et serveur prêts à l'emploi** (facultatif)

---

## Structure de l'archive

```
SAE_302_Streaming_Musical.zip
├── README.md                          # Guide de démarrage rapide
├── RAPPORT_FINAL.pdf                  # ⚠️ À AJOUTER : Votre rapport final
│
├── docs/                              # Documentation complète
│   ├── documentation_technique.md     # Installation et utilisation détaillée
│   ├── README-DOCKER.md               # Guide Docker complet
│   ├── api_reference.md               # Référence API avec exemples
│   ├── project_contents.txt           # Liste des fichiers du projet
│   └── guide_rendu.md                 # Ce fichier
│
├── frontend/                          # Code source client
│   ├── *.html                         # Pages web
│   ├── *.js                           # Scripts JavaScript
│   └── style.css                      # Styles CSS
│
├── backend/                           # Code source serveur
│   ├── config/                        # Configuration
│   ├── models/                        # Modèles de données
│   ├── routes/                        # Routes API
│   ├── middleware/                    # Middlewares
│   └── utils/                         # Utilitaires
│
├── Streaming_platform/                # Données de seed (base de données)
│   └── *.bson                         # Exports MongoDB
│
├── server.js                          # Point d'entrée serveur
├── package.json                       # Dépendances Node.js
├── package-lock.json                  # Verrouillage des versions
├── docker-compose.yml                 # Orchestration Docker
├── Dockerfile                         # Image Docker
├── init-mongo.sh                      # Script init MongoDB
├── .env.example                       # Template configuration
└── .env.docker                        # Configuration Docker
```

---

## Étapes de préparation

### Étape 1 : Vérifier que tout fonctionne

Avant de créer l'archive, assurez-vous que le projet fonctionne correctement :

```bash
# Méthode 1 : Test avec Docker (recommandé)
cd Projet
docker compose up --build

# Ouvrir http://localhost:3500 et tester :
# - Connexion (admin/admin)
# - Lecture de musique
# - Création de playlist
# - Blind test solo
# - Blind test multijoueur
# - Dashboard admin

# Arrêter proprement
docker compose down
```

### Étape 2 : Nettoyer le projet

Supprimer les fichiers temporaires et caches :

```bash
# Supprimer node_modules (sera réinstallé à l'utilisation)
rm -rf node_modules

# Supprimer les fichiers de cache
rm -rf .npm
rm -rf backend/data/temp
rm -rf *.log

# Supprimer les fichiers .env personnels (garder .env.example et .env.docker)
# ⚠️ NE PAS supprimer .env.docker !
```

**Fichiers à conserver** :
- ✅ `.env.example` (template)
- ✅ `.env.docker` (configuration Docker)
- ❌ `.env` (supprimer si contient des secrets personnels)

### Étape 3 : Ajouter le rapport final

Placez votre rapport final PDF à la racine du projet :

```
Projet/
├── RAPPORT_FINAL.pdf          ⬅️ Ajouter ici
├── README.md
├── docs/
└── ...
```

**Nom suggéré** : `RAPPORT_FINAL_SAE302_NOM_Prenom.pdf`

### Étape 4 : Vérifier la documentation

Assurez-vous que tous les fichiers de documentation sont présents :

```bash
# Vérifier la présence des fichiers
ls -la docs/

# Doit afficher :
# - documentation_technique.md
# - README-DOCKER.md
# - api_reference.md
# - project_contents.txt
# - guide_rendu.md
```

### Étape 5 : Créer l'archive ZIP

#### Méthode 1 : Ligne de commande (Windows PowerShell)

```powershell
# Se placer dans le dossier parent
cd "C:\Users\Raphael\Documents\IUT\BUT_Reseaux_Telecommunication\SAE SEMESTRE 3\SAE_302_projet"

# Créer l'archive (exclure certains dossiers)
Compress-Archive -Path "Projet\*" -DestinationPath "SAE_302_Streaming_Musical_NOM_Prenom.zip" -CompressionLevel Optimal
```

#### Méthode 2 : Ligne de commande (Linux/macOS)

```bash
# Se placer dans le dossier parent
cd ~/Documents/IUT/SAE_302_projet

# Créer l'archive en excluant node_modules, .git, etc.
zip -r SAE_302_Streaming_Musical_NOM_Prenom.zip Projet/ \
  -x "Projet/node_modules/*" \
  -x "Projet/.git/*" \
  -x "Projet/.env" \
  -x "Projet/*.log"
```

#### Méthode 3 : Interface graphique (Windows)

1. Ouvrir l'explorateur de fichiers
2. Naviguer vers `SAE SEMESTRE 3\SAE_302_projet\`
3. Clic droit sur le dossier `Projet`
4. Sélectionner "Envoyer vers" → "Dossier compressé (zippé)"
5. Renommer en `SAE_302_Streaming_Musical_NOM_Prenom.zip`

**⚠️ Attention** : Cette méthode inclut tout, y compris `node_modules` (archive très volumineuse).

#### Méthode 4 : Script de création d'archive (recommandé)

Créez un fichier `create_archive.sh` à la racine :

```bash
#!/bin/bash
# Script de création d'archive pour le rendu

# Nom de l'archive
ARCHIVE_NAME="SAE_302_Streaming_Musical_NOM_Prenom.zip"

# Se placer dans le dossier du projet
cd "$(dirname "$0")"

echo "🗜️  Création de l'archive de rendu..."

# Créer l'archive en excluant les dossiers inutiles
zip -r "$ARCHIVE_NAME" . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".env" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "Thumbs.db" \
  -x "create_archive.sh" \
  -x "$ARCHIVE_NAME"

echo "✅ Archive créée : $ARCHIVE_NAME"
echo "📦 Taille de l'archive :"
du -h "$ARCHIVE_NAME"

echo ""
echo "📋 Checklist avant soumission :"
echo "  [ ] Le rapport final est inclus (RAPPORT_FINAL.pdf)"
echo "  [ ] La documentation est complète (docs/)"
echo "  [ ] Le code source est présent (frontend/, backend/)"
echo "  [ ] Les données de seed sont présentes (Streaming_platform/)"
echo "  [ ] Les fichiers Docker sont présents (docker-compose.yml, Dockerfile)"
echo "  [ ] Le fichier .env.example est présent"
echo "  [ ] Le README.md est à jour"
```

Puis exécuter :

```bash
# Rendre le script exécutable
chmod +x create_archive.sh

# Exécuter
./create_archive.sh
```

---

## Checklist avant soumission

Avant de soumettre l'archive, vérifiez que :

### Documents

- [ ] **Rapport final** présent à la racine (PDF)
- [ ] **README.md** complet et à jour
- [ ] **Documentation technique** complète dans `docs/`
  - [ ] `documentation_technique.md` (installation, utilisation, tests)
  - [ ] `README-DOCKER.md` (commandes Docker)
  - [ ] `api_reference.md` (endpoints API)
  - [ ] `project_contents.txt` (liste des fichiers)

### Code source

- [ ] **Code client** complet (`frontend/`)
- [ ] **Code serveur** complet (`backend/`, `server.js`)
- [ ] **Fichiers de configuration** présents
  - [ ] `package.json` et `package-lock.json`
  - [ ] `.env.example`
  - [ ] `.env.docker`

### Docker

- [ ] **docker-compose.yml** présent
- [ ] **Dockerfile** présent
- [ ] **init-mongo.sh** présent

### Base de données

- [ ] **Dossier Streaming_platform/** avec fichiers `.bson`
- [ ] Fichiers de métadonnées (`.metadata.json`)

### Nettoyage

- [ ] `node_modules/` **supprimé** (sera réinstallé à l'utilisation)
- [ ] Fichiers `.env` personnels **supprimés**
- [ ] Fichiers de cache et logs **supprimés**
- [ ] Fichier `.git/` **exclu** de l'archive (si présent)

---

## Test de l'archive

Avant de soumettre, testez l'archive :

### 1. Extraire l'archive

```bash
# Créer un dossier de test
mkdir test_rendu
cd test_rendu

# Extraire l'archive
unzip ../SAE_302_Streaming_Musical_NOM_Prenom.zip

# Ou sur Windows
# Clic droit → Extraire tout
```

### 2. Vérifier la structure

```bash
# Lister les fichiers
ls -la

# Vérifier que tous les dossiers sont présents
ls -d frontend backend docs Streaming_platform

# Vérifier la documentation
ls docs/
```

### 3. Tester le démarrage

```bash
# Méthode Docker (recommandée)
cp .env.docker .env
docker compose up --build

# Vérifier que l'application démarre correctement
# Ouvrir http://localhost:3500
# Tester la connexion (admin/admin)

# Arrêter
docker compose down
```

### 4. Vérifier la taille

L'archive ne doit **PAS** contenir `node_modules/` :

- ✅ **Taille attendue** : 50-150 Mo (selon la taille de Streaming_platform/)
- ❌ **Si > 200 Mo** : Vérifier que `node_modules` n'est pas inclus

```bash
# Vérifier la taille
du -h SAE_302_Streaming_Musical_NOM_Prenom.zip

# Ou sur Windows
# Clic droit → Propriétés
```

---

## Soumission

### Informations à inclure

Lors de la soumission, précisez :

1. **Membres du groupe** :
   - Nom, Prénom, Groupe

2. **Contenu de l'archive** :
   - Code source complet (client + serveur)
   - Documentation technique (installation, utilisation, API)
   - Données de seed (base de données de test)
   - Configuration Docker (déploiement simplifié)
   - Rapport final (PDF)

3. **Instructions de démarrage rapide** :
   ```
   1. Extraire l'archive
   2. Se placer dans le dossier : cd Projet
   3. Copier la configuration : cp .env.docker .env
   4. Lancer avec Docker : docker compose up --build
   5. Accéder à : http://localhost:3500
   6. Connexion admin : admin / admin
   ```

4. **Prérequis** :
   - Docker Desktop (Windows/macOS) ou Docker Engine (Linux)
   - Docker Compose
   - 2 Go de RAM disponible
   - 500 Mo d'espace disque

5. **Liens de documentation** :
   - README.md (démarrage rapide)
   - docs/documentation_technique.md (installation complète)
   - docs/README-DOCKER.md (guide Docker)
   - docs/api_reference.md (référence API)

---

## Troubleshooting

### L'archive est trop volumineuse (> 200 Mo)

**Cause** : `node_modules/` inclus dans l'archive

**Solution** :
```bash
# Supprimer node_modules avant de créer l'archive
rm -rf node_modules

# Recréer l'archive
```

### Impossible de créer l'archive sous Windows

**Cause** : Chemins de fichiers trop longs

**Solution** :
```powershell
# Utiliser 7-Zip ou WinRAR au lieu de l'outil Windows natif
# Ou raccourcir les chemins en déplaçant temporairement le projet :

# Déplacer le projet à la racine
mv "C:\Users\...\Projet" "C:\Projet_Temp"

# Créer l'archive
Compress-Archive -Path "C:\Projet_Temp\*" -DestinationPath "SAE_302.zip"

# Remettre en place
mv "C:\Projet_Temp" "C:\Users\...\Projet"
```

### Le fichier .gitignore apparaît dans l'archive

**Ce n'est pas grave**, mais vous pouvez l'exclure :

```bash
# Lors de la création de l'archive, ajouter :
-x ".gitignore" \
-x ".git/*"
```

### Le correcteur ne peut pas lancer l'application

**Assurez-vous que** :
1. Le README.md contient les instructions de démarrage
2. Le fichier `.env.docker` est présent
3. Le fichier `docker-compose.yml` est présent
4. Le dossier `Streaming_platform/` est présent (seed data)
5. Les instructions sont testées (voir section "Test de l'archive")

---

## Récapitulatif

**Commandes essentielles** :

```bash
# 1. Nettoyage
rm -rf node_modules
rm -f .env

# 2. Vérification
ls -la docs/
ls -la Streaming_platform/

# 3. Création de l'archive (Linux/macOS)
zip -r SAE_302_Streaming_Musical_NOM_Prenom.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".env" \
  -x "*.log"

# 4. Vérification de la taille
du -h SAE_302_Streaming_Musical_NOM_Prenom.zip

# 5. Test
mkdir test && cd test
unzip ../SAE_302_Streaming_Musical_NOM_Prenom.zip
cp .env.docker .env
docker compose up --build
```

---

## Support

En cas de problème lors de la préparation de l'archive :

1. Consultez [documentation_technique.md](./documentation_technique.md) (section Troubleshooting)
2. Vérifiez que Docker fonctionne : `docker --version`
3. Testez le projet avant de créer l'archive
4. Vérifiez que tous les fichiers listés dans [project_contents.txt](./project_contents.txt) sont présents

---

**Bon courage pour votre rendu ! 🚀**

**SAE 302 - BUT Réseaux et Télécommunications - 2ème année**
