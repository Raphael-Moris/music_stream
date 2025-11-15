# Guide de test du rendu - Simulation professeur

Ce guide vous permet de tester votre projet comme si vous étiez le professeur qui le découvre pour la première fois.

## Objectif

Vérifier que votre projet fonctionne parfaitement quand quelqu'un :
1. Clone le dépôt GitHub
2. Suit les instructions du README
3. Lance Docker
4. Teste l'application

---

## Méthode 1 : Test dans un nouveau dossier (Recommandé)

### Étape 1 : Préparer votre dépôt GitHub

```powershell
# Dans votre dossier de projet actuel
cd "C:\Users\Raphael\Documents\IUT\BUT_Reseaux_Telecommunication\SAE SEMESTRE 3\SAE_302_projet\Projet"

# Vérifier le statut Git
git status

# Ajouter tous les fichiers non trackés (screenshots, rapport, etc.)
git add .

# Commit
git commit -m "Ajout du rapport PDF et des screenshots"

# Pousser vers GitHub
git push origin main
```

### Étape 2 : Nettoyer complètement Docker

```powershell
# Arrêter tous les conteneurs du projet
docker compose down -v

# Supprimer les images du projet
docker rmi projet-app musicstream-app
docker rmi mongo:7.0
docker rmi node:18-alpine

# Nettoyer tout Docker (optionnel mais recommandé)
docker system prune -a --volumes
# Attention : cela supprime TOUT (autres projets Docker aussi)
```

### Étape 3 : Créer un dossier de test

```powershell
# Aller dans un autre emplacement
cd C:\Users\Raphael\Desktop

# Créer un dossier de test
mkdir TEST_RENDU_SAE302
cd TEST_RENDU_SAE302
```

### Étape 4 : Cloner votre projet

```powershell
# Cloner depuis GitHub (comme le ferait le prof)
git clone https://github.com/Raphael-Moris/music_stream.git
cd music_stream

# Lister les fichiers pour vérifier
ls
```

### Étape 5 : Suivre EXACTEMENT le README

```powershell
# Copier le fichier .env
copy .env.docker .env

# Vérifier que .env existe
cat .env

# Lancer Docker (première fois)
docker compose up --build
```

### Étape 6 : Tester l'application

Ouvrir un navigateur et tester :

1. **Page d'accueil** : http://localhost:3500
2. **Connexion** : http://localhost:3500/login.html
   - Créer un compte
   - Se connecter
3. **Streaming** : http://localhost:3500/
   - Lire une musique
4. **Blind test** : http://localhost:3500/blindtest.html
   - Lancer une partie solo
5. **Admin** : http://localhost:3500/admin.html
   - Se connecter avec admin/admin
6. **Diagnostic** : http://localhost:3500/diagnostic.html
   - Vérifier que tout est vert

### Étape 7 : Checklist de validation

- [ ] Le clone fonctionne sans erreur
- [ ] Le fichier `.env.docker` est présent
- [ ] `docker compose up --build` démarre sans erreur
- [ ] MongoDB démarre et importe les données
- [ ] L'application démarre sur le port 3500
- [ ] La page de connexion s'affiche
- [ ] L'inscription fonctionne
- [ ] La connexion fonctionne
- [ ] Le player audio fonctionne
- [ ] Le blind test fonctionne
- [ ] L'admin fonctionne (admin/admin)
- [ ] Les logs Docker ne montrent pas d'erreur critique

### Étape 8 : Tester l'arrêt et le redémarrage

```powershell
# Arrêter
docker compose down

# Redémarrer (sans --build cette fois)
docker compose up
```

Vérifier que :
- [ ] Le redémarrage est rapide (~30 secondes)
- [ ] Les données sont conservées (utilisateurs créés précédemment)
- [ ] Tout fonctionne comme avant

---

## Méthode 2 : Test avec WSL2 (Linux virtuel)

Si vous voulez tester dans un environnement Linux sans machine virtuelle :

### Installation WSL2

```powershell
# Dans PowerShell en admin
wsl --install -d Ubuntu

# Redémarrer si demandé

# Lancer Ubuntu
wsl
```

### Dans Ubuntu (WSL2)

```bash
# Installer Docker dans WSL2
sudo apt update
sudo apt install docker.io docker-compose -y

# Démarrer Docker
sudo service docker start

# Aller dans un dossier de test
cd /tmp
mkdir test_sae302
cd test_sae302

# Cloner votre projet
git clone https://github.com/Raphael-Moris/music_stream.git
cd music_stream

# Copier .env
cp .env.docker .env

# Lancer Docker
sudo docker compose up --build
```

Avantage : Vous testez dans un environnement Linux (différent de votre Windows de développement)

---

## Méthode 3 : Test avec une VM (VirtualBox)

Si vous voulez un environnement complètement séparé :

### Installation

1. Télécharger VirtualBox : https://www.virtualbox.org/
2. Télécharger une ISO Ubuntu : https://ubuntu.com/download/desktop
3. Créer une VM Ubuntu (4 Go RAM, 20 Go disque)
4. Installer Ubuntu dans la VM
5. Installer Docker dans la VM
6. Cloner votre projet
7. Tester

**Inconvénient** : Long et gourmand en ressources

---

## Méthode 4 : Test en mode "fresh install"

Sur votre machine actuelle, simuler une installation fraîche :

```powershell
# Aller dans un dossier temporaire
cd C:\Temp
mkdir test_sae302
cd test_sae302

# Télécharger l'archive ZIP depuis GitHub
# (Simuler un prof qui télécharge sans Git)

# Aller sur GitHub : https://github.com/Raphael-Moris/music_stream
# Code > Download ZIP

# Extraire le ZIP dans C:\Temp\test_sae302

# Ouvrir PowerShell dans le dossier extrait
cd music_stream-main

# Suivre le README
copy .env.docker .env
docker compose up --build
```

---

## Checklist finale avant le rendu

### Fichiers à vérifier sur GitHub

- [ ] `README.md` est à jour et complet
- [ ] `.env.docker` est présent (avec les clés Cloudinary)
- [ ] `.env.example` est présent (sans secrets)
- [ ] `docker-compose.yml` est correct
- [ ] `Dockerfile` est présent
- [ ] `init-mongo.sh` est présent
- [ ] `Streaming_platform/` (dump MongoDB) est présent
- [ ] `docs/` avec toute la documentation
- [ ] `docs/screenshots/` avec les captures
- [ ] `RAPPORT_SAE302.pdf` à la racine
- [ ] `.gitignore` ignore bien `node_modules/`, `.env`, etc.

### Vérifications fonctionnelles

- [ ] Clone Git fonctionne
- [ ] `docker compose up --build` fonctionne
- [ ] Toutes les pages web sont accessibles
- [ ] L'authentification fonctionne
- [ ] Le streaming fonctionne
- [ ] Le blind test fonctionne
- [ ] L'admin fonctionne
- [ ] Pas d'erreur dans les logs Docker

### Documentation

- [ ] README.md est clair et complet
- [ ] Instructions de démarrage sont correctes
- [ ] Identifiants de test sont fournis
- [ ] Documentation technique est accessible
- [ ] Rapport PDF est présent et complet

---

## Script automatique de test

Voici un script PowerShell pour automatiser tout le test :

```powershell
# test_rendu_complet.ps1

Write-Host "=== TEST DU RENDU SAE 302 ===" -ForegroundColor Cyan
Write-Host ""

# 1. Nettoyer Docker
Write-Host "[1/7] Nettoyage Docker..." -ForegroundColor Yellow
docker compose down -v 2>$null
docker system prune -f

# 2. Créer dossier de test
Write-Host "[2/7] Création du dossier de test..." -ForegroundColor Yellow
$testPath = "C:\Temp\test_sae302_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $testPath -Force
cd $testPath

# 3. Cloner le projet
Write-Host "[3/7] Clonage du projet depuis GitHub..." -ForegroundColor Yellow
git clone https://github.com/Raphael-Moris/music_stream.git
cd music_stream

# 4. Vérifier les fichiers essentiels
Write-Host "[4/7] Vérification des fichiers..." -ForegroundColor Yellow
$required = @(
    "README.md",
    ".env.docker",
    "docker-compose.yml",
    "Dockerfile",
    "package.json",
    "server.js",
    "init-mongo.sh"
)

$missing = @()
foreach ($file in $required) {
    if (-Not (Test-Path $file)) {
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host "ERREUR: Fichiers manquants:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

# 5. Copier .env
Write-Host "[5/7] Configuration .env..." -ForegroundColor Yellow
Copy-Item .env.docker .env

# 6. Lancer Docker
Write-Host "[6/7] Démarrage Docker..." -ForegroundColor Yellow
Write-Host "Cela peut prendre quelques minutes..." -ForegroundColor Gray
docker compose up -d --build

# Attendre 60 secondes
Write-Host "Attente du démarrage complet (60s)..." -ForegroundColor Gray
Start-Sleep -Seconds 60

# 7. Tester les endpoints
Write-Host "[7/7] Test des endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "http://localhost:3500/",
    "http://localhost:3500/login.html",
    "http://localhost:3500/blindtest.html",
    "http://localhost:3500/admin.html",
    "http://localhost:3500/api/songs"
)

$success = 0
$failed = 0

foreach ($url in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  OK: $url" -ForegroundColor Green
            $success++
        }
    } catch {
        Write-Host "  ERREUR: $url - $_" -ForegroundColor Red
        $failed++
    }
}

# Résumé
Write-Host ""
Write-Host "=== RÉSUMÉ ===" -ForegroundColor Cyan
Write-Host "Dossier de test: $testPath" -ForegroundColor Gray
Write-Host "Endpoints OK: $success" -ForegroundColor Green
Write-Host "Endpoints KO: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Le projet est prêt pour le rendu!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "1. Tester manuellement dans le navigateur: http://localhost:3500"
    Write-Host "2. Vérifier les logs: docker compose logs"
    Write-Host "3. Arrêter: docker compose down"
} else {
    Write-Host ""
    Write-Host "ATTENTION: Des problèmes ont été détectés!" -ForegroundColor Yellow
    Write-Host "Vérifiez les logs: docker compose logs" -ForegroundColor Yellow
}
```

Sauvegardez ce script dans `test_rendu_complet.ps1` et exécutez :

```powershell
.\test_rendu_complet.ps1
```

---

## Conclusion

La **Méthode 1** (nouveau dossier + clone) est la plus simple et la plus fiable.

Elle vous permet de vérifier que votre projet fonctionne **exactement comme le professeur le verra**.

Bonne chance pour le rendu ! 🎉
