require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connexion à MongoDB
connectDB();

// Middleware CORS - IMPORTANT pour éviter les erreurs
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger pour déboguer
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Servir le frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
app.use('/api/songs', require('./routes/songs'));

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Gestion des erreurs - IMPORTANT
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  
  // S'assurer de renvoyer du JSON
  res.status(500).json({ 
    success: false,
    error: 'Erreur serveur',
    details: err.message 
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces réseau

app.listen(PORT, HOST, () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  // Trouver l'IP locale
  let localIP = 'localhost';
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
      }
    });
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📱 Accès local :     http://localhost:${PORT}`);
  console.log(`🌐 Accès réseau :    http://${localIP}:${PORT}`);
  console.log(`🔌 API :             http://${localIP}:${PORT}/api/songs`);
  console.log(`${'='.repeat(60)}\n`);
});


