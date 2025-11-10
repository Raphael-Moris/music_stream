// ...existing code...
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const { parseFile } = require('music-metadata');
const Song = require('../models/song');
const { cleanMetadata } = require('../utils/cleanMetadata');

const router = express.Router();

function cleanTagValue(value) {
  if (Array.isArray(value)) {
    return value.map(cleanTagValue).filter(Boolean).join(', ');
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
}

function parseYearValue(value) {
  const candidate = cleanTagValue(value);
  if (!candidate) return undefined;
  const parsed = parseInt(candidate, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

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
    // accepter audio pour audioFile, images pour coverFile
    if (file.fieldname === 'audioFile') {
      const allowedAudio = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
      return allowedAudio.includes(file.mimetype) ? cb(null, true) : cb(new Error('Format audio non supporté. Utilisez MP3/M4A/WAV.'), false);
    }
    if (file.fieldname === 'coverFile') {
      const allowedImg = ['image/png', 'image/jpeg'];
      return allowedImg.includes(file.mimetype) ? cb(null, true) : cb(new Error('Format image non supporté. Utilisez PNG/JPEG.'), false);
    }
    cb(null, false);
  }
});

router.post('/upload', upload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'coverFile', maxCount: 1 }]), async (req, res) => {
  let tempFilePath = null;
  let tempCoverPath = null;

  try {
    console.log('\n📤 === DÉBUT UPLOAD ===');

    const audioFile = req.files?.audioFile?.[0];
    const coverFile = req.files?.coverFile?.[0];

    if (!audioFile) {
      console.log('❌ Aucun fichier audio reçu');
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier audio uploadé'
      });
    }

    tempFilePath = audioFile.path;
    if (coverFile) tempCoverPath = coverFile.path;

    console.log('✅ Fichier reçu:', audioFile.originalname);
    console.log('📁 Chemin temporaire:', tempFilePath);

    // 1. Extraire métadonnées
    console.log('🎵 Extraction des métadonnées...');
    const metadata = await parseFile(tempFilePath);
    const common = metadata?.common || {};

    const titleFromBody = cleanTagValue(req.body?.title);
    const artistFromBody = cleanTagValue(req.body?.artistName);
    const albumFromBody = cleanTagValue(req.body?.albumTitle);
    const genreFromBody = cleanTagValue(req.body?.genre);
    const fallbackTitle = audioFile.originalname.replace(/\.[^/.]+$/, '');

    // Obtenir les valeurs brutes
    const rawTitle = titleFromBody || cleanTagValue(common.title) || fallbackTitle || 'Titre inconnu';
    const rawArtist = artistFromBody || cleanTagValue(common.artist) || 'Artiste inconnu';

    // Nettoyer automatiquement le titre et l'artiste
    const cleaned = cleanMetadata({ title: rawTitle, artist: rawArtist });
    const songTitle = cleaned.title || 'Titre inconnu';
    const artistName = cleaned.artist || 'Artiste inconnu';
    const albumTitle = albumFromBody || cleanTagValue(common.album) || 'Single';
    const duration = Math.round(metadata?.format?.duration) || 0;
    const yearBody = parseYearValue(req.body?.year);
    const yearMeta = parseYearValue(common.year);
    const year = yearBody ?? yearMeta;
    const genre = genreFromBody || 'autre';

    console.log('✅ Métadonnées:', { songTitle, artistName, albumTitle, duration });

    // 2. Upload audio vers Cloudinary
    console.log('☁️ Upload audio vers Cloudinary...');
    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: 'video',
      folder: 'music_streaming/songs',
      public_id: `${Date.now()}_${songTitle.replace(/[^a-zA-Z0-9]/g, '_')}`,
      format: 'mp3'
    });

    console.log('✅ Upload Cloudinary réussi!');
    console.log('🔗 URL:', cloudinaryResult.secure_url);

    // 3. Gestion couverture : priorité -> coverFile uploadée par l'utilisateur, sinon image intégrée dans metadata
    let coverImageUrl = null;
    if (tempCoverPath) {
      console.log('🖼️ Upload de la couverture fournie par l\'utilisateur...');
      try {
        const coverResult = await cloudinary.uploader.upload(tempCoverPath, {
          folder: 'music_streaming/covers',
          transformation: [{ width: 500, height: 500, crop: 'fill', quality: 'auto' }]
        });
        coverImageUrl = coverResult.secure_url;
        console.log('✅ Couverture uploadée par l\'utilisateur');
      } catch (coverErr) {
        console.log('⚠️ Erreur upload couverture fournie:', coverErr.message);
      }
    } else if (metadata.common.picture && metadata.common.picture.length > 0) {
      console.log('🖼️ Upload de la couverture intégrée...');
      try {
        const pictureData = metadata.common.picture[0];
        const base64Image = `data:${pictureData.format};base64,${pictureData.data.toString('base64')}`;
        const coverResult = await cloudinary.uploader.upload(base64Image, {
          folder: 'music_streaming/covers',
          transformation: [{ width: 500, height: 500, crop: 'fill', quality: 'auto' }]
        });
        coverImageUrl = coverResult.secure_url;
        console.log('✅ Couverture uploadée depuis metadata');
      } catch (coverError) {
        console.log('⚠️ Erreur upload couverture depuis metadata:', coverError.message);
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

    // 5. Nettoyer fichiers temporaires
    await fs.unlink(tempFilePath).catch(() => { });
    if (tempCoverPath) await fs.unlink(tempCoverPath).catch(() => { });
    console.log('🧹 Fichiers temporaires supprimés');
    console.log('📤 === FIN UPLOAD SUCCÈS ===\n');

    res.status(201).json({
      success: true,
      message: 'Chanson uploadée avec succès!',
      data: song
    });

  } catch (error) {
    console.error('❌ === ERREUR UPLOAD ===', error);

    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(err => console.error('Erreur suppression fichier temp:', err));
    }
    // si cover temp présent, aussi le supprimer
    if (tempCoverPath) {
      await fs.unlink(tempCoverPath).catch(err => console.error('Erreur suppression cover temp:', err));
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
