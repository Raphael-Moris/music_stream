const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecentPlaylistSchema = new Schema({
  playlistId: { type: Schema.Types.ObjectId, ref: 'Playlist', default: null }, // null pour "Toutes les chansons"
  playlistName: { type: String, required: true },
  score: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  playedAt: { type: Date, default: Date.now }
});

const PlayerStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalGames: {
    type: Number,
    default: 0
  },
  totalVictories: {
    type: Number,
    default: 0
  },
  bestScore: {
    type: Number,
    default: 0
  },
  averageAccuracy: {
    type: Number,
    default: 0
  },
  totalCorrectAnswers: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  recentPlaylists: [RecentPlaylistSchema]
}, {
  timestamps: true
});

// Méthode pour mettre à jour les stats après une partie
PlayerStatsSchema.methods.updateAfterGame = function(gameData) {
  const { score, correctAnswers, totalQuestions, accuracy, playlistId, playlistName } = gameData;

  // Incrémenter total games
  this.totalGames += 1;

  // Incrémenter victoires (toute partie terminée compte comme victoire en solo)
  this.totalVictories += 1;

  // Mettre à jour meilleur score
  if (score > this.bestScore) {
    this.bestScore = score;
  }

  // Mettre à jour total correct answers et questions
  this.totalCorrectAnswers += correctAnswers;
  this.totalQuestions += totalQuestions;

  // Recalculer average accuracy
  if (this.totalQuestions > 0) {
    this.averageAccuracy = Math.round((this.totalCorrectAnswers / this.totalQuestions) * 100);
  }

  // Ajouter à recent playlists (garder top 5)
  this.recentPlaylists.unshift({
    playlistId,
    playlistName,
    score,
    accuracy,
    playedAt: new Date()
  });

  // Garder seulement les 5 plus récentes
  if (this.recentPlaylists.length > 5) {
    this.recentPlaylists = this.recentPlaylists.slice(0, 5);
  }

  return this.save();
};

module.exports = mongoose.model('PlayerStats', PlayerStatsSchema);
