// Script de diagnostic pour tester le blind test
const mongoose = require('mongoose');
require('dotenv').config();

async function testBlindTest() {
  try {
    console.log('🔍 TEST DE DIAGNOSTIC BLIND TEST\n');

    // 1. Connexion MongoDB
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/music_streaming');
    console.log('✅ MongoDB connecté\n');

    // 2. Vérifier les modèles
    console.log('2. Vérification des modèles...');
    const PlayerStats = require('./backend/models/playerStats');
    const BlindTestGame = require('./backend/models/blindTestGame');
    const BlindTestRoom = require('./backend/models/blindTestRoom');
    console.log('✅ Modèles chargés\n');

    // 3. Compter les documents
    console.log('3. Statistiques de la base de données:');
    const gamesCount = await BlindTestGame.countDocuments();
    const statsCount = await PlayerStats.countDocuments();
    const roomsCount = await BlindTestRoom.countDocuments();

    console.log(`   - Parties jouées: ${gamesCount}`);
    console.log(`   - Stats joueurs: ${statsCount}`);
    console.log(`   - Salons créés: ${roomsCount}\n`);

    // 4. Afficher les stats de tous les joueurs
    console.log('4. Stats des joueurs:');
    const allStats = await PlayerStats.find();
    if (allStats.length === 0) {
      console.log('   ⚠️  Aucune stat de joueur trouvée\n');
    } else {
      allStats.forEach(stat => {
        console.log(`   - UserId: ${stat.userId}`);
        console.log(`     Total games: ${stat.totalGames}`);
        console.log(`     Best score: ${stat.bestScore}`);
        console.log(`     Recent playlists: ${stat.recentPlaylists.length}`);
      });
      console.log('');
    }

    // 5. Afficher les dernières parties jouées
    console.log('5. Dernières parties jouées:');
    const recentGames = await BlindTestGame.find().sort({ createdAt: -1 }).limit(5);
    if (recentGames.length === 0) {
      console.log('   ⚠️  Aucune partie trouvée\n');
    } else {
      recentGames.forEach(game => {
        console.log(`   - Player: ${game.playerId}`);
        console.log(`     Score: ${game.score}`);
        console.log(`     Accuracy: ${game.accuracy}%`);
        console.log(`     Mode: ${game.mode}`);
      });
      console.log('');
    }

    // 6. Tester la fonction de nettoyage des métadonnées
    console.log('6. Test nettoyage métadonnées:');
    const { cleanMetadata } = require('./backend/utils/cleanMetadata');
    const testCases = [
      { title: 'Song Name (Official Video)', artist: 'Artist Name - Topic' },
      { title: 'Track [HQ]', artist: 'Singer (Official Audio)' },
      { title: 'Music HD 4K', artist: 'Band [Explicit]' }
    ];

    testCases.forEach(test => {
      const cleaned = cleanMetadata(test);
      console.log(`   Original: "${test.title}" - "${test.artist}"`);
      console.log(`   Cleaned:  "${cleaned.title}" - "${cleaned.artist}"\n`);
    });

    console.log('✅ Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
}

testBlindTest();
