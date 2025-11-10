// Script pour supprimer l'ancien index unique sur le champ email
require('dotenv').config();
const mongoose = require('mongoose');

async function fixEmailIndex() {
  try {
    // Connexion à MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicstream';
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Accéder à la collection users
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Lister les index existants
    console.log('\n📋 Index existants sur la collection users:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Supprimer l'index email_1 s'il existe
    try {
      await usersCollection.dropIndex('email_1');
      console.log('\n✅ Index email_1 supprimé avec succès !');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('\n⚠️ Index email_1 n\'existe pas (déjà supprimé ou jamais créé)');
      } else {
        throw err;
      }
    }

    // Vérifier les index après suppression
    console.log('\n📋 Index après suppression:');
    const indexesAfter = await usersCollection.indexes();
    indexesAfter.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Correction terminée !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixEmailIndex();
