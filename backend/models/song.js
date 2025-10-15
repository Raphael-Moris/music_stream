const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  artist: {
    type: String,
    required: [true, 'L\'artiste est requis'],
    trim: true
  },
  album: {
    type: String,
    default: 'Single',
    trim: true
  },
  duration: {
    type: Number,
    required: true
  },
  audioUrl: {
    type: String,
    required: [true, 'L\'URL audio est requise']
  },
  coverImage: {
    type: String,
    default: null
  },
  year: {
    type: Number
  },
  playCount: {
    type: Number,
    default: 0
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

songSchema.index({ title: 'text', artist: 'text', album: 'text' });

module.exports = mongoose.model('Song', songSchema);