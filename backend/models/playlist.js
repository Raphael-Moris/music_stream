// ...existing code...
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlaylistSchema = new Schema({
  name: { type: String, required: true },
  user: { type: Schema.Types.Mixed, required: true }, // peut être ObjectId ou 'admin'
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
  coverImage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
// ...existing code...