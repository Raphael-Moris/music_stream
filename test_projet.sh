#!/bin/bash

# Script de test universel pour le projet SAE 302
# Compatible : Windows (Git Bash), Linux, macOS

set -e  # Arrêter en cas d'erreur

echo "============================================"
echo "   TEST DU PROJET - SAE 302"
echo "============================================"
echo ""

# Détection de l'OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Windows;;
    MINGW*)     MACHINE=Windows;;
    MSYS*)      MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Système détecté : $MACHINE"
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "ERREUR : Docker n'est pas installé"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "ERREUR : Docker Compose n'est pas installé"
    exit 1
fi

echo "[OK] Docker et Docker Compose sont installés"
echo ""

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "docker-compose.yml" ]; then
    echo "ERREUR : Vous devez exécuter ce script depuis la racine du projet"
    echo "Le fichier docker-compose.yml est introuvable"
    exit 1
fi

echo "[OK] Vous êtes dans le bon dossier"
echo ""

# Vérifier que le dossier Streaming_platform existe
if [ ! -d "Streaming_platform" ]; then
    echo "ERREUR : Le dossier Streaming_platform/ est introuvable"
    exit 1
fi

# Vérifier qu'il contient des fichiers BSON
BSON_COUNT=$(find Streaming_platform -name "*.bson" 2>/dev/null | wc -l)
if [ "$BSON_COUNT" -eq 0 ]; then
    echo "ERREUR : Aucun fichier BSON trouvé dans Streaming_platform/"
    exit 1
fi

echo "[OK] Dump MongoDB trouvé ($BSON_COUNT fichiers BSON)"
echo ""

# Vérifier que .env.docker existe
if [ ! -f ".env.docker" ]; then
    echo "ERREUR : Le fichier .env.docker est introuvable"
    exit 1
fi

echo "[OK] Fichier .env.docker trouvé"
echo ""

# Copier .env.docker vers .env
echo "Configuration de l'environnement..."
cp .env.docker .env
echo "[OK] Fichier .env créé"
echo ""

# Nettoyer Docker
echo "============================================"
echo "   NETTOYAGE DOCKER"
echo "============================================"
echo ""

echo "Arrêt des conteneurs existants..."
docker compose down -v 2>/dev/null || true

echo "Suppression des anciens volumes..."
docker volume ls -q | grep -E "mongodb|musicstream" | xargs -r docker volume rm 2>/dev/null || true

echo "[OK] Docker nettoyé"
echo ""

# Démarrer Docker
echo "============================================"
echo "   DÉMARRAGE DOCKER"
echo "============================================"
echo ""

echo "Lancement de Docker Compose..."
echo "Cela peut prendre 2-5 minutes (téléchargement + build)..."
echo ""

docker compose up -d --build

if [ $? -ne 0 ]; then
    echo "ERREUR : Le démarrage de Docker a échoué"
    docker compose logs --tail=50
    exit 1
fi

echo ""
echo "[OK] Conteneurs démarrés"
echo ""

# Attendre que MongoDB soit prêt
echo "============================================"
echo "   ATTENTE DE MONGODB"
echo "============================================"
echo ""

echo "Attente de 60 secondes pour l'import MongoDB..."
for i in {10..60..10}; do
    sleep 10
    echo "  $i secondes..."
done

echo ""
echo "[OK] Attente terminée"
echo ""

# Vérifier l'import MongoDB
echo "============================================"
echo "   VÉRIFICATION DE L'IMPORT"
echo "============================================"
echo ""

echo "Vérification des logs MongoDB..."
if docker compose logs mongodb | grep -q "Restauration réussie"; then
    echo "[OK] Import MongoDB confirmé dans les logs"
else
    echo "[ATTENTION] Import non confirmé dans les logs"
    echo "Vérifiez manuellement : docker compose logs mongodb"
fi
echo ""

echo "Comptage des documents dans MongoDB..."
sleep 5

# Compter les documents
RESULT=$(docker compose exec -T mongodb mongosh Streaming_platform --quiet --eval "
var total = 0;
db.getCollectionNames().forEach(function(c) {
    var count = db[c].countDocuments();
    total += count;
    print(c + ': ' + count + ' documents');
});
print('TOTAL: ' + total);
" 2>&1)

if [ $? -ne 0 ]; then
    echo "ERREUR : Impossible de se connecter à MongoDB"
    echo "$RESULT"
    exit 1
fi

echo ""
echo "Collections MongoDB :"
echo "$RESULT" | grep -v "TOTAL"
echo ""

TOTAL_DOCS=$(echo "$RESULT" | grep "TOTAL:" | awk '{print $2}')

if [ -z "$TOTAL_DOCS" ] || [ "$TOTAL_DOCS" -eq 0 ]; then
    echo "ERREUR : Aucun document importé !"
    echo ""
    echo "Vérifiez les logs : docker compose logs mongodb"
    exit 1
fi

echo "[OK] Total : $TOTAL_DOCS documents importés"
echo ""

# Tester les endpoints HTTP
echo "============================================"
echo "   TEST DES ENDPOINTS HTTP"
echo "============================================"
echo ""

# Attendre un peu pour que l'app démarre
sleep 5

ENDPOINTS=(
    "http://localhost:3500/"
    "http://localhost:3500/login.html"
    "http://localhost:3500/blindtest.html"
    "http://localhost:3500/admin.html"
    "http://localhost:3500/api/songs"
)

SUCCESS=0
FAILED=0

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" "$endpoint" | grep -q "200"; then
        echo "[OK] $endpoint"
        ((SUCCESS++))
    else
        echo "[ERREUR] $endpoint"
        ((FAILED++))
    fi
done

echo ""

# Résumé final
echo "============================================"
echo "            RÉSUMÉ"
echo "============================================"
echo ""
echo "Système d'exploitation : $MACHINE"
echo "Documents importés     : $TOTAL_DOCS"
echo "Endpoints OK           : $SUCCESS / ${#ENDPOINTS[@]}"
echo "Endpoints KO           : $FAILED"
echo ""

if [ "$FAILED" -eq 0 ] && [ "$TOTAL_DOCS" -gt 0 ]; then
    echo "============================================"
    echo "      ✓ PROJET FONCTIONNEL"
    echo "============================================"
    echo ""
    echo "Le projet fonctionne correctement !"
    echo ""
    echo "Testez maintenant dans votre navigateur :"
    echo "  - http://localhost:3500"
    echo "  - Connexion : admin/admin"
    echo ""
    echo "Commandes utiles :"
    echo "  docker compose logs -f      # Voir les logs"
    echo "  docker compose ps           # État des conteneurs"
    echo "  docker compose down         # Arrêter"
    echo "  docker compose down -v      # Arrêter + supprimer données"
    echo ""
    exit 0
else
    echo "============================================"
    echo "      ✗ DES PROBLÈMES DÉTECTÉS"
    echo "============================================"
    echo ""
    if [ "$TOTAL_DOCS" -eq 0 ]; then
        echo "PROBLÈME : Aucune donnée importée"
    fi
    if [ "$FAILED" -gt 0 ]; then
        echo "PROBLÈME : $FAILED endpoint(s) ne répondent pas"
    fi
    echo ""
    echo "Vérifiez les logs : docker compose logs"
    echo ""
    exit 1
fi
