require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connexion à MongoDB
// Connexion à MongoDB (ne bloque pas le démarrage du serveur si la connexion échoue)
connectDB().catch(err => {
  console.warn('⚠️ Connexion MongoDB échouée (vérifer le par feu de votre connexion) :', err.message);
});

// Middleware CORS - IMPORTANT pour éviter les erreurs
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger pour déboguer
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Servir le frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes API
app.use('/api/songs', require('./backend/routes/songs'));
app.use('/api/playlists', require('./backend/routes/playlists'));
app.use('/api/blindtest', require('./backend/routes/blindtest'));
app.use('/api/profile', require('./backend/routes/profile'));
app.use('/api/admin', require('./backend/routes/admin'));

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/login.html'));
});



const authRoutes = require('./backend/routes/auth');
app.use('/api/auth', authRoutes);



// Gestion des erreurs - IMPORTANT
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);

  // S'assurer de renvoyer du JSON
  res.status(500).json({
    success: false,
    error: 'Erreur serveur',
    details: err.message
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces réseau

// Créer serveur HTTP et attacher socket.io
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ========== SOCKET.IO - ÉVÉNEMENTS MULTIJOUEUR ==========
const BlindTestRoom = require('./backend/models/blindTestRoom');
const Song = require('./backend/models/song');

// Store des rooms actives en mémoire
const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('Joueur connecté:', socket.id);

  // Rejoindre un salon
  socket.on('join-room', async ({ roomCode, userId, username }) => {
    try {
      const room = await BlindTestRoom.findOne({ code: roomCode });
      if (!room) {
        socket.emit('error', { message: 'Salon introuvable' });
        return;
      }

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.userId = userId;

      // Notifier tous les joueurs du salon
      io.to(roomCode).emit('player-joined', {
        userId,
        username,
        players: room.players
      });

      console.log(`Joueur ${username} a rejoint le salon ${roomCode}`);
    } catch (error) {
      console.error('Erreur join-room:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Joueur prêt
  socket.on('player-ready', async ({ roomCode, userId }) => {
    try {
      const room = await BlindTestRoom.findOne({ code: roomCode });
      if (!room) return;

      const player = room.players.find(p => p.userId.toString() === userId);
      if (player) {
        player.ready = true;
        await room.save();
      }

      io.to(roomCode).emit('player-ready-update', {
        userId,
        players: room.players
      });

      console.log(`Joueur ${userId} prêt dans salon ${roomCode}`);
    } catch (error) {
      console.error('Erreur player-ready:', error);
    }
  });

  // Hôte démarre la partie
  socket.on('start-game', async ({ roomCode, userId }) => {
    try {
      const room = await BlindTestRoom.findOne({ code: roomCode });

      if (!room) {
        socket.emit('error', { message: 'Salon introuvable' });
        return;
      }

      // Comparer les IDs en s'assurant qu'ils sont tous les deux des strings
      const isHost = room.hostId.toString() === userId.toString();
      console.log('🎮 Vérification hôte:', {
        roomHostId: room.hostId.toString(),
        requestUserId: userId.toString(),
        isHost
      });

      if (!isHost) {
        socket.emit('error', { message: 'Seul l\'hôte peut démarrer la partie' });
        return;
      }

      if (room.players.length < 2) {
        socket.emit('error', { message: 'Au moins 2 joueurs requis' });
        return;
      }

      room.status = 'playing';
      room.startedAt = new Date();
      await room.save();

      // Charger les chansons pour générer les options
      let allSongs;
      if (room.playlistId === 'all') {
        // Si "Toutes les chansons", charger toutes les chansons disponibles
        allSongs = await Song.find({});
      } else {
        // Sinon, charger les chansons de la playlist spécifique
        await room.populate('playlistId');
        const playlist = room.playlistId;
        allSongs = await Song.find({ _id: { $in: playlist.songs } });
      }

      // Démarrer la première question
      io.to(roomCode).emit('game-started', {
        totalQuestions: room.questions.length
      });

      // Envoyer la première question après 3 secondes
      setTimeout(() => {
        sendQuestion(roomCode, 0, room, allSongs);
      }, 3000);

      console.log(`Partie démarrée dans salon ${roomCode}`);
    } catch (error) {
      console.error('Erreur start-game:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Soumettre une réponse
  socket.on('submit-answer', async ({ roomCode, userId, questionIndex, answer, timeToAnswer }) => {
    try {
      const room = await BlindTestRoom.findOne({ code: roomCode });
      if (!room) return;

      const question = room.questions[questionIndex];
      const isCorrect = answer === question.correctAnswer;

      // Calculer le score avec bonus
      let points = 0;
      if (isCorrect) {
        points = 100;
        if (timeToAnswer < 2) points += 75;
        else if (timeToAnswer < 3) points += 50;
        else if (timeToAnswer < 7) points += 20;
      } else {
        points = -10;
      }

      // Mettre à jour le joueur
      const player = room.players.find(p => p.userId.toString() === userId);
      if (player) {
        player.score += points;
        player.answers.push({
          questionIndex,
          answer,
          isCorrect,
          timeToAnswer,
          points
        });
      }

      await room.save();

      // Notifier le joueur de son résultat
      socket.emit('answer-result', {
        isCorrect,
        points,
        correctAnswer: question.correctAnswer
      });

      console.log(`Réponse de ${userId} : ${isCorrect ? 'correcte' : 'incorrecte'} (+${points} pts)`);
    } catch (error) {
      console.error('Erreur submit-answer:', error);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('Joueur déconnecté:', socket.id);
  });
});

// Fonction pour envoyer une question à tous les joueurs du salon
async function sendQuestion(roomCode, questionIndex, room, allSongs) {
  const question = room.questions[questionIndex];

  // Récupérer les détails de la chanson
  const song = allSongs.find(s => s._id.toString() === question.songId.toString());

  // Générer les options QCM (mélangées aléatoirement pour chaque envoi)
  const correctAnswer = question.correctAnswer;
  const wrongSongs = allSongs.filter(s => s._id.toString() !== song._id.toString());
  const shuffled = wrongSongs.sort(() => 0.5 - Math.random());
  const wrongOptions = shuffled.slice(0, 3).map(s => `${s.title} - ${s.artist}`);
  const options = [correctAnswer, ...wrongOptions].sort(() => 0.5 - Math.random());

  // Envoyer la question
  io.to(roomCode).emit('new-question', {
    questionIndex,
    audioUrl: question.audioUrl,
    startTime: question.startTime,
    options,
    totalQuestions: room.questions.length
  });

  // Après 15 secondes, passer à la question suivante
  setTimeout(async () => {
    // Envoyer les scores actuels
    const updatedRoom = await BlindTestRoom.findOne({ code: roomCode });
    io.to(roomCode).emit('question-end', {
      correctAnswer: question.correctAnswer,
      scoreboard: updatedRoom.players.map(p => ({
        username: p.username,
        score: p.score
      }))
    });

    // Passer à la question suivante après 3 secondes
    setTimeout(() => {
      if (questionIndex + 1 < room.questions.length) {
        sendQuestion(roomCode, questionIndex + 1, room, allSongs);
      } else {
        // Fin de partie
        endGame(roomCode, updatedRoom);
      }
    }, 3000);
  }, 15000);
}

// Fonction pour terminer la partie
async function endGame(roomCode, room) {
  room.status = 'finished';
  room.finishedAt = new Date();
  await room.save();

  // Trier les joueurs par score
  const sortedPlayers = room.players
    .map(p => ({
      userId: p.userId,
      username: p.username,
      score: p.score,
      correctAnswers: p.answers.filter(a => a.isCorrect).length
    }))
    .sort((a, b) => b.score - a.score);

  io.to(roomCode).emit('game-finished', {
    finalScoreboard: sortedPlayers
  });

  console.log(`Partie terminée dans salon ${roomCode}`);
}

server.listen(PORT, HOST, () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();

  // Fonction pour trouver la meilleure IP locale avec priorités
  function getBestLocalIP() {
    const ips = [];

    // Collecter toutes les IPs IPv4 non-internes
    Object.keys(networkInterfaces).forEach(interfaceName => {
      networkInterfaces[interfaceName].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push({ address: iface.address, name: interfaceName });
        }
      });
    });

    // Priorité 1: 192.168.x.x (réseaux domestiques typiques)
    const localNetwork = ips.find(ip => ip.address.startsWith('192.168.'));
    if (localNetwork) return localNetwork.address;

    // Priorité 2: 10.x.x.x (réseaux privés)
    const privateNetwork = ips.find(ip => ip.address.startsWith('10.'));
    if (privateNetwork) return privateNetwork.address;

    // Éviter 172.16-31.x.x (Docker/WSL/VPN)
    const other = ips.find(ip => {
      const parts = ip.address.split('.');
      const secondOctet = parseInt(parts[1]);
      if (parts[0] === '172' && secondOctet >= 16 && secondOctet <= 31) {
        return false;
      }
      return true;
    });

    return other ? other.address : 'localhost';
  }

  const localIP = getBestLocalIP();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📱 Accès local :     http://localhost:${PORT}`);
  console.log(`🌐 Accès réseau :    http://${localIP}:${PORT}`);
  console.log(`🔌 API :             http://${localIP}:${PORT}/api/songs`);
  console.log(`${'='.repeat(60)}\n`);
});


