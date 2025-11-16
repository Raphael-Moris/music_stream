/**
 * Script principal pour la gestion de la bibliothèque musicale (ancienne version)
 *
 * Ce script gère l'upload de chansons et l'affichage de la bibliothèque.
 * Note: Ce fichier est conservé pour la compatibilité avec d'anciennes pages.
 */

console.log('🟢 Script chargé correctement!');

// Construction de l'URL de l'API en fonction de l'hôte actuel
const API_URL = `http://${window.location.hostname}:5000/api/songs`;
console.log('🔗 API_URL:', API_URL);

// Charger les chansons au démarrage de la page
document.addEventListener('DOMContentLoaded', () => {
    loadSongs();
});

// ========== GESTION DE LA MODALE D'IMPORTATION ==========

// Ouvre la modale d'importation de chanson
document.getElementById('openImportModalBtn').addEventListener('click', () => {
    document.getElementById('importModal').style.display = 'flex';
});

// Ferme la modale et réinitialise le formulaire
document.getElementById('closeImportModal').addEventListener('click', () => {
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('importForm').reset();
    document.getElementById('importProgress').style.display = 'none';
    document.getElementById('importResult').style.display = 'none';
    document.getElementById('coverImageGroup').style.display = 'none';
});

// Affiche le champ de sélection d'image de couverture lors de la sélection d'un fichier audio
document.getElementById('audioFile').addEventListener('change', (e) => {
    // Affiche toujours le champ pour permettre l'upload d'une couverture personnalisée
    document.getElementById('coverImageGroup').style.display = 'block';
});

/**
 * Gestion de la soumission du formulaire d'importation de chanson
 *
 * Cette fonction traite l'upload d'un fichier audio et de ses métadonnées associées :
 * - Fichier audio obligatoire
 * - Métadonnées optionnelles : titre, artiste, album, année, genre
 * - Image de couverture optionnelle
 */
document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Création de l'objet FormData pour l'envoi multipart
    const formData = new FormData();
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];

    // Validation du fichier audio
    if (!file) {
        alert('Veuillez sélectionner un fichier');
        return;
    }

    // Ajout du fichier audio au FormData
    formData.append('audioFile', file);

    // Collecte et ajout des métadonnées si présentes
    const title = document.getElementById('title').value;
    const artistName = document.getElementById('artistName').value;
    const albumTitle = document.getElementById('albumTitle').value;
    const year = document.getElementById('year').value;
    const genre = document.getElementById('genre').value;
    const coverImage = document.getElementById('coverImage').files[0];

    if (title) formData.append('title', title);
    if (artistName) formData.append('artistName', artistName);
    if (albumTitle) formData.append('albumTitle', albumTitle);
    if (year) formData.append('year', year);
    if (genre) formData.append('genre', genre);
    if (coverImage) formData.append('coverImage', coverImage);

    // Affichage de la progression et désactivation du bouton pour éviter les doubles soumissions
    document.getElementById('importProgress').style.display = 'block';
    document.getElementById('importSubmitBtn').disabled = true;
    document.getElementById('importSubmitBtn').textContent = '⏳ Upload en cours...';

    try {
        // Envoi de la requête d'upload au serveur
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showImportResult('✅ Chanson uploadée avec succès!', 'success');
            document.getElementById('importForm').reset();
            document.getElementById('coverImageGroup').style.display = 'none';
            // Recharger la liste des chansons pour afficher la nouvelle chanson
            loadSongs();
        } else {
            showImportResult('❌ Erreur: ' + data.error, 'error');
        }
    } catch (error) {
        showImportResult('❌ Erreur réseau: ' + error.message, 'error');
    } finally {
        // Réinitialisation de l'interface peu importe le résultat
        document.getElementById('importProgress').style.display = 'none';
        document.getElementById('importSubmitBtn').disabled = false;
        document.getElementById('importSubmitBtn').textContent = '📤 Importer';
    }
});

/**
 * Affiche un message de résultat d'importation
 *
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de message ('success' ou 'error')
 */
function showImportResult(message, type) {
    const resultDiv = document.getElementById('importResult');
    resultDiv.textContent = message;
    resultDiv.className = type;
    resultDiv.style.display = 'block';

    // Masquer le message automatiquement après 5 secondes
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}

// ========== CHARGEMENT ET AFFICHAGE DES CHANSONS ==========

/**
 * Charge toutes les chansons depuis l'API
 *
 * @async
 */
async function loadSongs() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.success) {
            displaySongs(data.data);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des chansons:', error);
    }
}

/**
 * Affiche la liste des chansons dans l'interface
 *
 * @param {Array} songs - Tableau des chansons à afficher
 */
function displaySongs(songs) {
    const songsListDiv = document.getElementById('songsList');

    if (songs.length === 0) {
        songsListDiv.innerHTML = '<p>Aucune chanson uploadée pour le moment.</p>';
        return;
    }

    // Génération du HTML pour chaque chanson
    songsListDiv.innerHTML = songs.map(song => `
        <div class="song-item">
            ${song.coverImage ? `<img src="${song.coverImage}" alt="Cover">` : '<div class="no-cover">🎵</div>'}
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist} - ${song.album}</p>
                <small>${formatDuration(song.duration)} | ${song.playCount} écoutes</small>
            </div>
            <button onclick="playSong('${song._id}', '${song.audioUrl}')">▶️ Play</button>
            <button onclick="deleteSong('${song._id}')" class="delete-btn">🗑️</button>
        </div>
    `).join('');
}

/**
 * Formate une durée en secondes au format MM:SS
 *
 * @param {number} seconds - La durée en secondes
 * @returns {string} La durée formatée (ex: "3:42")
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========== LECTURE ET SUPPRESSION DE CHANSONS ==========

/**
 * Ouvre une chanson dans un nouvel onglet pour la lire
 *
 * @param {string} id - L'ID de la chanson
 * @param {string} audioUrl - L'URL du fichier audio
 */
function playSong(id, audioUrl) {
    window.open(audioUrl, '_blank');
}

/**
 * Supprime une chanson après confirmation
 *
 * @async
 * @param {string} id - L'ID de la chanson à supprimer
 */
async function deleteSong(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette chanson ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('Chanson supprimée');
            // Recharger la liste pour refléter la suppression
            loadSongs();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}