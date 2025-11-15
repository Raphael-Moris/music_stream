# Script de réinitialisation complète de MongoDB
# Ce script supprime tout et réimporte les données depuis Streaming_platform/

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   RÉINITIALISATION MONGODB" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1 : Arrêter tous les conteneurs
Write-Host "[1/5] Arrêt des conteneurs..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 2 : Supprimer TOUS les volumes liés au projet
Write-Host "[2/5] Suppression des volumes MongoDB..." -ForegroundColor Yellow
$volumes = docker volume ls -q | Select-String -Pattern "mongodb"
if ($volumes) {
    foreach ($vol in $volumes) {
        Write-Host "  Suppression de $vol..." -ForegroundColor Gray
        docker volume rm $vol 2>&1 | Out-Null
    }
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "  Aucun volume MongoDB trouvé" -ForegroundColor Gray
}
Write-Host ""

# Étape 3 : Vérifier que le dump existe
Write-Host "[3/5] Vérification du dump MongoDB..." -ForegroundColor Yellow
if (Test-Path "Streaming_platform") {
    $bsonFiles = Get-ChildItem -Path "Streaming_platform" -Filter "*.bson"
    Write-Host "  Fichiers BSON trouvés : $($bsonFiles.Count)" -ForegroundColor Green
    foreach ($bson in $bsonFiles) {
        Write-Host "    - $($bson.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ERREUR : Dossier Streaming_platform/ introuvable !" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 4 : Relancer Docker (volume vide = réexécution du script d'init)
Write-Host "[4/5] Redémarrage de Docker Compose..." -ForegroundColor Yellow
Write-Host "  Cela peut prendre 1-2 minutes..." -ForegroundColor Gray
docker compose up -d --build 2>&1 | Out-Null
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# Étape 5 : Attendre et vérifier l'import
Write-Host "[5/5] Vérification de l'import des données..." -ForegroundColor Yellow
Write-Host "  Attente de 30 secondes pour l'import..." -ForegroundColor Gray

for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Seconds 1
    if ($i % 5 -eq 0) {
        Write-Host "    $i secondes..." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "  Vérification des logs MongoDB..." -ForegroundColor Gray
$logs = docker compose logs mongodb | Out-String

if ($logs -match "Restauration réussie" -or $logs -match "done") {
    Write-Host "  Import détecté dans les logs" -ForegroundColor Green
} else {
    Write-Host "  ATTENTION : Import non confirmé" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Comptage des documents..." -ForegroundColor Gray
$collections = docker compose exec -T mongodb mongosh Streaming_platform --quiet --eval "db.getCollectionNames().forEach(function(c) { print(c + ':' + db[c].countDocuments()); })" 2>$null

if ($collections) {
    Write-Host ""
    Write-Host "  Collections MongoDB :" -ForegroundColor Cyan
    $totalDocs = 0
    $collections -split "`n" | ForEach-Object {
        if ($_ -match "(\w+):(\d+)") {
            $collection = $matches[1]
            $count = [int]$matches[2]
            $totalDocs += $count
            Write-Host "    - $collection : $count documents" -ForegroundColor Gray
        }
    }
    Write-Host ""
    if ($totalDocs -gt 0) {
        Write-Host "  Total : $totalDocs documents importés" -ForegroundColor Green
        Write-Host "  OK" -ForegroundColor Green
    } else {
        Write-Host "  ERREUR : Aucun document importé !" -ForegroundColor Red
    }
} else {
    Write-Host "  ERREUR : Impossible de se connecter à MongoDB" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "            RÉSUMÉ" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($totalDocs -gt 0) {
    Write-Host "SUCCESS : Base de données restaurée !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant tester :" -ForegroundColor Cyan
    Write-Host "  - http://localhost:3500" -ForegroundColor White
    Write-Host "  - Connexion admin : admin/admin" -ForegroundColor White
    Write-Host ""
    Write-Host "Les musiques, utilisateurs et playlists sont disponibles !" -ForegroundColor Green
} else {
    Write-Host "ERREUR : L'import a échoué" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez les logs :" -ForegroundColor Yellow
    Write-Host "  docker compose logs mongodb" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ou essayez l'import manuel :" -ForegroundColor Yellow
    Write-Host "  docker compose exec mongodb mongorestore --db=Streaming_platform /docker-entrypoint-initdb.d/backup" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
