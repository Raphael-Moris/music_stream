# Script de Test Universel - SAE 302

## Description

Le script `test_projet.sh` permet de tester automatiquement le projet sur **n'importe quel système d'exploitation** :
- ✅ **Windows** (Git Bash, WSL, PowerShell)
- ✅ **Linux** (Ubuntu, Debian, Fedora, etc.)
- ✅ **macOS**

Le script vérifie automatiquement :
- L'installation de Docker
- La présence des fichiers nécessaires
- Le dump MongoDB
- Le démarrage des conteneurs
- L'import des données (43 documents attendus)
- Les endpoints HTTP de l'application

---

## Prérequis

- **Docker Desktop** (Windows/macOS) ou **Docker Engine** (Linux)
- **Docker Compose**
- **Git** (pour cloner le projet)
- **Bash** (inclus par défaut sur Linux/macOS, Git Bash sur Windows)

---

## Utilisation

### 1. Cloner le projet

```bash
git clone https://github.com/Raphael-Moris/music_stream.git
cd music_stream
```

### 2. Lancer le script de test

**Sur Linux / macOS / Git Bash (Windows) :**
```bash
./test_projet.sh
```

**Sur Windows PowerShell :**
```powershell
bash test_projet.sh
```

### 3. Attendre la fin du test

Le script va :
1. Vérifier l'environnement
2. Nettoyer Docker
3. Démarrer les conteneurs (2-5 minutes)
4. Attendre l'import MongoDB (60 secondes)
5. Vérifier que les 43 documents sont importés
6. Tester les endpoints HTTP
7. Afficher un résumé

---

## Résultat attendu

Si tout fonctionne correctement, vous verrez :

```
============================================
      ✓ PROJET FONCTIONNEL
============================================

Le projet fonctionne correctement !

Testez maintenant dans votre navigateur :
  - http://localhost:3500
  - Connexion : admin/admin

Commandes utiles :
  docker compose logs -f      # Voir les logs
  docker compose ps           # État des conteneurs
  docker compose down         # Arrêter
  docker compose down -v      # Arrêter + supprimer données
```

**Données importées** :
- 4 utilisateurs
- 12 chansons
- 5 playlists
- 11 parties de blind test
- 9 salles de blind test
- 2 statistiques de joueurs

**Total : 43 documents**

---

## Que faire après le test ?

### Tester l'application

1. Ouvrir votre navigateur : http://localhost:3500
2. Se connecter avec **admin / admin**
3. Tester :
   - La lecture de musiques
   - Le blind test solo/multijoueur
   - Le dashboard administrateur

### Arrêter l'application

```bash
# Arrêter sans supprimer les données
docker compose down

# Arrêter et supprimer tout (reset complet)
docker compose down -v
```

---

## Dépannage

### Le script ne se lance pas

**Sur Windows :**
- Installer Git Bash : https://git-scm.com/downloads
- Ou utiliser WSL2 : `wsl --install`

**Permissions :**
```bash
chmod +x test_projet.sh
./test_projet.sh
```

### Docker n'est pas installé

**Windows/macOS :**
- Télécharger Docker Desktop : https://www.docker.com/products/docker-desktop/

**Linux (Ubuntu) :**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# Se déconnecter et reconnecter
```

### Aucune donnée importée

Vérifiez que :
1. Le dossier `Streaming_platform/` contient bien des fichiers `.bson`
2. Le fichier `init-mongo.sh` est bien en format Unix (LF)
3. Les logs MongoDB : `docker compose logs mongodb`

### Endpoints ne répondent pas

Attendez quelques secondes supplémentaires :
```bash
# Vérifier l'état des conteneurs
docker compose ps

# Voir les logs de l'app
docker compose logs app
```

---

## Tests effectués

Le script vérifie automatiquement :

1. ✅ Détection de l'OS
2. ✅ Présence de Docker et Docker Compose
3. ✅ Présence des fichiers essentiels
4. ✅ Présence du dump MongoDB (6 fichiers BSON)
5. ✅ Nettoyage complet de Docker
6. ✅ Démarrage des conteneurs
7. ✅ Import des données MongoDB (43 documents)
8. ✅ Test de 5 endpoints HTTP

---

## Compatibilité testée

- ✅ Windows 10/11 (Git Bash, WSL2)
- ✅ Ubuntu 22.04 LTS
- ✅ macOS Ventura/Sonoma
- ✅ Debian 12
- ✅ Fedora 39

---

## Support

En cas de problème :
1. Consulter ce README
2. Vérifier les logs : `docker compose logs`
3. Consulter [README-DOCKER.md](./README-DOCKER.md)
4. Consulter [docs/documentation_technique.md](./docs/documentation_technique.md)

---

**Développé pour la SAE 3.02 - BUT Réseaux & Télécommunications**
