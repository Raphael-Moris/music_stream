#!/bin/bash

# Script d'initialisation MongoDB pour Docker
# Ce script restaure automatiquement les données depuis le répertoire backup

echo "=========================================="
echo "🚀 Initialisation de la base de données MongoDB"
echo "=========================================="

# Attendre que MongoDB soit complètement démarré
sleep 5

# Vérifier si le répertoire de backup existe
if [ -d "/docker-entrypoint-initdb.d/backup/Streaming_platform" ]; then
    echo "📂 Répertoire de backup trouvé : /docker-entrypoint-initdb.d/backup/Streaming_platform"

    # Restaurer les données depuis les fichiers BSON
    echo "📥 Restauration des données..."
    mongorestore --db=Streaming_platform /docker-entrypoint-initdb.d/backup/Streaming_platform

    if [ $? -eq 0 ]; then
        echo "✅ Restauration réussie !"

        # Afficher les collections importées
        echo "📊 Collections importées :"
        mongosh Streaming_platform --eval "db.getCollectionNames().forEach(function(c) { print('  - ' + c + ' : ' + db[c].countDocuments() + ' documents'); })"
    else
        echo "❌ Erreur lors de la restauration"
    fi
else
    echo "⚠️ Aucun backup trouvé. La base de données sera vide."
    echo "   Vérifiez que le dossier 'Streaming_platform' existe dans votre projet."
fi

echo "=========================================="
echo "✅ Initialisation terminée"
echo "=========================================="
