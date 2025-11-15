# Script de test COMPLET et PROPRE pour le rendu SAE 302
# Ce script simule EXACTEMENT ce que fera le professeur

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TEST FINAL - SIMULATION PROFESSEUR                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$testFolder = "C:\Users\Raphael\Desktop\TEST_FINAL_$(Get-Date -Format 'HHmmss')"
$gitRepo = "https://github.com/Raphael-Moris/music_stream.git"

# ═══════════════════════════════════════════════════════════
# PHASE 1 : NETTOYAGE COMPLET DE DOCKER
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 1 : NETTOYAGE DOCKER                            ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1.1] Arrêt de TOUS les conteneurs Docker..." -ForegroundColor Yellow
$containers = docker ps -aq
if ($containers) {
    docker stop $containers 2>&1 | Out-Null
    docker rm $containers 2>&1 | Out-Null
    Write-Host "  ✓ Tous les conteneurs arrêtés et supprimés" -ForegroundColor Green
} else {
    Write-Host "  ℹ Aucun conteneur à arrêter" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[1.2] Suppression de TOUS les volumes Docker..." -ForegroundColor Yellow
$volumes = docker volume ls -q
if ($volumes) {
    docker volume rm $volumes -f 2>&1 | Out-Null
    Write-Host "  ✓ Tous les volumes supprimés ($($volumes.Count) volumes)" -ForegroundColor Green
} else {
    Write-Host "  ℹ Aucun volume à supprimer" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[1.3] Nettoyage du cache Docker..." -ForegroundColor Yellow
docker system prune -a -f --volumes 2>&1 | Out-Null
Write-Host "  ✓ Cache nettoyé" -ForegroundColor Green
Write-Host ""

# Vérification
$remainingVolumes = docker volume ls -q
if ($remainingVolumes) {
    Write-Host "  ⚠ ATTENTION : Des volumes persistent encore !" -ForegroundColor Red
    docker volume ls
    Write-Host ""
    $force = Read-Host "Voulez-vous continuer quand même ? (O/N)"
    if ($force -ne "O" -and $force -ne "o") {
        exit 1
    }
} else {
    Write-Host "  ✓ Vérification : Plus aucun volume Docker" -ForegroundColor Green
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PHASE 2 : PRÉPARATION DU DOSSIER DE TEST
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 2 : PRÉPARATION                                 ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "[2.1] Suppression de l'ancien dossier de test..." -ForegroundColor Yellow
if (Test-Path $testFolder) {
    Remove-Item -Path $testFolder -Recurse -Force
}
Write-Host "  ✓ Dossier nettoyé" -ForegroundColor Green
Write-Host ""

Write-Host "[2.2] Création du nouveau dossier de test..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $testFolder -Force | Out-Null
Write-Host "  ✓ Dossier créé : $testFolder" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PHASE 3 : CLONAGE DEPUIS GITHUB
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 3 : CLONAGE GITHUB                              ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "[3.1] Clonage du dépôt Git..." -ForegroundColor Yellow
Write-Host "  Repository : $gitRepo" -ForegroundColor Gray
Set-Location $testFolder
$cloneOutput = git clone $gitRepo 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✖ ERREUR : Le clonage a échoué" -ForegroundColor Red
    Write-Host $cloneOutput
    exit 1
}
Set-Location "music_stream"
Write-Host "  ✓ Projet cloné avec succès" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PHASE 4 : VÉRIFICATION DES FICHIERS
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 4 : VÉRIFICATION DES FICHIERS                   ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
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
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✖ $file MANQUANT !" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "ERREUR : Des fichiers essentiels sont manquants !" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[4.1] Vérification du dump MongoDB..." -ForegroundColor Yellow
if (Test-Path "Streaming_platform") {
    $bsonFiles = Get-ChildItem -Path "Streaming_platform" -Filter "*.bson"
    if ($bsonFiles.Count -eq 0) {
        Write-Host "  ✖ ERREUR : Aucun fichier BSON dans Streaming_platform/ !" -ForegroundColor Red
        Write-Host "  Le dossier existe mais est vide." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  ✓ Fichiers BSON trouvés : $($bsonFiles.Count)" -ForegroundColor Green
    foreach ($bson in $bsonFiles) {
        $sizeKB = [math]::Round($bson.Length / 1KB, 2)
        Write-Host "    • $($bson.Name) ($sizeKB KB)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✖ ERREUR : Dossier Streaming_platform/ introuvable !" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PHASE 5 : CONFIGURATION
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 5 : CONFIGURATION                               ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "[5.1] Copie du fichier .env..." -ForegroundColor Yellow
if (Test-Path ".env.docker") {
    Copy-Item ".env.docker" ".env"
    $envContent = Get-Content ".env" -Raw

    # Vérifier les clés Cloudinary
    if ($envContent -match "CLOUDINARY_CLOUD_NAME=(\w+)" -and $matches[1] -ne "") {
        Write-Host "  ✓ Cloudinary Cloud Name : $($matches[1])" -ForegroundColor Green
    }
    if ($envContent -match "CLOUDINARY_API_KEY=(\d+)" -and $matches[1] -ne "") {
        Write-Host "  ✓ Cloudinary API Key : $($matches[1])" -ForegroundColor Green
    }
    if ($envContent -match "CLOUDINARY_API_SECRET=(\w+)" -and $matches[1] -ne "") {
        Write-Host "  ✓ Cloudinary API Secret configuré" -ForegroundColor Green
    }

    Write-Host "  ✓ Fichier .env créé" -ForegroundColor Green
} else {
    Write-Host "  ✖ ERREUR : .env.docker introuvable" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PHASE 6 : DÉMARRAGE DOCKER
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 6 : DÉMARRAGE DOCKER                            ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "[6.1] Lancement de Docker Compose..." -ForegroundColor Yellow
Write-Host "  Cela peut prendre 2-5 minutes (téléchargement + build)" -ForegroundColor Gray
Write-Host "  Veuillez patienter..." -ForegroundColor Gray
Write-Host ""

docker compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  ✖ ERREUR : Docker Compose a échoué !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logs Docker :" -ForegroundColor Yellow
    docker compose logs --tail=50
    exit 1
}
Write-Host ""
Write-Host "  ✓ Conteneurs démarrés" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PHASE 7 : ATTENTE ET VÉRIFICATION
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 7 : VÉRIFICATION DE L'IMPORT                    ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "[7.1] Attente du démarrage complet (60 secondes)..." -ForegroundColor Yellow
for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 1
    if ($i % 10 -eq 0) {
        Write-Host "  $i / 60 secondes..." -ForegroundColor Gray
    }
}
Write-Host "  ✓ Attente terminée" -ForegroundColor Green
Write-Host ""

Write-Host "[7.2] Analyse des logs MongoDB..." -ForegroundColor Yellow
$mongoLogs = docker compose logs mongodb | Out-String

if ($mongoLogs -match "Restauration réussie") {
    Write-Host "  ✓ Import MongoDB confirmé dans les logs" -ForegroundColor Green
} elseif ($mongoLogs -match "Aucun backup trouvé") {
    Write-Host "  ✖ ERREUR : MongoDB n'a pas trouvé le backup !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logs MongoDB :" -ForegroundColor Yellow
    docker compose logs mongodb | Select-String -Pattern "backup|Streaming"
    exit 1
} else {
    Write-Host "  ⚠ Import non confirmé (logs ambigus)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[7.3] Comptage des documents dans MongoDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$collections = docker compose exec -T mongodb mongosh Streaming_platform --quiet --eval "db.getCollectionNames().forEach(function(c) { print(c + ':' + db[c].countDocuments()); })" 2>&1

if ($collections -match "Error" -or $collections -match "failed") {
    Write-Host "  ✖ ERREUR : Impossible de se connecter à MongoDB" -ForegroundColor Red
    Write-Host $collections
    exit 1
}

$totalDocs = 0
$collectionCount = 0
Write-Host ""
Write-Host "  Collections MongoDB :" -ForegroundColor Cyan
$collections -split "`n" | ForEach-Object {
    if ($_ -match "(\w+):(\d+)") {
        $col = $matches[1]
        $count = [int]$matches[2]
        $totalDocs += $count
        $collectionCount++
        Write-Host "    • $col : $count documents" -ForegroundColor Gray
    }
}
Write-Host ""

if ($totalDocs -eq 0) {
    Write-Host "  ✖ ERREUR : Aucun document importé !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Diagnostic :" -ForegroundColor Yellow
    Write-Host "  1. Vérifiez que Streaming_platform/ contient bien des fichiers .bson" -ForegroundColor Yellow
    Write-Host "  2. Vérifiez les logs MongoDB : docker compose logs mongodb" -ForegroundColor Yellow
    Write-Host "  3. Tentez un import manuel :" -ForegroundColor Yellow
    Write-Host "     docker compose exec mongodb mongorestore --db=Streaming_platform /docker-entrypoint-initdb.d/backup" -ForegroundColor Gray
    exit 1
}

Write-Host "  ✓ Total : $totalDocs documents importés dans $collectionCount collections" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PHASE 8 : TEST DES ENDPOINTS HTTP
# ═══════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  PHASE 8 : TEST DES ENDPOINTS HTTP                     ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

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
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $($endpoint.nom)" -ForegroundColor Green
            $success++
        }
    } catch {
        Write-Host "  ✖ $($endpoint.nom) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# RÉSUMÉ FINAL
# ═══════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  RÉSUMÉ FINAL                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dossier de test    : $testFolder\music_stream" -ForegroundColor Gray
Write-Host "Documents importés : $totalDocs documents" -ForegroundColor Gray
Write-Host "Endpoints OK       : $success / $($endpoints.Count)" -ForegroundColor Gray
Write-Host ""

if ($failed -eq 0 -and $totalDocs -gt 0) {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✓ PROJET PRÊT POUR LE RENDU              ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Votre projet fonctionne parfaitement !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "  1. Testez manuellement : http://localhost:3500" -ForegroundColor White
    Write-Host "  2. Connectez-vous avec admin/admin" -ForegroundColor White
    Write-Host "  3. Vérifiez que les $totalDocs morceaux/utilisateurs sont présents" -ForegroundColor White
    Write-Host "  4. Testez le blind test" -ForegroundColor White
    Write-Host "  5. Si tout est OK, le projet est prêt !" -ForegroundColor White
    Write-Host ""
    Write-Host "Commandes utiles :" -ForegroundColor Cyan
    Write-Host "  cd $testFolder\music_stream" -ForegroundColor Gray
    Write-Host "  docker compose logs -f              # Logs en direct" -ForegroundColor Gray
    Write-Host "  docker compose ps                   # État des conteneurs" -ForegroundColor Gray
    Write-Host "  docker compose down                 # Arrêter" -ForegroundColor Gray
    Write-Host "  docker compose down -v              # Reset complet" -ForegroundColor Gray
} else {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║              ✖ DES PROBLÈMES PERSISTENT               ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    if ($totalDocs -eq 0) {
        Write-Host "PROBLÈME : Aucune donnée importée dans MongoDB" -ForegroundColor Red
    }
    if ($failed -gt 0) {
        Write-Host "PROBLÈME : $failed endpoint(s) ne répondent pas" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Actions recommandées :" -ForegroundColor Yellow
    Write-Host "  1. Vérifiez les logs : docker compose logs" -ForegroundColor White
    Write-Host "  2. Vérifiez que Streaming_platform/ contient des .bson" -ForegroundColor White
    Write-Host "  3. Tentez un import manuel de MongoDB" -ForegroundColor White
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
