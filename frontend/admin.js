/**
 * Script du panneau d'administration
 *
 * Fonctionnalités :
 * - Vue d'ensemble des statistiques (utilisateurs, chansons, playlists, parties)
 * - Gestion des utilisateurs
 * - Gestion des chansons (suppression)
 * - Informations serveur et système
 * - État de santé de la base de données
 *
 * Accès réservé aux utilisateurs avec le rôle "admin"
 */

// Construction de l'URL de l'API en fonction de l'environnement
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3500/api'
    : `http://${window.location.hostname}:3500/api`;

// ========== SYSTÈME DE NOTIFICATIONS ==========

/**
 * Affiche une notification toast avec style personnalisé
 *
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} type - Type de notification ('success', 'error', 'warning', 'info')
 */
function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: linear-gradient(135deg, #1a1a1a, #252525);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-left: 4px solid ${type === 'success' ? '#4ade80' : type === 'error' ? '#f87171' : type === 'warning' ? '#fbbf24' : '#60a5fa'};
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        gap: 14px;
        animation: slideInRight 0.3s ease-out;
        min-width: 300px;
        max-width: 400px;
    `;

    notification.innerHTML = `
        <i data-lucide="${icons[type]}" style="width: 24px; height: 24px; color: ${type === 'success' ? '#4ade80' : type === 'error' ? '#f87171' : type === 'warning' ? '#fbbf24' : '#60a5fa'}; flex-shrink: 0;"></i>
        <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${title}</div>
            ${message ? `<div style="font-size: 13px; color: #999;">${message}</div>` : ''}
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
        </button>
    `;

    container.appendChild(notification);
    lucide.createIcons();

    setTimeout(() => notification.remove(), 5000);
}

// ========== API CALLS ==========

/**
 * Effectue un appel API avec authentification automatique
 *
 * @async
 * @param {string} endpoint - Le endpoint de l'API (ex: '/admin/stats')
 * @param {Object} options - Options fetch (method, body, headers, etc.)
 * @returns {Promise<Object>} La réponse JSON de l'API
 * @throws {Error} Si la requête échoue ou si success est false
 */
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la requête');
    }

    return data;
}

// ========== VERIFY ADMIN ==========

/**
 * Vérifie que l'utilisateur connecté possède le rôle admin
 * Redirige vers index.html si utilisateur normal
 * Redirige vers login.html si non authentifié
 *
 * @async
 * @returns {Promise<boolean>} true si l'utilisateur est admin
 */
async function verifyAdmin() {
    try {
        const response = await apiCall('/profile');
        const user = response.data;

        if (user.role !== 'admin') {
            showNotification('Accès refusé', 'Vous n\'êtes pas autorisé à accéder à cette page', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return false;
        }

        return true;
    } catch (error) {
        showNotification('Erreur', 'Impossible de vérifier les permissions', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
}

// ========== LOAD STATS ==========

/**
 * Charge et affiche les statistiques globales de l'application
 * Affiche : nombre d'utilisateurs, chansons, playlists, parties, taille BDD
 *
 * @async
 */
async function loadStats() {
    try {
        const response = await apiCall('/admin/stats');
        const stats = response.data;

        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${stats.users}</div>
                        <div class="stat-label">Utilisateurs</div>
                    </div>
                    <div class="stat-icon">
                        <i data-lucide="users" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${stats.songs}</div>
                        <div class="stat-label">Chansons</div>
                    </div>
                    <div class="stat-icon">
                        <i data-lucide="music" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${stats.playlists}</div>
                        <div class="stat-label">Playlists</div>
                    </div>
                    <div class="stat-icon">
                        <i data-lucide="list-music" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${stats.games}</div>
                        <div class="stat-label">Parties jouées</div>
                    </div>
                    <div class="stat-icon">
                        <i data-lucide="trophy" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${stats.database.size}</div>
                        <div class="stat-label">Taille BDD</div>
                    </div>
                    <div class="stat-icon">
                        <i data-lucide="database" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
    } catch (error) {
        console.error('Erreur chargement stats:', error);
        showNotification('Erreur', 'Impossible de charger les statistiques', 'error');
    }
}

// ========== LOAD USERS ==========

/**
 * Charge et affiche la liste de tous les utilisateurs
 * Affiche : nom, email, rôle, nombre de playlists, parties, date d'inscription
 *
 * @async
 */
async function loadUsers() {
    try {
        const response = await apiCall('/admin/users');
        const users = response.data;

        const container = document.getElementById('usersContent');

        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="users" style="width: 64px; height: 64px; margin: 0 auto 16px; opacity: 0.3;"></i>
                    <div>Aucun utilisateur</div>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nom d'utilisateur</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Playlists</th>
                        <th>Parties</th>
                        <th>Inscrit le</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td><strong>${user.username}</strong></td>
                            <td>${user.email || '<em>Non renseigné</em>'}</td>
                            <td>
                                <span class="status-badge ${user.role === 'admin' ? 'status-warning' : 'status-success'}">
                                    ${user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                </span>
                            </td>
                            <td>${user.stats.playlists}</td>
                            <td>${user.stats.games}</td>
                            <td>${new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        lucide.createIcons();
    } catch (error) {
        console.error('Erreur chargement users:', error);
        showNotification('Erreur', 'Impossible de charger les utilisateurs', 'error');
    }
}

// ========== LOAD SONGS ==========

/**
 * Charge et affiche la liste de toutes les chansons
 * Affiche : titre, artiste, album, usage dans playlists, date d'ajout
 * Permet la suppression des chansons
 *
 * @async
 */
async function loadSongs() {
    try {
        const response = await apiCall('/admin/songs');
        const songs = response.data;

        const container = document.getElementById('songsContent');

        if (songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="music" style="width: 64px; height: 64px; margin: 0 auto 16px; opacity: 0.3;"></i>
                    <div>Aucune chanson</div>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom: 16px; color: #999; font-size: 14px;">
                <i data-lucide="info" style="width: 16px; height: 16px; display: inline; vertical-align: text-bottom;"></i>
                Vous pouvez supprimer des chansons de la base de données. Elles seront automatiquement retirées de toutes les playlists.
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Titre</th>
                        <th>Artiste</th>
                        <th>Album</th>
                        <th>Dans playlists</th>
                        <th>Ajoutée le</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${songs.map(song => `
                        <tr>
                            <td><strong>${song.title || 'Sans titre'}</strong></td>
                            <td>${song.artist || 'Inconnu'}</td>
                            <td>${song.album || 'Inconnu'}</td>
                            <td>
                                <span class="status-badge ${song.usage.inPlaylists > 0 ? 'status-success' : 'status-warning'}">
                                    ${song.usage.inPlaylists} playlist(s)
                                </span>
                            </td>
                            <td>${new Date(song.createdAt).toLocaleDateString('fr-FR')}</td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteSong('${song._id}')" style="padding: 8px 16px; font-size: 13px;">
                                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        lucide.createIcons();
    } catch (error) {
        console.error('Erreur chargement songs:', error);
        showNotification('Erreur', 'Impossible de charger les chansons', 'error');
    }
}

// ========== DELETE SONG ==========

/**
 * Supprime une chanson de la base de données
 * La chanson est automatiquement retirée de toutes les playlists
 * Demande confirmation avant suppression
 *
 * @async
 * @param {string} songId - L'ID de la chanson à supprimer
 */
async function deleteSong(songId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette chanson ? Elle sera retirée de toutes les playlists.')) {
        return;
    }

    try {
        const response = await apiCall(`/admin/songs/${songId}`, {
            method: 'DELETE'
        });

        showNotification('Succès', response.message, 'success');
        await loadSongs();
        await loadStats();
    } catch (error) {
        console.error('Erreur suppression song:', error);
        showNotification('Erreur', 'Impossible de supprimer la chanson: ' + error.message, 'error');
    }
}

// ========== LOAD SERVER INFO ==========

/**
 * Charge et affiche les informations du serveur
 * Affiche : réseau, port, système (OS, hostname, CPUs, RAM, uptime, Node.js), base de données
 *
 * @async
 */
async function loadServerInfo() {
    try {
        const response = await apiCall('/admin/server-info');
        const info = response.data;

        const container = document.getElementById('serverContent');

        container.innerHTML = `
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-title">
                        <i data-lucide="wifi" style="width: 20px; height: 20px;"></i>
                        Réseau
                    </div>
                    ${info.network.map(iface => `
                        <div class="info-item">
                            <span class="info-label">${iface.interface}</span>
                            <span class="info-value">${iface.address}</span>
                        </div>
                    `).join('')}
                    <div class="info-item">
                        <span class="info-label">Port</span>
                        <span class="info-value">${info.port}</span>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-card-title">
                        <i data-lucide="cpu" style="width: 20px; height: 20px;"></i>
                        Système
                    </div>
                    <div class="info-item">
                        <span class="info-label">Plateforme</span>
                        <span class="info-value">${info.system.platform} (${info.system.arch})</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Hostname</span>
                        <span class="info-value">${info.system.hostname}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">CPUs</span>
                        <span class="info-value">${info.system.cpus} core(s)</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">RAM totale</span>
                        <span class="info-value">${info.system.totalMemory}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">RAM libre</span>
                        <span class="info-value">${info.system.freeMemory}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Uptime</span>
                        <span class="info-value">${info.system.uptime} minutes</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Node.js</span>
                        <span class="info-value">${info.system.nodeVersion}</span>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-card-title">
                        <i data-lucide="database" style="width: 20px; height: 20px;"></i>
                        Base de données
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status</span>
                        <span class="status-badge ${info.database.connected ? 'status-success' : 'status-error'}">
                            ${info.database.state}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Hôte</span>
                        <span class="info-value">${info.database.host || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Base</span>
                        <span class="info-value">${info.database.name || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
    } catch (error) {
        console.error('Erreur chargement server info:', error);
        showNotification('Erreur', 'Impossible de charger les informations serveur', 'error');
    }
}

// ========== LOAD DATABASE INFO ==========

/**
 * Charge et affiche l'état de santé de la base de données
 * Affiche : état de santé, collections avec nombre de documents et tailles
 *
 * @async
 */
async function loadDatabaseInfo() {
    try {
        const response = await apiCall('/admin/db-health');
        const health = response.data;

        const container = document.getElementById('databaseContent');

        container.innerHTML = `
            <div class="info-card" style="margin-bottom: 24px;">
                <div class="info-card-title">
                    <i data-lucide="activity" style="width: 20px; height: 20px;"></i>
                    État de santé
                </div>
                <div class="info-item">
                    <span class="info-label">Status</span>
                    <span class="status-badge ${health.healthy ? 'status-success' : 'status-error'}">
                        ${health.healthy ? 'Sain' : 'Problème détecté'}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">Dernier check</span>
                    <span class="info-value">${new Date(health.timestamp).toLocaleString('fr-FR')}</span>
                </div>
            </div>

            <div class="table-container">
                <h3 style="margin-bottom: 16px; color: #ff6b35;">Collections</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Documents</th>
                            <th>Taille</th>
                            <th>Taille moy. obj.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${health.collections.map(col => `
                            <tr>
                                <td><strong>${col.name}</strong></td>
                                <td>${col.count || 0}</td>
                                <td>${col.size || 'N/A'}</td>
                                <td>${col.avgObjSize || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        lucide.createIcons();
    } catch (error) {
        console.error('Erreur chargement db health:', error);
        showNotification('Erreur', 'Impossible de charger les informations BDD', 'error');
    }
}

// ========== TAB NAVIGATION ==========

/**
 * Configure la navigation par onglets
 * Charge automatiquement les données correspondantes lors du changement d'onglet
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');

            // Charger les données correspondant à l'onglet
            switch (targetTab) {
                case 'users':
                    loadUsers();
                    break;
                case 'songs':
                    loadSongs();
                    break;
                case 'server':
                    loadServerInfo();
                    break;
                case 'database':
                    loadDatabaseInfo();
                    break;
            }
        });
    });
}

// ========== INIT ==========

/**
 * Initialisation de la page d'administration
 * - Vérifie les permissions admin
 * - Configure la navigation par onglets
 * - Charge les données initiales (stats et utilisateurs)
 * - Initialise les icônes Lucide
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier que l'utilisateur est admin
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return;

    // Configuration de la navigation par onglets
    setupTabs();

    // Chargement des données initiales
    await loadStats();
    await loadUsers();

    // Initialisation des icônes Lucide
    lucide.createIcons();
});
