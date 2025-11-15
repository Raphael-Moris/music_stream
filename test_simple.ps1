# Script de test simple pour le rendu SAE 302
# Sans emojis pour eviter les problemes d'encodage

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   TEST FINAL - SIMULATION PROFESSEUR" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$testFolder = "C:\Users\Raphael\Desktop\TEST_FINAL_$(Get-Date -Format 'HHmmss')"
$gitRepo = "https://github.com/Raphael-Moris/music_stream.git"

# PHASE 1 : NETTOYAGE DOCKER
Write-Host "[PHASE 1] NETTOYAGE DOCKER" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/3] Arret des conteneurs..." -ForegroundColor Gray
docker compose down -v 2>&1 | Out-Null
$containers = docker ps -aq
if ($containers) {
    docker stop $containers 2>&1 | Out-Null
    docker rm $containers 2>&1 | Out-Null
}
Write-Host "  OK - Conteneurs arretes" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Suppression de TOUS les volumes..." -ForegroundColor Gray
$volumes = docker volume ls -q
if ($volumes) {
    foreach ($vol in $volumes) {
        Write-Host "  Suppression: $vol" -ForegroundColor DarkGray
        docker volume rm $vol -f 2>&1 | Out-Null
    }
    Write-Host "  OK - $($volumes.Count) volumes supprimes" -ForegroundColor Green
} else {
    Write-Host "  OK - Aucun volume a supprimer" -ForegroundColor Green
}
Write-Host ""

Write-Host "[3/3] Nettoyage du cache Docker..." -ForegroundColor Gray
docker system prune -a -f --volumes 2>&1 | Out-Null
Write-Host "  OK - Cache nettoye" -ForegroundColor Green
Write-Host ""

# Verification finale
$remainingVolumes = docker volume ls -q
if ($remainingVolumes) {
    Write-Host "ATTENTION: Des volumes persistent encore!" -ForegroundColor Red
    docker volume ls
    Write-Host ""
}
Write-Host ""

# PHASE 2 : PREPARATION
Write-Host "[PHASE 2] PREPARATION DU DOSSIER DE TEST" -ForegroundColor Yellow
Write-Host ""

Write-Host "Creation du dossier: $testFolder" -ForegroundColor Gray
if (Test-Path $testFolder) {
    Remove-Item -Path $testFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $testFolder -Force | Out-Null
Write-Host "  OK - Dossier cree" -ForegroundColor Green
Write-Host ""

# PHASE 3 : CLONAGE
Write-Host "[PHASE 3] CLONAGE DEPUIS GITHUB" -ForegroundColor Yellow
Write-Host ""

Write-Host "Repository: $gitRepo" -ForegroundColor Gray
Set-Location $testFolder
git clone $gitRepo 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Le clonage a echoue" -ForegroundColor Red
    exit 1
}
Set-Location "music_stream"
Write-Host "  OK - Projet clone" -ForegroundColor Green
Write-Host ""

# PHASE 4 : VERIFICATION DES FICHIERS
Write-Host "[PHASE 4] VERIFICATION DES FICHIERS" -ForegroundColor Yellow
Write-Host ""

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
    Write-Host "ERREUR: Des fichiers essentiels sont manquants!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verification du dump MongoDB
Write-Host "Verification du dump MongoDB..." -ForegroundColor Gray
if (Test-Path "Streaming_platform") {
    $bsonFiles = Get-ChildItem -Path "Streaming_platform" -Filter "*.bson"
    if ($bsonFiles.Count -eq 0) {
        Write-Host "  ERREUR: Aucun fichier BSON!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK - $($bsonFiles.Count) fichiers BSON trouves" -ForegroundColor Green
    foreach ($bson in $bsonFiles) {
        $sizeKB = [math]::Round($bson.Length / 1KB, 2)
        Write-Host "    - $($bson.Name) ($sizeKB KB)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  ERREUR: Dossier Streaming_platform/ introuvable!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# PHASE 5 : CONFIGURATION
Write-Host "[PHASE 5] CONFIGURATION" -ForegroundColor Yellow
Write-Host ""

if (Test-Path ".env.docker") {
    Copy-Item ".env.docker" ".env"
    Write-Host "  OK - Fichier .env cree" -ForegroundColor Green
} else {
    Write-Host "  ERREUR: .env.docker introuvable" -ForegroundColor Red
    exit 1
}
Write-Host ""

# PHASE 6 : DEMARRAGE DOCKER
Write-Host "[PHASE 6] DEMARRAGE DOCKER" -ForegroundColor Yellow
Write-Host ""

Write-Host "Lancement de Docker Compose..." -ForegroundColor Gray
Write-Host "Cela peut prendre 2-5 minutes..." -ForegroundColor Gray
Write-Host ""

docker compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERREUR: Docker Compose a echoue!" -ForegroundColor Red
    docker compose logs --tail=50
    exit 1
}
Write-Host ""
Write-Host "  OK - Conteneurs demarres" -ForegroundColor Green
Write-Host ""

# PHASE 7 : VERIFICATION DE L'IMPORT
Write-Host "[PHASE 7] VERIFICATION DE L'IMPORT MONGODB" -ForegroundColor Yellow
Write-Host ""

Write-Host "Attente de 60 secondes pour l'import..." -ForegroundColor Gray
for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 1
    if ($i % 10 -eq 0) {
        Write-Host "  $i / 60 secondes..." -ForegroundColor DarkGray
    }
}
Write-Host "  OK - Attente terminee" -ForegroundColor Green
Write-Host ""

Write-Host "Analyse des logs MongoDB..." -ForegroundColor Gray
$mongoLogs = docker compose logs mongodb | Out-String

if ($mongoLogs -match "Restauration reussie") {
    Write-Host "  OK - Import MongoDB confirme" -ForegroundColor Green
} elseif ($mongoLogs -match "Aucun backup trouve") {
    Write-Host "  ERREUR: MongoDB n'a pas trouve le backup!" -ForegroundColor Red
    docker compose logs mongodb | Select-String -Pattern "backup|Streaming"
    exit 1
} else {
    Write-Host "  ATTENTION: Import non confirme" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Comptage des documents..." -ForegroundColor Gray
Start-Sleep -Seconds 5
$collections = docker compose exec -T mongodb mongosh Streaming_platform --quiet --eval "db.getCollectionNames().forEach(function(c) { print(c + ':' + db[c].countDocuments()); })" 2>&1

$totalDocs = 0
$collectionCount = 0
Write-Host ""
Write-Host "Collections MongoDB:" -ForegroundColor Cyan
$collections -split "`n" | ForEach-Object {
    if ($_ -match "(\w+):(\d+)") {
        $col = $matches[1]
        $count = [int]$matches[2]
        $totalDocs += $count
        $collectionCount++
        Write-Host "  - $col : $count documents" -ForegroundColor Gray
    }
}
Write-Host ""

if ($totalDocs -eq 0) {
    Write-Host "ERREUR: Aucun document importe!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifiez les logs: docker compose logs mongodb" -ForegroundColor Yellow
    exit 1
}

Write-Host "  OK - Total: $totalDocs documents importes" -ForegroundColor Green
Write-Host ""

# PHASE 8 : TEST DES ENDPOINTS
Write-Host "[PHASE 8] TEST DES ENDPOINTS HTTP" -ForegroundColor Yellow
Write-Host ""

$endpoints = @(
    @{url="http://localhost:3500/"; nom="Page d'accueil"},
    @{url="http://localhost:3500/login.html"; nom="Connexion"},
    @{url="http://localhost:3500/blindtest.html"; nom="Blind test"},
    @{url="http://localhost:3500/admin.html"; nom="Admin"},
    @{url="http://localhost:3500/api/songs"; nom="API Songs"}
)

$success = 0
$failed = 0

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  OK : $($endpoint.nom)" -ForegroundColor Green
            $success++
        }
    } catch {
        Write-Host "  ERREUR : $($endpoint.nom)" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# RESUME FINAL
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "            RESUME FINAL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dossier      : $testFolder\music_stream" -ForegroundColor Gray
Write-Host "Documents    : $totalDocs importes" -ForegroundColor Gray
Write-Host "Endpoints OK : $success / $($endpoints.Count)" -ForegroundColor Gray
Write-Host ""

if ($failed -eq 0 -and $totalDocs -gt 0) {
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "      PROJET PRET POUR LE RENDU" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Votre projet fonctionne parfaitement!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testez maintenant:" -ForegroundColor Cyan
    Write-Host "  1. http://localhost:3500" -ForegroundColor White
    Write-Host "  2. Connexion: admin/admin" -ForegroundColor White
    Write-Host "  3. Verifiez les $totalDocs documents" -ForegroundColor White
    Write-Host ""
    Write-Host "Commandes utiles:" -ForegroundColor Cyan
    Write-Host "  cd $testFolder\music_stream" -ForegroundColor Gray
    Write-Host "  docker compose logs -f" -ForegroundColor Gray
    Write-Host "  docker compose ps" -ForegroundColor Gray
    Write-Host "  docker compose down" -ForegroundColor Gray
} else {
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "      DES PROBLEMES PERSISTENT" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    if ($totalDocs -eq 0) {
        Write-Host "PROBLEME: Aucune donnee importee" -ForegroundColor Red
    }
    if ($failed -gt 0) {
        Write-Host "PROBLEME: $failed endpoint(s) ne repondent pas" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Verifiez les logs: docker compose logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
