// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicstream';
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
    throw error; // Ne pas quitter le processus, juste lancer l'erreur
  }
};

module.exports = connectDB;