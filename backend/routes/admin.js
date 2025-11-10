const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const cloudinary = require('cloudinary').v2;
const User = require('../models/user');
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const BlindTestGame = require('../models/blindTestGame');
const auth = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Non authentifié' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Accès refusé - Admin uniquement' });
    }
    next();
};

/**
 * GET /api/admin/stats
 * Statistiques globales du système
 */
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const [userCount, songCount, playlistCount, gameCount] = await Promise.all([
            User.countDocuments(),
            Song.countDocuments(),
            Playlist.countDocuments(),
            BlindTestGame.countDocuments()
        ]);

        // Statistiques de la BDD
        const dbStats = await mongoose.connection.db.stats();

        res.json({
            success: true,
            data: {
                users: userCount,
                songs: songCount,
                playlists: playlistCount,
                games: gameCount,
                database: {
                    size: (dbStats.dataSize / 1024 / 1024).toFixed(2) + ' MB',
                    collections: dbStats.collections,
                    indexes: dbStats.indexes
                }
            }
        });
    } catch (error) {
        console.error('Erreur stats admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/admin/users
 * Liste de tous les utilisateurs
 */
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        // Compter les playlists et parties par utilisateur
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const [playlistCount, gameCount] = await Promise.all([
                Playlist.countDocuments({ user: user._id }),
                BlindTestGame.countDocuments({ userId: user._id })
            ]);

            return {
                ...user,
                stats: {
                    playlists: playlistCount,
                    games: gameCount
                }
            };
        }));

        res.json({
            success: true,
            data: usersWithStats
        });
    } catch (error) {
        console.error('Erreur liste users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/admin/songs
 * Liste de toutes les chansons avec détails
 */
router.get('/songs', auth, isAdmin, async (req, res) => {
    try {
        const songs = await Song.find()
            .sort({ createdAt: -1 })
            .lean();

        // Compter l'utilisation dans les playlists
        const songsWithUsage = await Promise.all(songs.map(async (song) => {
            const playlistCount = await Playlist.countDocuments({ songs: song._id });

            return {
                ...song,
                usage: {
                    inPlaylists: playlistCount
                }
            };
        }));

        res.json({
            success: true,
            data: songsWithUsage
        });
    } catch (error) {
        console.error('Erreur liste songs admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/admin/songs/:id
 * Supprimer une chanson de la BDD
 */
router.delete('/songs/:id', auth, isAdmin, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({ success: false, error: 'Chanson introuvable' });
        }

        // Vérifier si la chanson est utilisée dans des playlists
        const playlistCount = await Playlist.countDocuments({ songs: song._id });

        if (playlistCount > 0) {
            // Retirer la chanson de toutes les playlists
            await Playlist.updateMany(
                { songs: song._id },
                { $pull: { songs: song._id } }
            );
        }

        // Supprimer de Cloudinary
        if (song.audioUrl) {
            try {
                const urlParts = song.audioUrl.split('/');
                const filename = urlParts[urlParts.length - 1];
                const publicId = `songs/${filename.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
            } catch (err) {
                console.warn('Erreur suppression Cloudinary audio:', err);
            }
        }

        if (song.coverImage) {
            try {
                const urlParts = song.coverImage.split('/');
                const filename = urlParts[urlParts.length - 1];
                const publicId = `covers/${filename.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.warn('Erreur suppression Cloudinary cover:', err);
            }
        }

        // Supprimer la chanson
        await Song.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Chanson supprimée (retirée de ${playlistCount} playlist(s))`
        });
    } catch (error) {
        console.error('Erreur suppression song admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/admin/server-info
 * Informations sur le serveur et le réseau
 */
router.get('/server-info', auth, isAdmin, async (req, res) => {
    try {
        const networkInterfaces = os.networkInterfaces();
        const ipAddresses = [];

        // Collecter toutes les adresses IP
        Object.keys(networkInterfaces).forEach(interfaceName => {
            networkInterfaces[interfaceName].forEach(iface => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    ipAddresses.push({
                        interface: interfaceName,
                        address: iface.address,
                        mac: iface.mac
                    });
                }
            });
        });

        // Informations système
        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: Math.floor(os.uptime() / 60), // en minutes
            cpus: os.cpus().length,
            totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            nodeVersion: process.version
        };

        // Status MongoDB
        const dbStatus = {
            connected: mongoose.connection.readyState === 1,
            state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };

        res.json({
            success: true,
            data: {
                network: ipAddresses,
                system: systemInfo,
                database: dbStatus,
                port: process.env.PORT || 3500
            }
        });
    } catch (error) {
        console.error('Erreur server-info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/admin/db-health
 * Vérifier la santé de la base de données
 */
router.get('/db-health', auth, isAdmin, async (req, res) => {
    try {
        // Ping la base de données
        const pingResult = await mongoose.connection.db.admin().ping();

        // Obtenir les statistiques des collections
        const collections = await mongoose.connection.db.listCollections().toArray();

        const collectionStats = await Promise.all(
            collections.map(async (collection) => {
                try {
                    const stats = await mongoose.connection.db.collection(collection.name).stats();
                    return {
                        name: collection.name,
                        count: stats.count,
                        size: (stats.size / 1024).toFixed(2) + ' KB',
                        avgObjSize: stats.avgObjSize ? (stats.avgObjSize / 1024).toFixed(2) + ' KB' : 'N/A'
                    };
                } catch (err) {
                    return {
                        name: collection.name,
                        error: 'Unable to get stats'
                    };
                }
            })
        );

        res.json({
            success: true,
            data: {
                healthy: pingResult.ok === 1,
                ping: pingResult,
                collections: collectionStats,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Erreur db-health:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/admin/recent-activity
 * Activité récente sur la plateforme
 */
router.get('/recent-activity', auth, isAdmin, async (req, res) => {
    try {
        const [recentUsers, recentSongs, recentGames] = await Promise.all([
            User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
            Song.find().sort({ createdAt: -1 }).limit(5),
            BlindTestGame.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'username')
        ]);

        res.json({
            success: true,
            data: {
                recentUsers,
                recentSongs,
                recentGames
            }
        });
    } catch (error) {
        console.error('Erreur recent-activity:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
