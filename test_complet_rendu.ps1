# Script de test complet du rendu SAE 302
# Ce script simule l'expérience du professeur qui teste votre projet

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLET DU RENDU SAE 302" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$testFolder = "C:\Users\Raphael\Desktop\TEST_SAE302_$(Get-Date -Format 'HHmmss')"
$gitRepo = "https://github.com/Raphael-Moris/music_stream.git"

# Étape 1 : Nettoyer Docker
Write-Host "[1/8] Nettoyage complet de Docker..." -ForegroundColor Yellow
Write-Host "  Arrêt des conteneurs existants..." -ForegroundColor Gray
docker compose down -v 2>$null
Write-Host "  Suppression des volumes et images..." -ForegroundColor Gray
docker system prune -a -f --volumes 2>$null
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 2 : Créer le dossier de test
Write-Host "[2/8] Création du dossier de test..." -ForegroundColor Yellow
if (Test-Path $testFolder) {
    Remove-Item -Path $testFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $testFolder -Force | Out-Null
Write-Host "  Dossier créé : $testFolder" -ForegroundColor Gray
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 3 : Cloner le projet depuis GitHub
Write-Host "[3/8] Clonage du projet depuis GitHub..." -ForegroundColor Yellow
Write-Host "  URL : $gitRepo" -ForegroundColor Gray
Set-Location $testFolder
git clone $gitRepo 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERREUR : Le clonage a échoué" -ForegroundColor Red
    exit 1
}
Set-Location "music_stream"
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 4 : Vérifier les fichiers essentiels
Write-Host "[4/8] Vérification des fichiers essentiels..." -ForegroundColor Yellow
$required = @(
    "README.md",
    ".env.docker",
    "docker-compose.yml",
    "Dockerfile",
    "package.json",
    "server.js",
    "init-mongo.sh",
    "Streaming_platform"
)

$allOk = $true
foreach ($file in $required) {
    if (Test-Path $file) {
        Write-Host "  OK : $file" -ForegroundColor Green
    } else {
        Write-Host "  MANQUANT : $file" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "ERREUR : Des fichiers essentiels sont manquants !" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 4b : Vérifier le contenu du dump MongoDB
Write-Host "[4b/8] Vérification du dump MongoDB..." -ForegroundColor Yellow
$bsonFiles = Get-ChildItem -Path "Streaming_platform" -Filter "*.bson"
if ($bsonFiles.Count -eq 0) {
    Write-Host "  ERREUR : Aucun fichier BSON trouvé dans Streaming_platform/" -ForegroundColor Red
    exit 1
}
Write-Host "  Fichiers BSON trouvés : $($bsonFiles.Count)" -ForegroundColor Gray
foreach ($bson in $bsonFiles) {
    Write-Host "    - $($bson.Name)" -ForegroundColor Gray
}
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 5 : Copier le fichier .env
Write-Host "[5/8] Configuration de l'environnement..." -ForegroundColor Yellow
if (Test-Path ".env.docker") {
    Copy-Item ".env.docker" ".env"
    Write-Host "  Fichier .env créé depuis .env.docker" -ForegroundColor Gray

    # Vérifier que les clés Cloudinary sont présentes
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "CLOUDINARY_CLOUD_NAME" -and
        $envContent -match "CLOUDINARY_API_KEY" -and
        $envContent -match "CLOUDINARY_API_SECRET") {
        Write-Host "  Clés Cloudinary détectées" -ForegroundColor Green
    } else {
        Write-Host "  ATTENTION : Clés Cloudinary manquantes dans .env" -ForegroundColor Yellow
    }
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "  ERREUR : .env.docker introuvable" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 6 : Lancer Docker
Write-Host "[6/8] Démarrage de Docker Compose..." -ForegroundColor Yellow
Write-Host "  Cela peut prendre 2-5 minutes (téléchargement + build)..." -ForegroundColor Gray
Write-Host "  Démarrage..." -ForegroundColor Gray

docker compose up -d --build 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERREUR : Docker Compose a échoué" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logs Docker :" -ForegroundColor Yellow
    docker compose logs --tail=50
    exit 1
}
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 7 : Attendre le démarrage complet
Write-Host "[7/8] Attente du démarrage complet..." -ForegroundColor Yellow
Write-Host "  Attente de 60 secondes..." -ForegroundColor Gray

for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 1
    if ($i % 10 -eq 0) {
        Write-Host "    $i secondes..." -ForegroundColor Gray
    }
}

Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 8 : Vérifier les logs pour l'import MongoDB
Write-Host "[8/8] Vérification de l'import MongoDB..." -ForegroundColor Yellow
$logs = docker compose logs mongodb | Out-String

if ($logs -match "Restauration réussie" -or $logs -match "done") {
    Write-Host "  Import MongoDB détecté dans les logs" -ForegroundColor Green

    # Compter les documents importés
    Write-Host ""
    Write-Host "  Vérification des collections..." -ForegroundColor Gray
    $collections = docker compose exec -T mongodb mongosh Streaming_platform --quiet --eval "db.getCollectionNames().forEach(function(c) { print(c + ':' + db[c].countDocuments()); })" 2>$null

    if ($collections) {
        Write-Host "  Collections MongoDB :" -ForegroundColor Cyan
        $collections -split "`n" | ForEach-Object {
            if ($_ -match "(\w+):(\d+)") {
                $collection = $matches[1]
                $count = $matches[2]
                Write-Host "    - $collection : $count documents" -ForegroundColor Gray
            }
        }
    }
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "  ATTENTION : L'import MongoDB n'est pas confirmé dans les logs" -ForegroundColor Yellow
    Write-Host "  Vérifiez manuellement avec : docker compose logs mongodb" -ForegroundColor Yellow
}
Write-Host ""

# Étape 9 : Tester les endpoints
Write-Host "[9/9] Test des endpoints HTTP..." -ForegroundColor Yellow

$endpoints = @(
    @{url="http://localhost:3500/"; nom="Page d'accueil"},
    @{url="http://localhost:3500/login.html"; nom="Page de connexion"},
    @{url="http://localhost:3500/blindtest.html"; nom="Blind test"},
    @{url="http://localhost:3500/admin.html"; nom="Admin"},
    @{url="http://localhost:3500/api/songs"; nom="API Songs"}
)

$success = 0
$failed = 0

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  OK : $($endpoint.nom) ($($endpoint.url))" -ForegroundColor Green
            $success++
        }
    } catch {
        Write-Host "  ERREUR : $($endpoint.nom) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# Résumé final
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "            RÉSUMÉ DU TEST" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dossier de test : $testFolder\music_stream" -ForegroundColor Gray
Write-Host ""
Write-Host "Endpoints testés :" -ForegroundColor White
Write-Host "  OK : $success" -ForegroundColor Green
Write-Host "  KO : $failed" -ForegroundColor $(if ($failed -eq 0) { "Gray" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "SUCCESS : Votre projet est prêt pour le rendu !" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "  1. Tester manuellement dans le navigateur : http://localhost:3500" -ForegroundColor White
    Write-Host "  2. Se connecter avec admin/admin" -ForegroundColor White
    Write-Host "  3. Créer un compte utilisateur" -ForegroundColor White
    Write-Host "  4. Lancer un blind test" -ForegroundColor White
    Write-Host "  5. Vérifier que les musiques sont bien présentes" -ForegroundColor White
    Write-Host ""
    Write-Host "Commandes utiles :" -ForegroundColor Cyan
    Write-Host "  cd $testFolder\music_stream" -ForegroundColor Gray
    Write-Host "  docker compose logs -f              # Voir les logs en direct" -ForegroundColor Gray
    Write-Host "  docker compose ps                   # État des conteneurs" -ForegroundColor Gray
    Write-Host "  docker compose down                 # Arrêter" -ForegroundColor Gray
    Write-Host "  docker compose down -v              # Arrêter + supprimer les données" -ForegroundColor Gray
} else {
    Write-Host "ATTENTION : Des problèmes ont été détectés !" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "Vérifiez les logs :" -ForegroundColor Cyan
    Write-Host "  docker compose logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Points à vérifier :" -ForegroundColor Cyan
    Write-Host "  - Les conteneurs sont-ils démarrés ? (docker compose ps)" -ForegroundColor White
    Write-Host "  - Y a-t-il des erreurs dans les logs ? (docker compose logs)" -ForegroundColor White
    Write-Host "  - Le port 3500 est-il libre ?" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
