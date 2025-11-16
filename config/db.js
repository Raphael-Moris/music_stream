/**
 * Configuration et connexion à la base de données MongoDB
 *
 * Ce module gère l'établissement de la connexion à MongoDB via Mongoose.
 * L'URI de connexion est récupérée depuis les variables d'environnement
 * ou utilise une URI locale par défaut pour le développement.
 */
const mongoose = require('mongoose');

/**
 * Établit la connexion à MongoDB
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Si la connexion échoue
 */
const connectDB = async () => {
  try {
    // Récupération de l'URI MongoDB depuis les variables d'environnement
    // Fallback vers une URI locale si non définie
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicstream';

    // Connexion à MongoDB avec Mongoose
    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
    // Lancer l'erreur pour permettre au code appelant de la gérer
    // Ne pas forcer l'arrêt du processus (process.exit) pour permettre une gestion d'erreur appropriée
    throw error;
  }
};

module.exports = connectDB;