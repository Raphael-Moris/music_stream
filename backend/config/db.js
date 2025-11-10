const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicstream';

    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB connecté avec succès');
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    throw err;
  }
};

module.exports = connectDB;
