// ...existing code...
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const Playlist = require('../models/playlist');
const Song = require('../models/song');
const auth = require('../middleware/auth');

const router = express.Router();

// Configuration Cloudinary (même config que songs.js)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Multer pour l'upload d'images
const upload = multer({
  dest: 'temp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max pour les images
  fileFilter: (req, file, cb) => {
    const allowedImg = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    return allowedImg.includes(file.mimetype) ? cb(null, true) : cb(new Error('Format image non supporté. Utilisez PNG/JPEG/WEBP.'), false);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, user: req.user.id })
      .populate({
        path: 'songs',
        select: 'title artist coverImage audioUrl _id' // Inclure coverImage et audioUrl pour le streaming
      });

    if (!playlist) {
      return res.status(404).json({ msg: 'Playlist non trouvée' });
    }

    res.json(playlist);
  } catch (err) {
    console.error(err.message);
    // Vérifie si l'ID n'est pas valide (cast error)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Playlist non trouvée' });
    }
    res.status(500).send('Erreur Serveur');
  }
});


// GET /api/playlists - récupère playlists de l'utilisateur (nécessite token)
router.get('/', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'DB non connectée' });
    }
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });

    const playlists = await Playlist.find({ user: req.user.id }).populate('songs').sort({ createdAt: -1 });
    res.json({ success: true, data: playlists });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/playlists - créer une playlist { name, songIds: [], coverImage (file) }
router.post('/', auth, upload.single('coverImage'), async (req, res) => {
  let tempCoverPath = null;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'DB non connectée' });
    }
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });

    const { name, songIds } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Nom requis' });

    // optional: validate songs exist
    let validSongIds = [];
    if (typeof songIds === 'string') {
      try {
        validSongIds = JSON.parse(songIds);
      } catch {
        validSongIds = [];
      }
    } else if (Array.isArray(songIds)) {
      validSongIds = songIds;
    }
    const songsExisting = await Song.find({ _id: { $in: validSongIds } }).select('_id');
    const songs = songsExisting.map(s => s._id);

    // Upload de l'image de couverture si fournie
    let coverImageUrl = null;
    if (req.file) {
      tempCoverPath = req.file.path;
      const cloudResult = await cloudinary.uploader.upload(tempCoverPath, {
        folder: 'playlist_covers',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'center' }
        ]
      });
      coverImageUrl = cloudResult.secure_url;

      // Supprimer le fichier temporaire
      await fs.unlink(tempCoverPath);
      tempCoverPath = null;
    }

    const playlist = await Playlist.create({
      name,
      user: req.user.id,
      songs,
      coverImage: coverImageUrl
    });

    res.status(201).json({ success: true, data: playlist });
  } catch (err) {
    // Nettoyer le fichier temporaire en cas d'erreur
    if (tempCoverPath) {
      try {
        await fs.unlink(tempCoverPath);
      } catch {}
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/playlists/:id - modifier name, songs ou coverImage
router.put('/:id', auth, upload.single('coverImage'), async (req, res) => {
  let tempCoverPath = null;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'DB non connectée' });
    }
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, error: 'Playlist introuvable' });
    if (String(playlist.user) !== String(req.user.id)) return res.status(403).json({ success: false, error: 'Accès interdit' });

    const { name, songIds } = req.body;
    if (name) playlist.name = name;
    if (Array.isArray(songIds)) {
      const songsExisting = await Song.find({ _id: { $in: songIds } }).select('_id');
      playlist.songs = songsExisting.map(s => s._id);
    }

    // Upload de la nouvelle image de couverture si fournie
    if (req.file) {
      tempCoverPath = req.file.path;
      const cloudResult = await cloudinary.uploader.upload(tempCoverPath, {
        folder: 'playlist_covers',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'center' }
        ]
      });
      playlist.coverImage = cloudResult.secure_url;

      // Supprimer le fichier temporaire
      await fs.unlink(tempCoverPath);
      tempCoverPath = null;
    }

    await playlist.save();
    res.json({ success: true, data: playlist });
  } catch (err) {
    // Nettoyer le fichier temporaire en cas d'erreur
    if (tempCoverPath) {
      try {
        await fs.unlink(tempCoverPath);
      } catch {}
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/playlists/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'DB non connectée' });
    }
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, error: 'Playlist introuvable' });
    if (String(playlist.user) !== String(req.user.id)) return res.status(403).json({ success: false, error: 'Accès interdit' });

    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Playlist supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
// ...existing code...