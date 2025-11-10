const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/user');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Helper : lire admin.json si présent
async function readAdmin() {
  try {
    const adminPath = path.join(__dirname, '..', 'data', 'admin.json');
    const raw = await fs.readFile(adminPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

// Inscription (utilisateurs normaux -> nécessite MongoDB connectée)
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('📝 Tentative d\'inscription:', { username, hasPassword: !!password });

  if (!username || !password) {
    console.log('❌ Inscription échouée: champs manquants');
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis.' });
  }

  // Vérifier connexion MongoDB
  if (mongoose.connection.readyState !== 1) {
    console.log('❌ Inscription échouée: MongoDB non connecté');
    return res.status(503).json({ error: 'Service d\'inscription indisponible (DB non connectée).' });
  }

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      console.log('❌ Inscription échouée: utilisateur déjà existant -', username);
      return res.status(409).json({ error: 'Nom d\'utilisateur déjà utilisé.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hash });
    console.log('✅ Inscription réussie:', username, '- ID:', newUser._id);
    res.status(201).json({ message: 'Inscription réussie !' });
  } catch (err) {
    console.error('❌ Erreur inscription:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Connexion (admin en dur, admin via fichier JSON ou utilisateur via MongoDB si connecté)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Tous les champs sont requis.' });

  try {
    // 0) Vérifier admin en dur (priorité absolue)
    if (username === 'admin' && password === 'admin') {
      console.log('✅ Connexion admin en dur réussie');
      const payload = { id: 'admin-hardcoded', username: 'admin', role: 'admin' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, userId: 'admin-hardcoded', username: 'admin', role: 'admin' });
    }

    // 1) Vérifier admin.json en priorité
    const admin = await readAdmin();
    if (admin && (admin.username === username || admin.email === username)) {
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (match) {
        const payload = { id: admin.id || 'admin', username: admin.username, role: admin.role || 'admin' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, userId: payload.id, username: admin.username, role: payload.role });
      } else {
        return res.status(401).json({ error: 'Mot de passe incorrect.' });
      }
    }

    // 2) Si pas admin -> utiliser MongoDB si connecté
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Service d\'authentification utilisateur indisponible (DB non connectée).' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ Connexion échouée: utilisateur inconnu -', username);
      return res.status(401).json({ error: 'Utilisateur inconnu.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('❌ Connexion échouée: mot de passe incorrect -', username);
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    console.log('✅ Connexion réussie:', username, '- Rôle:', user.role);
    res.json({ token, userId: user._id.toString(), username: user.username, role: user.role });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;