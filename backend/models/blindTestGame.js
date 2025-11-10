const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnswerSchema = new Schema({
  questionIndex: { type: Number, required: true },
  songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  userAnswer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timeToAnswer: { type: Number, required: true }, // en secondes
  points: { type: Number, required: true }
});

const BlindTestGameSchema = new Schema({
  playerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playlistId: {
    type: Schema.Types.ObjectId,
    ref: 'Playlist',
    default: null // null pour "Toutes les chansons"
  },
  mode: {
    type: String,
    enum: ['solo', 'multiplayer'],
    required: true
  },
  roomCode: {
    type: String,
    default: null // Seulement pour le mode multijoueur
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  correctAnswers: {
    type: Number,
    required: true,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    default: 10
  },
  accuracy: {
    type: Number, // Pourcentage de réussite
    default: 0
  },
  answers: [AnswerSchema],
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculer l'accuracy avant de sauvegarder
BlindTestGameSchema.pre('save', function(next) {
  if (this.totalQuestions > 0) {
    this.accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }
  next();
});

module.exports = mongoose.model('BlindTestGame', BlindTestGameSchema);
