const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mm = require('music-metadata');
const fs = require('fs').promises;
const Song = require('../models/song');

const router = express.Router();

// Configuration Cloudinary
console.log('🔧 Configuration Cloudinary...');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Vérifier la configuration
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error('❌ CLOUDINARY_CLOUD_NAME manquant dans .env');
}

// Configuration Multer
const upload = multer({ 
  dest: 'temp/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez MP3, WAV ou M4A.'), false);
    }
  }
});

// ========== ROUTE TEST ==========
router.get('/test', (req, res) => {
  console.log('✅ Route test appelée');
  res.json({ 
    success: true, 
    message: 'API songs fonctionne!',
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
  });
});

// ========== ROUTE UPLOAD ==========
router.post('/upload', upload.single('audioFile'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    console.log('\n📤 === DÉBUT UPLOAD ===');
    
    if (!req.file) {
      console.log('❌ Aucun fichier reçu');
      return res.status(400).json({ 
        success: false,
        error: 'Aucun fichier uploadé' 
      });
    }



    tempFilePath = req.file.path;
    console.log('✅ Fichier reçu:', req.file.originalname);
    console.log('📁 Chemin temporaire:', tempFilePath);

    // 1. Extraire métadonnées
    console.log('🎵 Extraction des métadonnées...');
    const metadata = await mm.parseFile(tempFilePath);
    
    const artistName = req.body.artistName || metadata.common.artist || 'Artiste inconnu';
    const albumTitle = req.body.albumTitle || metadata.common.album || 'Single';
    const songTitle = req.body.title || metadata.common.title || req.file.originalname.replace(/\..+$/, '');
    const duration = Math.round(metadata.format.duration) || 0;
    const year = req.body.year || metadata.common.year;
    const genre = req.body.genre || 'autre';

    console.log('✅ Métadonnées:', { songTitle, artistName, albumTitle, duration });

    // 2. Upload vers Cloudinary
    console.log('☁️ Upload vers Cloudinary...');
    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: 'video',
      folder: 'music_streaming/songs',
      public_id: `${Date.now()}_${songTitle.replace(/[^a-zA-Z0-9]/g, '_')}`,
      format: 'mp3'
    });

    console.log('✅ Upload Cloudinary réussi!');
    console.log('🔗 URL:', cloudinaryResult.secure_url);

    // 3. Upload couverture si présente
    let coverImageUrl = null;
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      console.log('🖼️ Upload de la couverture...');
      try {
        const pictureData = metadata.common.picture[0];
        const base64Image = `data:${pictureData.format};base64,${pictureData.data.toString('base64')}`;
        const coverResult = await cloudinary.uploader.upload(base64Image, {
          folder: 'music_streaming/covers',
          transformation: [{ width: 500, height: 500, crop: 'fill', quality: 'auto' }]
        });
        coverImageUrl = coverResult.secure_url;
        console.log('✅ Couverture uploadée');
      } catch (coverError) {
        console.log('⚠️ Erreur upload couverture:', coverError.message);
      }
    }

    // 4. Sauvegarder dans MongoDB
    console.log('💾 Sauvegarde dans MongoDB...');
    const song = await Song.create({
      title: songTitle,
      artist: artistName,
      album: albumTitle,
      duration: duration,
      audioUrl: cloudinaryResult.secure_url,
      coverImage: coverImageUrl,
      year: year,
      genre: genre, 
      cloudinaryPublicId: cloudinaryResult.public_id
    });

    console.log('✅ Chanson enregistrée:', song._id);

    // 5. Nettoyer fichier temporaire
    await fs.unlink(tempFilePath);
    console.log('🧹 Fichier temporaire supprimé');
    console.log('📤 === FIN UPLOAD SUCCÈS ===\n');

    res.status(201).json({
      success: true,
      message: 'Chanson uploadée avec succès!',
      data: song
    });

  } catch (error) {
    console.error('❌ === ERREUR UPLOAD ===');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================\n');
    
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(err => 
        console.error('Erreur suppression fichier temp:', err)
      );
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'upload',
      details: error.message 
    });
  }
});

// ========== LISTE DES CHANSONS ==========
router.get('/', async (req, res) => {
  try {
    console.log('📋 Récupération des chansons...');
    const songs = await Song.find().sort({ createdAt: -1 }).limit(100);
    
    res.json({ 
      success: true,
      count: songs.length,
      data: songs 
    });
  } catch (error) {
    console.error('❌ Erreur liste chansons:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========== RÉCUPÉRER UNE CHANSON ==========
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ 
        success: false,
        error: 'Chanson introuvable' 
      });
    }

    song.playCount += 1;
    await song.save();

    res.json({ 
      success: true,
      data: song 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========== SUPPRIMER UNE CHANSON ==========
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Suppression chanson:', req.params.id);
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ 
        success: false,
        error: 'Chanson introuvable' 
      });
    }

    if (song.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(song.cloudinaryPublicId, {
        resource_type: 'video'
      });
      console.log('✅ Fichier Cloudinary supprimé');
    }

    await Song.findByIdAndDelete(req.params.id);
    console.log('✅ Chanson supprimée de MongoDB');

    res.json({ 
      success: true,
      message: 'Chanson supprimée avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;