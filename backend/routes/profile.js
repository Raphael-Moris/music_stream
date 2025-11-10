const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/user');
const auth = require('../middleware/auth');

// Configuration Multer pour l'upload d'image
const upload = multer({
  dest: 'temp/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.'));
    }
  }
});

/**
 * GET /api/profile
 * Récupérer les informations du profil de l'utilisateur connecté
 */
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    // Cas spécial pour l'admin hardcoded
    if (req.user.id === 'admin-hardcoded') {
      return res.json({
        success: true,
        data: {
          _id: 'admin-hardcoded',
          username: req.user.username || 'admin',
          email: null,
          profileImage: null,
          role: 'admin',
          createdAt: new Date()
        }
      });
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/profile
 * Mettre à jour le profil (username et/ou password)
 */
router.put('/', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    const { username, currentPassword, newPassword } = req.body;

    // Cas spécial pour l'admin hardcoded
    if (req.user.id === 'admin-hardcoded') {
      // L'admin ne peut pas changer son nom d'utilisateur
      if (username) {
        return res.status(403).json({
          success: false,
          error: 'Les administrateurs ne peuvent pas modifier leur nom d\'utilisateur'
        });
      }

      // L'admin hardcoded ne peut pas changer son mot de passe (géré dans le code)
      if (newPassword) {
        return res.status(403).json({
          success: false,
          error: 'Veuillez modifier le mot de passe admin dans le fichier de configuration'
        });
      }

      return res.json({ success: true, message: 'Aucune modification possible pour cet administrateur' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    // Les administrateurs ne peuvent pas changer leur nom d'utilisateur
    if (username && user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Les administrateurs ne peuvent pas modifier leur nom d\'utilisateur'
      });
    }

    // Si modification du mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe actuel est requis pour changer de mot de passe'
        });
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Mot de passe actuel incorrect'
        });
      }

      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Si modification du nom d'utilisateur (uniquement pour les non-admins)
    if (username && username !== user.username) {
      // Vérifier si le nouveau username est déjà pris
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Ce nom d\'utilisateur est déjà pris'
        });
      }
      user.username = username;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      requiresRelogin: !!newPassword, // Indique si une reconnexion est nécessaire
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/profile/image
 * Upload ou mise à jour de l'image de profil
 */
router.post('/image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucune image fournie' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    // Si l'utilisateur a déjà une image de profil, la supprimer de Cloudinary
    if (user.profileImage) {
      try {
        // Extraire le public_id de l'URL Cloudinary
        const urlParts = user.profileImage.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `profile_images/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn('Erreur suppression ancienne image:', err);
      }
    }

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_images',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    // Mettre à jour l'utilisateur
    user.profileImage = result.secure_url;
    await user.save();

    // Supprimer le fichier temporaire
    const fs = require('fs').promises;
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn('Erreur suppression fichier temp:', err);
    }

    res.json({
      success: true,
      message: 'Image de profil mise à jour',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Erreur upload image profil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/profile/image
 * Supprimer l'image de profil
 */
router.delete('/image', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    if (!user.profileImage) {
      return res.status(400).json({ success: false, error: 'Aucune image de profil à supprimer' });
    }

    // Supprimer de Cloudinary
    try {
      const urlParts = user.profileImage.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `profile_images/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('Erreur suppression image Cloudinary:', err);
    }

    // Retirer l'image du profil
    user.profileImage = null;
    await user.save();

    res.json({
      success: true,
      message: 'Image de profil supprimée'
    });
  } catch (error) {
    console.error('Erreur suppression image profil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
