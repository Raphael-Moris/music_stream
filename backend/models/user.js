const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, default: null }, // Email optionnel (pour compatibilité avec anciens utilisateurs)
  password: { type: String, required: true }, // stocke le hash, jamais le mot de passe en clair
  profileImage: { type: String, default: null }, // URL de l'image de profil (Cloudinary)
  role:     { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
  timestamps: true // Ajoute createdAt et updatedAt
});
module.exports = mongoose.model('User', userSchema);