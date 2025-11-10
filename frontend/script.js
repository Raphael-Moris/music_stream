console.log('🟢 Script chargé correctement!');
const API_URL = `http://${window.location.hostname}:5000/api/songs`;
console.log('🔗 API_URL:', API_URL);

// Charger les chansons au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadSongs();
});

// Ouvre la modale d'importation
document.getElementById('openImportModalBtn').addEventListener('click', () => {
    document.getElementById('importModal').style.display = 'flex';
});

// Ferme la modale
document.getElementById('closeImportModal').addEventListener('click', () => {
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('importForm').reset();
    document.getElementById('importProgress').style.display = 'none';
    document.getElementById('importResult').style.display = 'none';
    document.getElementById('coverImageGroup').style.display = 'none';
});

// Affiche le champ image de couverture si besoin
document.getElementById('audioFile').addEventListener('change', (e) => {
    // Affiche toujours le champ pour l'instant
    document.getElementById('coverImageGroup').style.display = 'block';
});

// Gestion du formulaire d'importation (modale)
document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Veuillez sélectionner un fichier');
        return;
    }

    // Ajout du fichier
    formData.append('audioFile', file);

    // Ajout des métadonnées
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

    // Affiche la barre de progression dans la modale
    document.getElementById('importProgress').style.display = 'block';
    document.getElementById('importSubmitBtn').disabled = true;
    document.getElementById('importSubmitBtn').textContent = '⏳ Upload en cours...';

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showImportResult('✅ Chanson uploadée avec succès!', 'success');
            document.getElementById('importForm').reset();
            document.getElementById('coverImageGroup').style.display = 'none';
            loadSongs();
        } else {
            showImportResult('❌ Erreur: ' + data.error, 'error');
        }
    } catch (error) {
        showImportResult('❌ Erreur réseau: ' + error.message, 'error');
    } finally {
        document.getElementById('importProgress').style.display = 'none';
        document.getElementById('importSubmitBtn').disabled = false;
        document.getElementById('importSubmitBtn').textContent = '📤 Importer';
    }
});

function showImportResult(message, type) {
    const resultDiv = document.getElementById('importResult');
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