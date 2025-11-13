# Référence API - Plateforme de Streaming Musical

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Endpoints - Authentification](#endpoints---authentification)
4. [Endpoints - Musiques](#endpoints---musiques)
5. [Endpoints - Playlists](#endpoints---playlists)
6. [Endpoints - Blind Test](#endpoints---blind-test)
7. [Endpoints - Profil utilisateur](#endpoints---profil-utilisateur)
8. [Endpoints - Administration](#endpoints---administration)
9. [WebSocket - Multijoueur](#websocket---multijoueur)
10. [Codes d'erreur](#codes-derreur)
11. [Exemples complets](#exemples-complets)

---

## Vue d'ensemble

### URL de base

```
http://localhost:3500/api
```

### Format des données

- **Requêtes** : JSON (`Content-Type: application/json`)
- **Réponses** : JSON
- **Upload de fichiers** : `multipart/form-data`

### Authentification

La plupart des endpoints nécessitent un token JWT dans l'en-tête :

```
Authorization: Bearer <token>
```

Le token est obtenu lors de la connexion et est valide 7 jours.

---

## Authentification

### Méthode d'authentification

L'API utilise **JWT (JSON Web Tokens)** pour l'authentification.

#### Workflow

1. **Inscription ou connexion** → Obtention d'un token JWT
2. **Utilisation du token** → Dans l'en-tête `Authorization` pour chaque requête protégée
3. **Expiration** → Après 7 jours, se reconnecter pour obtenir un nouveau token

#### Format du token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Endpoints - Authentification

### POST /api/auth/register

Créer un nouveau compte utilisateur.

#### Requête

```bash
curl -X POST http://localhost:3500/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nouveau_user",
    "password": "motdepasse123"
  }'
```

#### Corps de la requête

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| username | string | Oui | Nom d'utilisateur unique |
| password | string | Oui | Mot de passe (min 6 caractères) |

#### Réponse succès (201 Created)

```json
{
  "message": "Utilisateur créé avec succès",
  "userId": "65a1b2c3d4e5f6789abcdef0"
}
```

#### Erreurs possibles

- `400` : Nom d'utilisateur déjà pris
- `400` : Données manquantes ou invalides

---

### POST /api/auth/login

Se connecter et obtenir un token JWT.

#### Requête

```bash
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin"
  }'
```

#### Corps de la requête

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| username | string | Oui | Nom d'utilisateur |
| password | string | Oui | Mot de passe |

#### Réponse succès (200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWExYjJjM2Q0ZTVmNjc4OWFiY2RlZjAiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzA1MDY4MDAwLCJleHAiOjE3MDU2NzI4MDB9.abc123def456",
  "userId": "65a1b2c3d4e5f6789abcdef0",
  "username": "admin",
  "role": "admin",
  "expiresIn": "7d"
}
```

#### Erreurs possibles

- `401` : Identifiants incorrects
- `400` : Données manquantes

---

## Endpoints - Musiques

### GET /api/songs

Récupérer la liste de tous les morceaux.

#### Requête

```bash
curl http://localhost:3500/api/songs
```

#### Réponse succès (200 OK)

```json
[
  {
    "_id": "65a1b2c3d4e5f6789abcdef1",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "duration": 354,
    "audioUrl": "https://res.cloudinary.com/xxx/audio.mp3",
    "coverImage": "https://res.cloudinary.com/xxx/cover.jpg",
    "year": 1975,
    "playCount": 1542,
    "cloudinaryPublicId": "music/bohemian_rhapsody",
    "createdAt": "2024-01-12T10:30:00.000Z",
    "updatedAt": "2024-01-12T10:30:00.000Z"
  },
  {
    "_id": "65a1b2c3d4e5f6789abcdef2",
    "title": "Imagine",
    "artist": "John Lennon",
    "album": "Imagine",
    "duration": 187,
    "audioUrl": "https://res.cloudinary.com/xxx/audio2.mp3",
    "coverImage": "https://res.cloudinary.com/xxx/cover2.jpg",
    "year": 1971,
    "playCount": 987,
    "cloudinaryPublicId": "music/imagine",
    "createdAt": "2024-01-12T11:00:00.000Z",
    "updatedAt": "2024-01-12T11:00:00.000Z"
  }
]
```

---

### GET /api/songs/:id

Récupérer les détails d'un morceau spécifique.

#### Requête

```bash
curl http://localhost:3500/api/songs/65a1b2c3d4e5f6789abcdef1
```

#### Réponse succès (200 OK)

```json
{
  "_id": "65a1b2c3d4e5f6789abcdef1",
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "album": "A Night at the Opera",
  "duration": 354,
  "audioUrl": "https://res.cloudinary.com/xxx/audio.mp3",
  "coverImage": "https://res.cloudinary.com/xxx/cover.jpg",
  "year": 1975,
  "playCount": 1542,
  "cloudinaryPublicId": "music/bohemian_rhapsody",
  "createdAt": "2024-01-12T10:30:00.000Z",
  "updatedAt": "2024-01-12T10:30:00.000Z"
}
```

#### Erreurs possibles

- `404` : Morceau non trouvé

---

### GET /api/songs/search

Rechercher des morceaux par titre, artiste ou album.

#### Requête

```bash
# Recherche simple
curl "http://localhost:3500/api/songs/search?q=queen"

# Avec URL encoding pour les espaces
curl "http://localhost:3500/api/songs/search?q=bohemian%20rhapsody"
```

#### Paramètres de requête

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| q | string | Oui | Terme de recherche (titre, artiste, album) |

#### Réponse succès (200 OK)

```json
[
  {
    "_id": "65a1b2c3d4e5f6789abcdef1",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "duration": 354,
    "audioUrl": "https://res.cloudinary.com/xxx/audio.mp3",
    "coverImage": "https://res.cloudinary.com/xxx/cover.jpg"
  }
]
```

---

### POST /api/songs/upload

Uploader un nouveau morceau (admin uniquement).

**Authentification requise** : Oui (token JWT + rôle admin)

#### Requête

```bash
curl -X POST http://localhost:3500/api/songs/upload \
  -H "Authorization: Bearer <token>" \
  -F "audioFile=@/chemin/vers/musique.mp3" \
  -F "coverFile=@/chemin/vers/pochette.jpg" \
  -F "title=Nouveau Titre" \
  -F "artist=Artiste" \
  -F "album=Album" \
  -F "year=2024"
```

#### Champs du formulaire multipart

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| audioFile | file | Oui | Fichier audio (MP3, WAV, M4A - max 50Mo) |
| coverFile | file | Non | Image de pochette (JPEG, PNG) |
| title | string | Non | Titre (auto-extrait si absent) |
| artist | string | Non | Artiste (auto-extrait si absent) |
| album | string | Non | Album (auto-extrait si absent) |
| year | number | Non | Année de sortie |

#### Réponse succès (201 Created)

```json
{
  "message": "Morceau uploadé avec succès",
  "song": {
    "_id": "65a1b2c3d4e5f6789abcdef3",
    "title": "Nouveau Titre",
    "artist": "Artiste",
    "album": "Album",
    "duration": 245,
    "audioUrl": "https://res.cloudinary.com/xxx/new_song.mp3",
    "coverImage": "https://res.cloudinary.com/xxx/cover.jpg",
    "year": 2024,
    "playCount": 0,
    "cloudinaryPublicId": "music/new_song",
    "createdAt": "2024-01-15T14:20:00.000Z"
  }
}
```

#### Erreurs possibles

- `401` : Non authentifié
- `403` : Non autorisé (admin requis)
- `400` : Fichier audio manquant ou format invalide
- `413` : Fichier trop volumineux (> 50Mo)

---

### DELETE /api/songs/:id

Supprimer un morceau (admin uniquement).

**Authentification requise** : Oui (token JWT + rôle admin)

#### Requête

```bash
curl -X DELETE http://localhost:3500/api/songs/65a1b2c3d4e5f6789abcdef1 \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
{
  "message": "Morceau supprimé avec succès"
}
```

#### Erreurs possibles

- `401` : Non authentifié
- `403` : Non autorisé (admin requis)
- `404` : Morceau non trouvé

---

## Endpoints - Playlists

### GET /api/playlists

Récupérer les playlists de l'utilisateur connecté.

**Authentification requise** : Oui

#### Requête

```bash
curl http://localhost:3500/api/playlists \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
[
  {
    "_id": "65a1b2c3d4e5f6789abcdef5",
    "name": "Ma playlist rock",
    "user": "65a1b2c3d4e5f6789abcdef0",
    "songs": [
      "65a1b2c3d4e5f6789abcdef1",
      "65a1b2c3d4e5f6789abcdef2"
    ],
    "coverImage": "https://res.cloudinary.com/xxx/playlist_cover.jpg",
    "createdAt": "2024-01-12T15:00:00.000Z"
  }
]
```

---

### GET /api/playlists/admin

Récupérer toutes les playlists (admin uniquement).

**Authentification requise** : Oui (admin)

#### Requête

```bash
curl http://localhost:3500/api/playlists/admin \
  -H "Authorization: Bearer <token>"
```

---

### POST /api/playlists

Créer une nouvelle playlist.

**Authentification requise** : Oui

#### Requête

```bash
curl -X POST http://localhost:3500/api/playlists \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ma nouvelle playlist",
    "songs": ["65a1b2c3d4e5f6789abcdef1", "65a1b2c3d4e5f6789abcdef2"]
  }'
```

#### Corps de la requête

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| name | string | Oui | Nom de la playlist |
| songs | array | Non | Tableau d'IDs de morceaux |
| coverImage | string | Non | URL de l'image de pochette |

#### Réponse succès (201 Created)

```json
{
  "message": "Playlist créée avec succès",
  "playlist": {
    "_id": "65a1b2c3d4e5f6789abcdef6",
    "name": "Ma nouvelle playlist",
    "user": "65a1b2c3d4e5f6789abcdef0",
    "songs": ["65a1b2c3d4e5f6789abcdef1"],
    "createdAt": "2024-01-15T16:00:00.000Z"
  }
}
```

---

### PUT /api/playlists/:id

Modifier une playlist existante.

**Authentification requise** : Oui (propriétaire ou admin)

#### Requête

```bash
curl -X PUT http://localhost:3500/api/playlists/65a1b2c3d4e5f6789abcdef5 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau nom de playlist"
  }'
```

---

### DELETE /api/playlists/:id

Supprimer une playlist.

**Authentification requise** : Oui (propriétaire ou admin)

#### Requête

```bash
curl -X DELETE http://localhost:3500/api/playlists/65a1b2c3d4e5f6789abcdef5 \
  -H "Authorization: Bearer <token>"
```

---

### POST /api/playlists/:id/songs/:songId

Ajouter un morceau à une playlist.

**Authentification requise** : Oui (propriétaire ou admin)

#### Requête

```bash
curl -X POST http://localhost:3500/api/playlists/65a1b2c3d4e5f6789abcdef5/songs/65a1b2c3d4e5f6789abcdef1 \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
{
  "message": "Morceau ajouté à la playlist",
  "playlist": {
    "_id": "65a1b2c3d4e5f6789abcdef5",
    "name": "Ma playlist rock",
    "songs": ["65a1b2c3d4e5f6789abcdef1", "65a1b2c3d4e5f6789abcdef2"]
  }
}
```

---

### DELETE /api/playlists/:id/songs/:songId

Retirer un morceau d'une playlist.

**Authentification requise** : Oui (propriétaire ou admin)

#### Requête

```bash
curl -X DELETE http://localhost:3500/api/playlists/65a1b2c3d4e5f6789abcdef5/songs/65a1b2c3d4e5f6789abcdef1 \
  -H "Authorization: Bearer <token>"
```

---

## Endpoints - Blind Test

### POST /api/blindtest/solo/start

Démarrer une partie de blind test solo.

**Authentification requise** : Oui

#### Requête

```bash
curl -X POST http://localhost:3500/api/blindtest/solo/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "playlistId": "65a1b2c3d4e5f6789abcdef5",
    "numberOfQuestions": 10
  }'
```

#### Corps de la requête

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| playlistId | string | Non | ID de playlist (ou "all" pour tous les morceaux) |
| numberOfQuestions | number | Non | Nombre de questions (défaut: 10) |

#### Réponse succès (201 Created)

```json
{
  "gameId": "65a1b2c3d4e5f6789abcdef7",
  "questions": [
    {
      "questionIndex": 0,
      "audioUrl": "https://res.cloudinary.com/xxx/song1.mp3",
      "startTime": 45,
      "options": [
        "Bohemian Rhapsody - Queen",
        "Imagine - John Lennon",
        "Stairway to Heaven - Led Zeppelin",
        "Hotel California - Eagles"
      ]
    }
  ]
}
```

**Note** : La réponse correcte n'est PAS envoyée au client (anti-triche).

---

### POST /api/blindtest/solo/:gameId/answer

Soumettre une réponse à une question.

**Authentification requise** : Oui

#### Requête

```bash
curl -X POST http://localhost:3500/api/blindtest/solo/65a1b2c3d4e5f6789abcdef7/answer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questionIndex": 0,
    "answer": "Bohemian Rhapsody - Queen",
    "timeToAnswer": 5.2
  }'
```

#### Corps de la requête

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| questionIndex | number | Oui | Index de la question (0-based) |
| answer | string | Oui | Réponse choisie |
| timeToAnswer | number | Oui | Temps de réponse en secondes |

#### Réponse succès (200 OK)

```json
{
  "isCorrect": true,
  "correctAnswer": "Bohemian Rhapsody - Queen",
  "points": 150,
  "breakdown": {
    "basePoints": 100,
    "speedBonus": 50,
    "penalty": 0
  }
}
```

**Calcul des points** :
- Réponse correcte : +100 points
- Bonus rapidité < 2s : +75 points
- Bonus rapidité < 3s : +50 points
- Bonus rapidité < 7s : +20 points
- Mauvaise réponse : -10 points

---

### GET /api/blindtest/solo/results/:gameId

Obtenir les résultats finaux d'une partie.

**Authentification requise** : Oui

#### Requête

```bash
curl http://localhost:3500/api/blindtest/solo/results/65a1b2c3d4e5f6789abcdef7 \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
{
  "gameId": "65a1b2c3d4e5f6789abcdef7",
  "score": 750,
  "correctAnswers": 8,
  "totalQuestions": 10,
  "accuracy": 80,
  "averageTimePerQuestion": 6.5,
  "questions": [
    {
      "songTitle": "Bohemian Rhapsody",
      "artist": "Queen",
      "userAnswer": "Bohemian Rhapsody - Queen",
      "correctAnswer": "Bohemian Rhapsody - Queen",
      "isCorrect": true,
      "timeToAnswer": 5.2,
      "points": 150
    }
  ]
}
```

---

## Endpoints - Profil utilisateur

### GET /api/profile

Récupérer le profil de l'utilisateur connecté.

**Authentification requise** : Oui

#### Requête

```bash
curl http://localhost:3500/api/profile \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
{
  "_id": "65a1b2c3d4e5f6789abcdef0",
  "username": "john_doe",
  "email": "john@example.com",
  "profileImage": "https://res.cloudinary.com/xxx/avatar.jpg",
  "role": "user",
  "createdAt": "2024-01-10T10:00:00.000Z"
}
```

---

### PUT /api/profile

Mettre à jour le profil.

**Authentification requise** : Oui

#### Requête

```bash
curl -X PUT http://localhost:3500/api/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

---

### POST /api/profile/avatar

Uploader un nouvel avatar.

**Authentification requise** : Oui

#### Requête

```bash
curl -X POST http://localhost:3500/api/profile/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/chemin/vers/avatar.jpg"
```

#### Réponse succès (200 OK)

```json
{
  "message": "Avatar mis à jour",
  "profileImage": "https://res.cloudinary.com/xxx/avatar_new.jpg"
}
```

---

### GET /api/profile/stats

Obtenir les statistiques de jeu de l'utilisateur.

**Authentification requise** : Oui

#### Requête

```bash
curl http://localhost:3500/api/profile/stats \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
{
  "totalGames": 25,
  "totalScore": 18750,
  "averageScore": 750,
  "correctAnswers": 210,
  "totalAnswers": 250,
  "accuracy": 84,
  "bestScore": 950,
  "wonGames": 12,
  "lastPlayedAt": "2024-01-15T18:30:00.000Z"
}
```

---

## Endpoints - Administration

**Tous les endpoints admin nécessitent authentification + rôle admin**

### GET /api/admin/stats

Obtenir les statistiques système globales.

#### Requête

```bash
curl http://localhost:3500/api/admin/stats \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
{
  "totalUsers": 152,
  "totalSongs": 487,
  "totalPlaylists": 89,
  "totalGames": 1253,
  "databaseSize": "125.4 MB",
  "uptime": "15 days 8 hours",
  "collections": {
    "users": 152,
    "songs": 487,
    "playlists": 89,
    "blindTestGames": 1253,
    "blindTestRooms": 342
  }
}
```

---

### GET /api/admin/users

Lister tous les utilisateurs.

#### Requête

```bash
curl http://localhost:3500/api/admin/users \
  -H "Authorization: Bearer <token>"
```

#### Réponse succès (200 OK)

```json
[
  {
    "_id": "65a1b2c3d4e5f6789abcdef0",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "playlistCount": 3,
    "gamesPlayed": 15
  }
]
```

---

### DELETE /api/admin/users/:id

Supprimer un utilisateur.

#### Requête

```bash
curl -X DELETE http://localhost:3500/api/admin/users/65a1b2c3d4e5f6789abcdef0 \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/admin/songs

Lister tous les morceaux avec statistiques.

#### Requête

```bash
curl http://localhost:3500/api/admin/songs \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/admin/playlists

Lister toutes les playlists (publiques et privées).

#### Requête

```bash
curl http://localhost:3500/api/admin/playlists \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/admin/games

Obtenir les statistiques de tous les jeux blind test.

#### Requête

```bash
curl http://localhost:3500/api/admin/games \
  -H "Authorization: Bearer <token>"
```

---

## WebSocket - Multijoueur

Le mode multijoueur utilise **Socket.io** pour la communication temps réel.

### Connexion

```javascript
// Client JavaScript
const socket = io('http://localhost:3500', {
  auth: {
    token: '<jwt_token>'
  }
});
```

### Événements émis par le client

#### join-room

Rejoindre une salle de jeu.

```javascript
socket.emit('join-room', {
  roomCode: '123456',
  userId: '65a1b2c3d4e5f6789abcdef0',
  username: 'john_doe'
});
```

#### player-ready

Marquer le joueur comme prêt.

```javascript
socket.emit('player-ready', {
  roomCode: '123456',
  userId: '65a1b2c3d4e5f6789abcdef0'
});
```

#### start-game

Démarrer la partie (hôte uniquement).

```javascript
socket.emit('start-game', {
  roomCode: '123456',
  userId: '65a1b2c3d4e5f6789abcdef0'
});
```

#### submit-answer

Soumettre une réponse à une question.

```javascript
socket.emit('submit-answer', {
  roomCode: '123456',
  userId: '65a1b2c3d4e5f6789abcdef0',
  questionIndex: 0,
  answer: 'Bohemian Rhapsody - Queen',
  timeToAnswer: 5.2
});
```

### Événements reçus par le client

#### player-joined

Un nouveau joueur a rejoint la salle.

```javascript
socket.on('player-joined', (data) => {
  console.log('Nouveau joueur:', data.username);
  // data = { userId, username, players: [...] }
});
```

#### player-ready-update

Statut "prêt" d'un joueur mis à jour.

```javascript
socket.on('player-ready-update', (data) => {
  // data = { userId, players: [...] }
});
```

#### game-started

La partie a commencé.

```javascript
socket.on('game-started', (data) => {
  console.log('Partie commencée avec', data.totalQuestions, 'questions');
});
```

#### new-question

Nouvelle question du blind test.

```javascript
socket.on('new-question', (data) => {
  /*
  data = {
    questionIndex: 0,
    audioUrl: 'https://...',
    startTime: 45,
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    totalQuestions: 10
  }
  */
});
```

#### answer-result

Résultat de la réponse soumise.

```javascript
socket.on('answer-result', (data) => {
  /*
  data = {
    isCorrect: true,
    points: 150,
    correctAnswer: 'Bohemian Rhapsody - Queen'
  }
  */
});
```

#### question-end

Fin de la question (temps écoulé).

```javascript
socket.on('question-end', (data) => {
  /*
  data = {
    correctAnswer: 'Bohemian Rhapsody - Queen',
    scoreboard: [
      { userId: '...', username: 'john', score: 150 },
      { userId: '...', username: 'jane', score: 100 }
    ]
  }
  */
});
```

#### game-finished

Partie terminée.

```javascript
socket.on('game-finished', (data) => {
  /*
  data = {
    finalScoreboard: [
      { rank: 1, userId: '...', username: 'john', score: 850 },
      { rank: 2, userId: '...', username: 'jane', score: 720 }
    ]
  }
  */
});
```

#### error

Erreur côté serveur.

```javascript
socket.on('error', (error) => {
  console.error('Erreur:', error.message);
});
```

---

## Codes d'erreur

### Codes HTTP

| Code | Signification | Description |
|------|--------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Données invalides ou manquantes |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource introuvable |
| 409 | Conflict | Conflit (ex: username déjà pris) |
| 413 | Payload Too Large | Fichier trop volumineux |
| 500 | Internal Server Error | Erreur serveur |

### Format des erreurs

```json
{
  "error": "Message d'erreur descriptif"
}
```

Exemples :

```json
{
  "error": "Token invalide ou expiré"
}
```

```json
{
  "error": "Accès non autorisé : privilèges administrateur requis"
}
```

---

## Exemples complets

### Exemple 1 : Workflow complet utilisateur

```bash
# 1. Inscription
curl -X POST http://localhost:3500/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "password123"}'

# 2. Connexion
TOKEN=$(curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "password123"}' \
  | jq -r '.token')

# 3. Récupérer la liste des morceaux
curl http://localhost:3500/api/songs \
  -H "Authorization: Bearer $TOKEN"

# 4. Créer une playlist
curl -X POST http://localhost:3500/api/playlists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ma super playlist", "songs": []}'

# 5. Démarrer un blind test
curl -X POST http://localhost:3500/api/blindtest/solo/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"playlistId": "all", "numberOfQuestions": 5}'
```

### Exemple 2 : Workflow admin

```bash
# 1. Connexion admin
ADMIN_TOKEN=$(curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}' \
  | jq -r '.token')

# 2. Voir les statistiques
curl http://localhost:3500/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Lister tous les utilisateurs
curl http://localhost:3500/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Uploader un nouveau morceau
curl -X POST http://localhost:3500/api/songs/upload \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "audioFile=@/path/to/song.mp3" \
  -F "title=Nouvelle Chanson" \
  -F "artist=Artiste Test"
```

### Exemple 3 : Utilisation avec jq (parsing JSON)

```bash
# Extraire uniquement les titres des morceaux
curl -s http://localhost:3500/api/songs | jq '.[].title'

# Compter le nombre de morceaux
curl -s http://localhost:3500/api/songs | jq 'length'

# Filtrer les morceaux par artiste
curl -s http://localhost:3500/api/songs | jq '.[] | select(.artist == "Queen")'

# Extraire userId et token lors du login
curl -s -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}' \
  | jq '{userId: .userId, token: .token}'
```

---

## Notes importantes

1. **Tokens JWT** : Stockez le token de manière sécurisée (localStorage, sessionStorage, cookies httpOnly)

2. **CORS** : Le serveur autorise les requêtes cross-origin (configuré dans `server.js`)

3. **Rate limiting** : Pas de limite de taux implémentée actuellement (à ajouter en production)

4. **Uploads** : Taille maximale 50 Mo pour les fichiers audio

5. **WebSocket** : Nécessite authentification JWT dans les paramètres de connexion

6. **Cloudinary** : Les URLs d'audio/images sont hébergées sur Cloudinary (CDN)

7. **Recherche** : La recherche est case-insensitive et fonctionne sur titre, artiste, album

8. **Pagination** : Non implémentée actuellement (à ajouter pour grandes collections)

---

**Documentation développée pour la SAE 302 - BUT Réseaux et Télécommunications**
