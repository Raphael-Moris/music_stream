console.log('🟢 Script chargé correctement!');
const API_URL = `http://${window.location.hostname}:5000/api/songs`;
console.log('🔗 API_URL:', API_URL);

// Charger les chansons au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadSongs();
});

// Gestion du formulaire d'upload
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Veuillez sélectionner un fichier');
        return;
    }

    // Ajouter le fichier
    formData.append('audioFile', file);
    
    // Ajouter les métadonnées optionnelles
    const title = document.getElementById('title').value;
    const artistName = document.getElementById('artistName').value;
    const albumTitle = document.getElementById('albumTitle').value;
    const year = document.getElementById('year').value;
    
    if (title) formData.append('title', title);
    if (artistName) formData.append('artistName', artistName);
    if (albumTitle) formData.append('albumTitle', albumTitle);
    if (year) formData.append('year', year);

    // Afficher la barre de progression
    document.getElementById('progress').style.display = 'block';
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = '⏳ Upload en cours...';

    try {
        const response = await fetch(`${API_URL}/upload`, {  // Remettre /upload
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showResult('✅ Chanson uploadée avec succès!', 'success');
            document.getElementById('uploadForm').reset();
            loadSongs(); // Recharger la liste
        } else {
            showResult('❌ Erreur: ' + data.error, 'error');
        }
    } catch (error) {
        showResult('❌ Erreur réseau: ' + error.message, 'error');
    } finally {
        document.getElementById('progress').style.display = 'none';
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = '📤 Uploader';
    }
});

// Afficher le résultat
function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.className = type;
    resultDiv.style.display = 'block';
    
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}

// Charger toutes les chansons
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

// Afficher les chansons
function displaySongs(songs) {
    const songsListDiv = document.getElementById('songsList');
    
    if (songs.length === 0) {
        songsListDiv.innerHTML = '<p>Aucune chanson uploadée pour le moment.</p>';
        return;
    }

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

// Formater la durée
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Lire une chanson
function playSong(id, audioUrl) {
    window.open(audioUrl, '_blank');
}

// Supprimer une chanson
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
            loadSongs();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// ...existing code...

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Veuillez sélectionner un fichier');
        return;
    }

    // Ajouter le fichier
    formData.append('audioFile', file);
    
    // Ajouter les métadonnées optionnelles
    const title = document.getElementById('title').value;
    const artistName = document.getElementById('artistName').value;
    const albumTitle = document.getElementById('albumTitle').value;
    const year = document.getElementById('year').value;
    const genre = document.getElementById('genre').value; // <-- Ajoute cette ligne

    if (title) formData.append('title', title);
    if (artistName) formData.append('artistName', artistName);
    if (albumTitle) formData.append('albumTitle', albumTitle);
    if (year) formData.append('year', year);
    if (genre) formData.append('genre', genre); // <-- Ajoute cette ligne

    // ...existing code...
});