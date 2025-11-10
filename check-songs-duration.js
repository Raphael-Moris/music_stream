// Script pour vérifier les durées des chansons en BDD
const mongoose = require('mongoose');
require('dotenv').config();

async function checkSongsDuration() {
  try {
    console.log('🔍 VÉRIFICATION DURÉES DES CHANSONS\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/music_streaming');
    console.log('✅ MongoDB connecté\n');

    const Song = require('./backend/models/song');

    const songs = await Song.find();
    console.log(`📊 Total: ${songs.length} chansons\n`);

    // Statistiques
    let tooShort = 0;
    let good = 0;
    let noDuration = 0;

    songs.forEach((song, index) => {
      const duration = song.duration || 0;

      let status = '';
      if (!duration) {
        status = '❌ PAS DE DURÉE';
        noDuration++;
      } else if (duration < 20) {
        status = `⚠️  TROP COURTE (< 20s)`;
        tooShort++;
      } else {
        status = '✅ OK';
        good++;
      }

      console.log(`${index + 1}. "${song.title}" - ${song.artist}`);
      console.log(`   Durée: ${duration}s ${status}`);
      console.log('');
    });

    console.log('\n📈 RÉSUMÉ:');
    console.log(`   ✅ Chansons OK (≥20s): ${good}`);
    console.log(`   ⚠️  Chansons trop courtes (<20s): ${tooShort}`);
    console.log(`   ❌ Chansons sans durée: ${noDuration}`);

    if (tooShort > 0 || noDuration > 0) {
      console.log('\n⚠️  ATTENTION: Certaines chansons ont des durées problématiques.');
      console.log('   Cela peut causer des coupures audio pendant le blind test.');
      console.log('   Solution: Vérifiez que les métadonnées sont correctement extraites lors de l\'upload.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
}

checkSongsDuration();
