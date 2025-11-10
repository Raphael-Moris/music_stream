const express = require('express');
const router = express.Router();
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const BlindTestGame = require('../models/blindTestGame');
const BlindTestRoom = require('../models/blindTestRoom');
const PlayerStats = require('../models/playerStats');
const auth = require('../middleware/auth');

// ========== UTILITAIRES ==========

/**
 * Génère un moment aléatoire pour l'extrait de 20 secondes
 * @param {number} duration - Durée totale de la chanson en secondes
 * @returns {number} - Position de départ en secondes
 */
function generateRandomStartTime(duration) {
  console.log(`🎵 Génération startTime pour chanson de ${duration}s`);

  if (!duration || duration <= 20) {
    console.log(`⚠️  Chanson trop courte (${duration}s), startTime = 0`);
    return 0;
  }

  // S'assurer qu'il reste au moins 20 secondes après le point de départ
  const maxStart = Math.max(0, duration - 20);

  // Éviter les 10 premières secondes (intro) si possible
  const minStart = duration > 30 ? 10 : 0;

  // Si maxStart est inférieur à minStart, partir du début
  if (maxStart < minStart) {
    console.log(`⚠️  maxStart (${maxStart}) < minStart (${minStart}), startTime = 0`);
    return 0;
  }

  const startTime = Math.floor(Math.random() * (maxStart - minStart) + minStart);
  console.log(`✅ StartTime généré: ${startTime}s (durée: ${duration}s, reste: ${duration - startTime}s)`);

  return startTime;
}

/**
 * Génère les options de QCM pour une question
 * @param {Object} correctSong - La chanson correcte
 * @param {Array} allPlaylistSongs - Toutes les chansons de la playlist
 * @returns {Array} - 4 options mélangées aléatoirement
 */
function generateQCMOptions(correctSong, allPlaylistSongs) {
  const correctAnswer = `${correctSong.title} - ${correctSong.artist}`;

  // Filtrer pour exclure la bonne réponse
  const wrongSongs = allPlaylistSongs.filter(s =>
    s._id.toString() !== correctSong._id.toString()
  );

  // Mélanger et prendre 3 mauvaises réponses
  const shuffled = wrongSongs.sort(() => 0.5 - Math.random());
  const wrongOptions = shuffled.slice(0, 3).map(s => `${s.title} - ${s.artist}`);

  // Combiner et mélanger toutes les options
  const allOptions = [correctAnswer, ...wrongOptions];
  return allOptions.sort(() => 0.5 - Math.random());
}

/**
 * Calcule le score avec bonus de vitesse
 * @param {boolean} isCorrect - La réponse est-elle correcte ?
 * @param {number} timeToAnswer - Temps de réponse en secondes
 * @returns {number} - Points gagnés
 */
function calculateScore(isCorrect, timeToAnswer) {
  if (!isCorrect) return -10;

  let points = 100;
  if (timeToAnswer < 2) {
    points += 75; // Bonus +75 si < 2 secondes
  } else if (timeToAnswer < 3) {
    points += 50; // Bonus +50 si < 3 secondes
  } else if (timeToAnswer < 7) {
    points += 20; // Bonus +20 si < 7 secondes
  }

  return points;
}

// ========== ROUTES MODE SOLO ==========

/**
 * POST /api/blindtest/solo/start
 * Démarrer une partie solo
 * Body: { playlistId }
 */
router.post('/solo/start', auth, async (req, res) => {
  try {
    const { playlistId } = req.body;

    if (!playlistId) {
      return res.status(400).json({ success: false, error: 'playlistId requis' });
    }

    let songs;
    let playlistName;
    let actualPlaylistId;

    // Cas spécial : "Toutes les chansons"
    if (playlistId === 'all') {
      songs = await Song.find();
      playlistName = 'Toutes les chansons';
      actualPlaylistId = 'all';

      if (songs.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Vous devez avoir au moins 10 chansons dans votre bibliothèque pour jouer au blind test'
        });
      }
    } else {
      // Récupérer la playlist avec ses chansons
      const playlist = await Playlist.findById(playlistId).populate('songs');

      if (!playlist) {
        return res.status(404).json({ success: false, error: 'Playlist introuvable' });
      }

      // Vérifier qu'il y a au moins 10 chansons
      if (playlist.songs.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'La playlist doit contenir au moins 10 pistes pour jouer au blind test'
        });
      }

      songs = playlist.songs;
      playlistName = playlist.name;
      actualPlaylistId = playlist._id;
    }

    // Sélectionner 10 chansons aléatoires
    const shuffledSongs = [...songs].sort(() => 0.5 - Math.random());
    const selectedSongs = shuffledSongs.slice(0, 10);

    // Générer les questions avec QCM
    const questions = selectedSongs.map((song, index) => {
      const correctAnswer = `${song.title} - ${song.artist}`;
      const options = generateQCMOptions(song, songs);
      const startTime = generateRandomStartTime(song.duration);

      return {
        questionIndex: index,
        songId: song._id,
        title: song.title,
        artist: song.artist,
        audioUrl: song.audioUrl,
        correctAnswer,
        options,
        startTime
      };
    });

    res.json({
      success: true,
      data: {
        playlistId: actualPlaylistId,
        playlistName,
        questions
      }
    });

  } catch (error) {
    console.error('Erreur démarrage partie solo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/blindtest/solo/complete
 * Terminer une partie solo et sauvegarder les résultats
 * Body: { playlistId, answers: [{ questionIndex, songId, userAnswer, correctAnswer, timeToAnswer }] }
 */
router.post('/solo/complete', auth, async (req, res) => {
  try {
    const { playlistId, answers } = req.body;

    if (!playlistId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'playlistId et answers requis'
      });
    }

    let playlistName;
    let actualPlaylistId;

    // Gérer le cas "Toutes les chansons"
    if (playlistId === 'all') {
      playlistName = 'Toutes les chansons';
      actualPlaylistId = null; // Ne pas sauvegarder d'ID de playlist pour "all"
    } else {
      // Récupérer la playlist
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        return res.status(404).json({ success: false, error: 'Playlist introuvable' });
      }
      playlistName = playlist.name;
      actualPlaylistId = playlistId;
    }

    // Calculer les résultats
    let totalScore = 0;
    let correctAnswers = 0;

    const processedAnswers = answers.map(answer => {
      const isCorrect = answer.userAnswer === answer.correctAnswer;
      const points = calculateScore(isCorrect, answer.timeToAnswer);

      if (isCorrect) correctAnswers++;
      totalScore += points;

      return {
        questionIndex: answer.questionIndex,
        songId: answer.songId,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect,
        timeToAnswer: answer.timeToAnswer,
        points
      };
    });

    // S'assurer que le score ne soit jamais négatif
    if (totalScore < 0) totalScore = 0;

    // Créer l'entrée de jeu
    const game = await BlindTestGame.create({
      playerId: req.user.id,
      playlistId: actualPlaylistId,
      mode: 'solo',
      score: totalScore,
      correctAnswers,
      totalQuestions: answers.length,
      answers: processedAnswers
    });

    // Mettre à jour ou créer les stats du joueur
    let playerStats = await PlayerStats.findOne({ userId: req.user.id });

    if (!playerStats) {
      playerStats = await PlayerStats.create({ userId: req.user.id });
    }

    await playerStats.updateAfterGame({
      score: totalScore,
      correctAnswers,
      totalQuestions: answers.length,
      accuracy: game.accuracy,
      playlistId: actualPlaylistId,
      playlistName
    });

    res.json({
      success: true,
      data: {
        gameId: game._id,
        score: totalScore,
        correctAnswers,
        totalQuestions: answers.length,
        accuracy: game.accuracy,
        answers: processedAnswers
      }
    });

  } catch (error) {
    console.error('Erreur completion partie solo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/blindtest/stats/:userId
 * Récupérer les statistiques d'un joueur
 */
router.get('/stats/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'utilisateur demande ses propres stats
    if (userId.toString() !== req.user.id.toString()) {
      console.log('❌ Accès refusé aux stats:', { requestedUserId: userId, authenticatedUserId: req.user.id });
      return res.status(403).json({ success: false, error: 'Accès interdit' });
    }

    console.log('✅ Chargement stats pour:', userId);
    let playerStats = await PlayerStats.findOne({ userId }).populate('recentPlaylists.playlistId', 'name coverImage');

    // Si pas de stats, créer un objet vide
    if (!playerStats) {
      playerStats = {
        totalGames: 0,
        totalVictories: 0,
        bestScore: 0,
        averageAccuracy: 0,
        recentPlaylists: []
      };
    }

    res.json({
      success: true,
      data: playerStats
    });

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/blindtest/playlists/compatible
 * Récupérer les playlists compatibles avec le blind test (≥10 pistes)
 */
router.get('/playlists/compatible', auth, async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user.id }).populate('songs');

    // Filtrer les playlists qui ont au moins 10 chansons
    const compatiblePlaylists = playlists
      .filter(p => p.songs.length >= 10)
      .map(p => ({
        _id: p._id,
        name: p.name,
        coverImage: p.coverImage,
        songCount: p.songs.length,
        createdAt: p.createdAt
      }));

    res.json({
      success: true,
      data: compatiblePlaylists
    });

  } catch (error) {
    console.error('Erreur récupération playlists compatibles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ROUTES MODE MULTIJOUEUR ==========

/**
 * POST /api/blindtest/room/create
 * Créer un salon multijoueur
 * Body: { playlistId }
 */
router.post('/room/create', auth, async (req, res) => {
  try {
    const { playlistId, username } = req.body;

    if (!playlistId) {
      return res.status(400).json({ success: false, error: 'playlistId requis' });
    }

    const playerUsername = username || req.user.username || 'Hôte';

    let songs;
    let playlistName;
    let actualPlaylistId;

    // Cas spécial : "Toutes les chansons"
    if (playlistId === 'all') {
      songs = await Song.find();
      playlistName = 'Toutes les chansons';
      actualPlaylistId = 'all';

      if (songs.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Vous devez avoir au moins 10 chansons dans votre bibliothèque pour jouer au blind test'
        });
      }
    } else {
      // Récupérer la playlist avec ses chansons
      const playlist = await Playlist.findById(playlistId).populate('songs');

      if (!playlist) {
        return res.status(404).json({ success: false, error: 'Playlist introuvable' });
      }

      // Vérifier qu'il y a au moins 10 chansons
      if (playlist.songs.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'La playlist doit contenir au moins 10 pistes pour jouer au blind test'
        });
      }

      songs = playlist.songs;
      playlistName = playlist.name;
      actualPlaylistId = playlist._id;
    }

    // Générer un code unique
    let code;
    let codeExists = true;
    while (codeExists) {
      code = BlindTestRoom.generateCode();
      const existingRoom = await BlindTestRoom.findOne({ code });
      codeExists = !!existingRoom;
    }

    // Sélectionner 10 chansons aléatoires
    const shuffledSongs = [...songs].sort(() => 0.5 - Math.random());
    const selectedSongs = shuffledSongs.slice(0, 10);

    // Générer les questions (sans les options pour l'instant)
    const questions = selectedSongs.map((song) => {
      const correctAnswer = `${song.title} - ${song.artist}`;
      const startTime = generateRandomStartTime(song.duration);

      return {
        songId: song._id,
        correctAnswer,
        audioUrl: song.audioUrl,
        startTime
      };
    });

    // Créer le salon
    const room = await BlindTestRoom.create({
      code,
      hostId: req.user.id,
      playlistId: actualPlaylistId,
      playlistName,
      players: [{
        userId: req.user.id,
        username: playerUsername,
        score: 0,
        ready: false,
        answers: []
      }],
      questions,
      status: 'waiting'
    });

    res.json({
      success: true,
      data: {
        roomCode: code,
        roomId: room._id
      }
    });

  } catch (error) {
    console.error('Erreur création salon:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/blindtest/room/join
 * Rejoindre un salon
 * Body: { code }
 */
router.post('/room/join', auth, async (req, res) => {
  try {
    const { code, username } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'code requis' });
    }

    const playerUsername = username || req.user.username || 'Joueur';

    const room = await BlindTestRoom.findOne({ code });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Salon introuvable' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ success: false, error: 'La partie a déjà commencé' });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ success: false, error: 'Salon complet' });
    }

    // Vérifier si le joueur est déjà dans le salon
    const existingPlayer = room.players.find(p => p.userId.toString() === req.user.id);

    if (existingPlayer) {
      return res.json({
        success: true,
        data: {
          roomCode: code,
          roomId: room._id,
          message: 'Vous êtes déjà dans ce salon'
        }
      });
    }

    // Ajouter le joueur
    room.players.push({
      userId: req.user.id,
      username: playerUsername,
      score: 0,
      ready: false,
      answers: []
    });

    await room.save();

    res.json({
      success: true,
      data: {
        roomCode: code,
        roomId: room._id
      }
    });

  } catch (error) {
    console.error('Erreur rejoindre salon:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/blindtest/room/:code
 * Récupérer les informations d'un salon
 */
router.get('/room/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;

    const room = await BlindTestRoom.findOne({ code });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Salon introuvable' });
    }

    // Populate seulement si ce n'est pas "Toutes les chansons"
    if (room.playlistId && room.playlistId !== 'all') {
      await room.populate('playlistId', 'name coverImage');
    }

    res.json({
      success: true,
      data: room
    });

  } catch (error) {
    console.error('Erreur récupération salon:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
