const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  ready: { type: Boolean, default: false },
  answers: [{
    questionIndex: Number,
    answer: String,
    isCorrect: Boolean,
    timeToAnswer: Number,
    points: Number
  }]
});

const QuestionSchema = new Schema({
  songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  correctAnswer: { type: String, required: true },
  audioUrl: { type: String, required: true },
  startTime: { type: Number, default: 0 }, // Position de départ pour l'extrait de 20s
  // Les options seront générées côté serveur et envoyées différemment pour chaque joueur
});

const BlindTestRoomSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playlistId: {
    type: Schema.Types.Mixed, // Peut être un ObjectId ou la string 'all'
    default: null // null ou 'all' pour "Toutes les chansons"
  },
  playlistName: {
    type: String,
    required: true
  },
  players: [PlayerSchema],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  questions: [QuestionSchema],
  maxPlayers: {
    type: Number,
    default: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: null
  },
  finishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Générer un code aléatoire à 6 chiffres
BlindTestRoomSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = mongoose.model('BlindTestRoom', BlindTestRoomSchema);
