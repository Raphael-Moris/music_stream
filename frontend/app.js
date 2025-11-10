// Minimal streaming homepage logic wired to backend /api/songs
(() => {
  const API_URL = '/api/songs';

  const els = {
    recGrid: document.getElementById('recommendations-grid'),
    lastGrid: document.getElementById('recently-grid'),
    cover: document.getElementById('player-cover'),
    coverIcon: document.getElementById('player-cover-icon'),
    title: document.getElementById('player-title'),
    artist: document.getElementById('player-artist'),
    playPause: document.getElementById('play-pause-btn'),
    prev: document.getElementById('prev-btn'),
    next: document.getElementById('next-btn'),
    audio: document.getElementById('audio-element'),
    fill: document.getElementById('progress-fill'),
    cur: document.getElementById('current-time'),
    total: document.getElementById('total-time'),
    logout: document.getElementById('logoutBtn')
  };

  const state = {
    songs: [],
    queue: [],
    index: 0,
    playing: false
  };

  function fmt(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function setPlayer(track) {
    // Gérer l'affichage de la couverture ou de l'icône
    if (track.coverImage) {
      els.cover.src = track.coverImage;
      els.cover.style.display = 'block';
      if (els.coverIcon) els.coverIcon.style.display = 'none';
    } else {
      els.cover.src = '';
      els.cover.style.display = 'none';
      if (els.coverIcon) els.coverIcon.style.display = 'block';
    }

    // Sur mobile, laisser le CSS gérer la troncature avec text-overflow
    els.title.textContent = track.title || 'Sans titre';
    els.artist.textContent = [track.artist, track.album].filter(Boolean).join(' • ');
    els.audio.src = track.audioUrl;
  }

  function renderPlayButton(isPlaying) {
    if (!els.playPause) return;
    if (isPlaying) {
      els.playPause.innerHTML = '<span class="pause-symbol">II</span>';
    } else {
      els.playPause.innerHTML = '<i data-lucide="play"></i>';
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  }

  function playIndex(i) {
    if (state.queue.length === 0) return;
    state.index = (i + state.queue.length) % state.queue.length;
    const track = state.queue[state.index];
    if (!track || !track.audioUrl) return;
    setPlayer(track);
    els.audio.play().then(() => {
      state.playing = true;
      updatePlayIcon();
    }).catch(() => {
      state.playing = false;
      updatePlayIcon();
    });
  }

  function updatePlayIcon() {
    renderPlayButton(state.playing);
  }

  function renderGrid(container, items) {
    if (!container) return;
    container.innerHTML = items.map((t, idx) => `
      <div class="card" data-idx="${idx}">
        <img src="${t.coverImage || 'https://via.placeholder.com/300/1e1e24/FFFFFF?text=Music'}" alt="${(t.title || '').replace(/"/g, '&quot;')}">
        <div class="meta">
          <div class="title">${t.title || 'Sans titre'}</div>
          <div class="artist">${[t.artist, t.album].filter(Boolean).join(' • ')}</div>
        </div>
      </div>
    `).join('');

    Array.from(container.querySelectorAll('.card')).forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.idx) || 0;
        const clicked = items[idx];
        const realIndex = state.queue.findIndex(s => String(s._id) === String(clicked._id));
        playIndex(realIndex >= 0 ? realIndex : idx);
      });
    });
  }

  async function loadSongs() {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      const list = (json && (json.data || json.songs || [])) || [];
      state.songs = Array.isArray(list) ? list : [];
      state.queue = state.songs.slice();

      const recs = state.songs.slice(0, 8);
      const latest = state.songs.slice(0, 12);
      renderGrid(els.recGrid, recs);
      renderGrid(els.lastGrid, latest);

      if (state.queue[0]) setPlayer(state.queue[0]);
    } catch (e) {
      console.error('Erreur chargement des chansons:', e);
    }
  }

  function bindControls() {
    els.playPause.addEventListener('click', () => {
      if (!els.audio.src) {
        playIndex(state.index);
        return;
      }
      if (state.playing) {
        els.audio.pause();
        state.playing = false;
      } else {
        els.audio.play().then(() => { state.playing = true; }).catch(() => { state.playing = false; });
      }
      updatePlayIcon();
    });
    els.prev.addEventListener('click', () => playIndex(state.index - 1));
    els.next.addEventListener('click', () => playIndex(state.index + 1));

    els.audio.addEventListener('timeupdate', () => {
      const cur = els.audio.currentTime || 0;
      const dur = els.audio.duration || 0;
      els.cur.textContent = fmt(cur);
      els.total.textContent = fmt(dur);
      const pct = dur > 0 ? (cur / dur) * 100 : 0;
      els.fill.style.width = pct + '%';
    });
    els.audio.addEventListener('play', () => { state.playing = true; updatePlayIcon(); });
    els.audio.addEventListener('pause', () => { state.playing = false; updatePlayIcon(); });
    els.audio.addEventListener('ended', () => playIndex(state.index + 1));

    if (els.logout) {
      els.logout.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
      });
    }

    updatePlayIcon();

    // Click on progress bar to seek
    const bar = document.querySelector('.bar');
    bar?.addEventListener('click', (e) => {
      if (!els.audio.src) return;
      const rect = bar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      els.audio.currentTime = (els.audio.duration || 0) * pct;
    });
  }

  // Exposer la fonction pour mettre à jour la queue depuis la bibliothèque
  window.updatePlayerQueue = (songs, index, autoplay = true) => {
    state.queue = songs;
    state.index = index;
    if (autoplay) {
      playIndex(index);
    } else {
      setPlayer(state.queue[index]);
    }
  };

  // Initialiser au chargement
  document.addEventListener('DOMContentLoaded', () => {
    bindControls();
    loadSongs();
    // Initialiser les icônes Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  });
})();

// Section bibliothèque et playlists
document.addEventListener('DOMContentLoaded', () => {
  const songsList = document.getElementById('songsList');
  const openCreatePlaylist = document.getElementById('openCreatePlaylist');
  const playlistModal = document.getElementById('playlistModal');
  const playlistForm = document.getElementById('playlistForm');
  const cancelPlaylist = document.getElementById('cancelPlaylist');
  const playlistNameInput = document.getElementById('playlistName');
  const playlistSongsCheckboxes = document.getElementById('playlistSongsCheckboxes');
  const playlistsList = document.getElementById('playlistsList');
  const mainContent = document.querySelector('.main-content');
  const playlistDetailSection = document.getElementById('playlist-detail-view');

  // Image par défaut pour les playlists (note à double crochet)
  const playlistCoverPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjZiMzU7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjhjNDI7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0idXJsKCNncmFkKSIgcng9IjIwIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTgwLCAxMjApIj48cGF0aCBkPSJNIDcwIDIwIEwgNzAgMTYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSIxNzAiIHI9IjIwIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTSA3MCAyMCBMIDExMCA0MCBMIDExMCAxNDAgTCA3MCAxNjAgWiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjkwIiBjeT0iMTUwIiByPSIyMCIgZmlsbD0iI2ZmNmIzNSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMTcwIiByPSIyMCIgZmlsbD0iI2ZmNmIzNSIvPjwvZz48L3N2Zz4=';

  let allSongs = [];
  let currentPlaylistSongs = []; // Pour stocker les chansons de la playlist actuellement affichée
  let currentPlaylistIdForFilter = null; // Pour stocker l'ID de la playlist affichée
  let selectedPlaylistCoverFile = null;
  const token = localStorage.getItem('token');

  const scrollToPlaylistTop = () => {
    requestAnimationFrame(() => {
      if (playlistDetailSection && typeof playlistDetailSection.scrollIntoView === 'function') {
        playlistDetailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (mainContent) {
        try {
          mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
          mainContent.scrollTop = 0;
        }
      }
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    });
  };

  async function loadLibrarySongs() {
    try {
      const res = await fetch('/api/songs');
      const json = await res.json();
      allSongs = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : (json.data || []));
      renderSongs();
    } catch (err) {
      console.error('Erreur loadSongs', err);
      if (songsList) songsList.innerHTML = '<div>Impossible de charger les chansons.</div>';
    }
  }

  function renderSongs(filter = '') {
    if (!songsList) return;
    songsList.innerHTML = '';
    if (!allSongs || allSongs.length === 0) {
      songsList.innerHTML = '<div>Aucune chanson disponible.</div>';
      return;
    }

    // Filtrer les chansons si un filtre est fourni
    const filteredSongs = filter ? allSongs.filter(s => {
      const title = (s.title || s.name || '').toLowerCase();
      const artist = (s.artist || '').toLowerCase();
      const searchTerm = filter.toLowerCase();
      return title.includes(searchTerm) || artist.includes(searchTerm);
    }) : allSongs;

    if (filteredSongs.length === 0) {
      songsList.innerHTML = '<div style="text-align:center; color:#999; padding:40px;">Aucune chanson trouvée</div>';
      return;
    }

    filteredSongs.forEach((s, idx) => {
      const cover = s.coverImage || s.cover;
      const title = s.title || s.name || s.filename || 'Titre inconnu';
      const artist = s.artist || s.artistName || 'Artiste inconnu';
      const album = s.album || s.albumTitle || '';
      const year = s.year || s.releaseYear || '';
      const metaLine = [artist, album, year].filter(Boolean).join(' • ');

      const div = document.createElement('div');
      div.className = 'card song-card';

      // Générer le contenu de l'image/icône
      let coverContent;
      if (cover) {
        coverContent = `<img src="${cover}" alt="${title.replace(/"/g, '&quot;')}">`;
      } else {
        // Icône par défaut : note de musique simple (music-2)
        coverContent = `<i data-lucide="music-2" style="width:64px; height:64px; color:#fff;"></i>`;
      }

      div.innerHTML = `
        <div class="card-image song-card-image" data-index="${idx}" data-id="${s._id || ''}">
          ${coverContent}
          <button class="song-card-play playBtn" data-index="${idx}" data-id="${s._id || ''}">
            <i data-lucide="play"></i>
          </button>
        </div>
        <div class="card-title">${title}</div>
        <div class="card-subtitle">${metaLine}</div>
      `;
      songsList.appendChild(div);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Play handler (song cards)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.playBtn');
    if (!btn) return;
    const songId = btn.dataset.id;
    const indexAttr = btn.dataset.index;

    if (songId && allSongs.length > 0) {
      const idx = allSongs.findIndex(s => String(s._id) === String(songId));
      if (idx >= 0 && window.updatePlayerQueue) {
        window.updatePlayerQueue(allSongs, idx);
        return;
      }
    }

    const idx = Number(indexAttr);
    if (!Number.isNaN(idx) && window.updatePlayerQueue) {
      window.updatePlayerQueue(allSongs, idx);
    }
  });

  // Playlists : gestion modal & création avec upload de couverture
  const playlistCoverInput = document.getElementById('playlistCoverInput');
  const playlistCoverPreview = document.getElementById('playlistCoverPreview');
  const playlistCoverIcon = document.getElementById('playlistCoverIcon');
  const playlistCoverUploadButton = document.getElementById('playlistCoverUploadButton');
  const playlistCoverButtonLabel = document.getElementById('playlistCoverButtonLabel');

  // Gestion de l'upload de couverture
  playlistCoverUploadButton?.addEventListener('click', () => {
    playlistCoverInput?.click();
  });

  playlistCoverInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      selectedPlaylistCoverFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (playlistCoverPreview) {
          playlistCoverPreview.src = ev.target.result;
          playlistCoverPreview.style.display = 'block';
        }
        if (playlistCoverIcon) {
          playlistCoverIcon.style.display = 'none';
        }
        if (playlistCoverButtonLabel) {
          playlistCoverButtonLabel.textContent = file.name;
        }
      };
      reader.readAsDataURL(file);
    }
  });

  openCreatePlaylist?.addEventListener('click', () => {
    playlistSongsCheckboxes.innerHTML = '';
    (allSongs || []).forEach(s => {
      const id = s._id;
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.marginBottom = '12px';
      label.style.cursor = 'pointer';
      label.innerHTML = `<input type="checkbox" name="song" value="${id}" style="margin-right:10px;"> ${s.title || s.name} — ${s.artist || ''}`;
      playlistSongsCheckboxes.appendChild(label);
    });
    playlistNameInput.value = '';
    selectedPlaylistCoverFile = null;

    // Réinitialiser l'affichage de la couverture : afficher l'icône, masquer l'image
    if (playlistCoverPreview) {
      playlistCoverPreview.src = '';
      playlistCoverPreview.style.display = 'none';
    }
    if (playlistCoverIcon) {
      playlistCoverIcon.style.display = 'block';
    }
    if (playlistCoverButtonLabel) {
      playlistCoverButtonLabel.textContent = 'Importer une image';
    }

    playlistModal.style.display = 'flex';

    // Réinitialiser la barre de recherche
    const searchInput = document.getElementById('searchPlaylistSongs');
    if (searchInput) searchInput.value = '';

    // Réinitialiser les icônes Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  });

  cancelPlaylist?.addEventListener('click', (e) => {
    e.preventDefault();
    playlistModal.style.display = 'none';
  });

  playlistForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = playlistNameInput.value.trim();
    if (!name) return alert('Nom requis');
    const selected = Array.from(playlistSongsCheckboxes.querySelectorAll('input[name="song"]:checked')).map(i => i.value);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('songIds', JSON.stringify(selected));
      if (selectedPlaylistCoverFile) {
        formData.append('coverImage', selectedPlaylistCoverFile);
      }

      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        body: formData
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erreur création playlist');
      playlistModal.style.display = 'none';
      selectedPlaylistCoverFile = null;
      loadPlaylists();
    } catch (err) {
      console.error('create playlist', err);
      alert('Erreur création playlist : ' + err.message);
    }
  });

  async function loadPlaylists() {
    try {
      const res = await fetch('/api/playlists', { headers: { ...(token ? { 'Authorization': 'Bearer ' + token } : {}) } });
      const json = await res.json();
      if (!json.success) {
        if (playlistsList) playlistsList.innerHTML = `<div>${json.error || 'Impossible de charger playlists'}</div>`;
        return;
      }
      renderPlaylistsList(json.data || []);
    } catch (err) {
      console.error('loadPlaylists', err);
      if (playlistsList) playlistsList.innerHTML = '<div>Erreur chargement playlists.</div>';
    }
  }

  function renderPlaylistsList(list) {
    if (!playlistsList) return;
    playlistsList.innerHTML = '';
    if (!list || list.length === 0) {
      playlistsList.innerHTML = '<div>Aucune playlist.</div>';
      return;
    }
    list.forEach(p => {
      const div = document.createElement('div');
      div.className = 'card playlist-card';
      div.dataset.id = p._id;
      div.style.cursor = 'pointer';

      const songCount = (p.songs || []).length;

      // Générer le contenu de la couverture
      let coverContent;
      if (p.coverImage) {
        coverContent = `<img src="${p.coverImage}" alt="${(p.name || '').replace(/"/g, '&quot;')}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
      } else {
        // Icône par défaut : note de musique avec double crochet (même que blindtest)
        coverContent = `<i data-lucide="music" style="width:64px; height:64px; color:#fff;"></i>`;
      }

      div.innerHTML = `
        <div class="card-image">
          ${coverContent}
        </div>
        <div class="card-title">${p.name}</div>
        <div class="card-subtitle">${songCount} ${songCount > 1 ? 'chansons' : 'chanson'}</div>
      `;

      // Clic sur la carte pour ouvrir la playlist
      div.addEventListener('click', async () => {
        const id = div.dataset.id;
        try {
          const res = await fetch(`/api/playlists/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!res.ok) {
            throw new Error('Erreur lors de la récupération de la playlist');
          }

          const playlist = await res.json();

          // Afficher les détails
          document.getElementById('playlist-detail-title').textContent = playlist.name;
          document.getElementById('playlist-detail-count').textContent = `${playlist.songs.length} titres`;

          // Stocker l'ID de la playlist courante
          window.currentPlaylistId = id;
          window.currentPlaylistSongs = playlist.songs;
          window.currentPlaylistCover = playlist.coverImage;

          // Afficher la couverture de la playlist
          updatePlaylistCover(playlist.coverImage || playlistCoverPlaceholder);

          // Afficher la liste des chansons
          renderPlaylistSongs(playlist.songs, id);

          // Basculer vers la vue détaillée
          document.body.classList.add('playlist-open');
          document.getElementById('accueil').classList.remove('active');
          document.getElementById('playlist-detail-view').classList.add('active');
          scrollToPlaylistTop();

          if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
          }

        } catch (error) {
          console.error('Erreur lors de l\'ouverture de la playlist:', error);
          alert('Impossible d\'ouvrir la playlist.');
        }
      });

      playlistsList.appendChild(div);
    });

    // Rendre les icônes Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function updatePlaylistCover(coverUrl) {
    const coverElement = document.getElementById('playlist-detail-cover');
    if (coverElement) {
      coverElement.src = coverUrl;
    }
  }

  function renderPlaylistSongs(songs, playlistId, filter = '') {
    const container = document.getElementById('playlist-songs-container');
    if (!container) return;
    container.innerHTML = '';

    // Sauvegarder les chansons pour le filtrage
    currentPlaylistSongs = songs;
    currentPlaylistIdForFilter = playlistId;

    // Filtrer les chansons si un filtre est fourni
    const filteredSongs = filter ? songs.filter(s => {
      const title = (s.title || '').toLowerCase();
      const artist = (s.artist || '').toLowerCase();
      const searchTerm = filter.toLowerCase();
      return title.includes(searchTerm) || artist.includes(searchTerm);
    }) : songs;

    if (filteredSongs.length === 0) {
      container.innerHTML = '<div style="text-align:center; color:#999; padding:40px;">Aucune chanson trouvée</div>';
      return;
    }

    filteredSongs.forEach((song, idx) => {
      const songCard = document.createElement('div');
      songCard.className = 'song-item';
      songCard.style.cssText = 'display:flex;align-items:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:12px;margin-bottom:12px;cursor:pointer;transition:all 0.2s;';

      const coverUrl = song.coverImage || 'https://via.placeholder.com/300/1e1e24/FFFFFF?text=Music';
      const title = song.title || 'Titre inconnu';
      const artist = song.artist || 'Artiste inconnu';

      songCard.innerHTML = `
        <img src="${coverUrl}" alt="${title.replace(/"/g, '&quot;')}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:16px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:16px;color:#fff;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${title}</div>
          <div style="font-size:14px;color:#999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${artist}</div>
        </div>
        <button class="remove-song-from-playlist-btn" data-song-id="${song._id}" data-playlist-id="${playlistId}" style="background:transparent;border:none;color:#ff6b35;cursor:pointer;padding:8px;margin-left:12px;opacity:0.7;transition:opacity 0.2s;">
          <i data-lucide="trash-2" style="width:20px;height:20px;"></i>
        </button>
      `;

      // Survol
      songCard.addEventListener('mouseenter', () => {
        songCard.style.background = 'rgba(255,255,255,0.06)';
      });
      songCard.addEventListener('mouseleave', () => {
        songCard.style.background = 'rgba(255,255,255,0.03)';
      });

      // Clic pour jouer (sauf sur le bouton supprimer)
      songCard.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-song-from-playlist-btn')) {
          const playlistQueue = songs.map(s => ({
            _id: s._id,
            title: s.title,
            artist: s.artist,
            audioUrl: s.audioUrl,
            coverImage: s.coverImage || 'https://via.placeholder.com/300/1e1e24/FFFFFF?text=Music'
          }));

          if (window.updatePlayerQueue) {
            window.updatePlayerQueue(playlistQueue, idx);
          }
        }
      });

      container.appendChild(songCard);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Gestion du retour aux playlists
  document.addEventListener('click', (e) => {
    if (e.target.closest('#backToPlaylists')) {
      document.body.classList.remove('playlist-open');
      document.getElementById('playlist-detail-view').classList.remove('active');
      document.getElementById('accueil').classList.add('active');
      document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(n => n.classList.remove('active'));
      const accueilNav = document.querySelector('.nav-item[data-target="accueil"], .mobile-nav-item[data-target="accueil"]');
      if (accueilNav) accueilNav.classList.add('active');

      // Réinitialiser la barre de recherche de la playlist
      const searchInput = document.getElementById('searchPlaylistDetailSongs');
      if (searchInput) searchInput.value = '';
    }
  });

  // Gestion de l'édition du nom de la playlist
  document.addEventListener('click', async (e) => {
    if (e.target.closest('#editPlaylistNameBtn')) {
      const titleElement = document.getElementById('playlist-detail-title');
      const currentName = titleElement.textContent;
      const playlistId = window.currentPlaylistId;

      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentName;
      input.style.cssText = 'font-size: 32px; font-weight: 700; color: #fff; background: rgba(255,255,255,0.1); border: 2px solid #ff6b35; border-radius: 8px; padding: 8px 12px; outline: none; width: 100%;';

      const saveEdit = async () => {
        const newName = input.value.trim();
        if (!newName || newName === currentName) {
          titleElement.textContent = currentName;
          input.replaceWith(titleElement);
          return;
        }

        try {
          const res = await fetch(`/api/playlists/${playlistId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName })
          });

          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Erreur modification');

          titleElement.textContent = newName;
          input.replaceWith(titleElement);
          loadPlaylists();
        } catch (err) {
          alert('Erreur modification : ' + err.message);
          titleElement.textContent = currentName;
          input.replaceWith(titleElement);
        }
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveEdit();
        } else if (e.key === 'Escape') {
          titleElement.textContent = currentName;
          input.replaceWith(titleElement);
        }
      });

      input.addEventListener('blur', saveEdit);

      titleElement.replaceWith(input);
      input.focus();
      input.select();
    }
  });

  // Gestion de la suppression de la playlist
  const deletePlaylistButton = document.getElementById('deletePlaylistButton');
  deletePlaylistButton?.addEventListener('click', async () => {
    const id = window.currentPlaylistId;
    if (!id) return;
    if (!confirm('Voulez-vous vraiment supprimer cette playlist ?')) return;

    try {
      const res = await fetch('/api/playlists/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erreur suppression');

      // Retour à l'accueil
      document.body.classList.remove('playlist-open');
      document.getElementById('playlist-detail-view').classList.remove('active');
      document.getElementById('accueil').classList.add('active');
      loadPlaylists();
    } catch (err) {
      alert('Erreur suppression : ' + err.message);
    }
  });

  // Gestion du bouton play de la playlist
  const playlistPlayButton = document.getElementById('playlistPlayButton');
  playlistPlayButton?.addEventListener('click', () => {
    if (window.currentPlaylistSongs && window.currentPlaylistSongs.length > 0) {
      const queue = window.currentPlaylistSongs.map(s => ({
        _id: s._id,
        title: s.title,
        artist: s.artist,
        audioUrl: s.audioUrl,
        coverImage: s.coverImage || 'https://via.placeholder.com/300/1e1e24/FFFFFF?text=Music'
      }));

      if (window.updatePlayerQueue) {
        window.updatePlayerQueue(queue, 0);
      }
    }
  });

  // Gestion de la suppression d'une chanson de la playlist
  document.addEventListener('click', async (e) => {
    const removeBtn = e.target.closest('.remove-song-from-playlist-btn');
    if (removeBtn) {
      e.stopPropagation();
      const songId = removeBtn.dataset.songId;
      const playlistId = removeBtn.dataset.playlistId;

      if (!confirm('Retirer cette chanson de la playlist ?')) return;

      try {
        const currentSongIds = window.currentPlaylistSongs.map(s => s._id).filter(id => id !== songId);

        const res = await fetch(`/api/playlists/${playlistId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ songIds: currentSongIds })
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Erreur suppression');

        // Recharger la playlist
        const playlistRes = await fetch(`/api/playlists/${playlistId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const playlist = await playlistRes.json();

        window.currentPlaylistSongs = playlist.songs;
        document.getElementById('playlist-detail-count').textContent = `${playlist.songs.length} titres`;
        renderPlaylistSongs(playlist.songs, playlistId);

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      } catch (err) {
        alert('Erreur lors de la suppression : ' + err.message);
      }
    }
  });

  // Gestion de l'ajout de chansons à la playlist
  const addSongsModal = document.getElementById('addSongsModal');
  const addSongsBtn = document.getElementById('addSongsToPlaylist');
  const cancelAddSongs = document.getElementById('cancelAddSongs');
  const confirmAddSongs = document.getElementById('confirmAddSongs');
  const addSongsCheckboxes = document.getElementById('addSongsCheckboxes');

  addSongsBtn?.addEventListener('click', () => {
    if (!window.currentPlaylistId || !allSongs) return;

    const playlistSongIds = new Set(window.currentPlaylistSongs.map(s => s._id));
    const availableSongs = allSongs.filter(s => !playlistSongIds.has(s._id));

    addSongsCheckboxes.innerHTML = '';
    if (availableSongs.length === 0) {
      addSongsCheckboxes.innerHTML = '<p style="color:#999;">Toutes vos chansons sont déjà dans cette playlist.</p>';
    } else {
      availableSongs.forEach(s => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '12px';
        label.style.cursor = 'pointer';
        label.innerHTML = `
          <input type="checkbox" name="addSong" value="${s._id}" style="margin-right:10px;">
          <span style="font-weight:600;">${s.title || s.name}</span>
          <span style="color:#999;margin-left:8px;">— ${s.artist || ''}</span>
        `;
        addSongsCheckboxes.appendChild(label);
      });
    }

    addSongsModal.style.display = 'flex';
  });

  cancelAddSongs?.addEventListener('click', () => {
    addSongsModal.style.display = 'none';
  });

  confirmAddSongs?.addEventListener('click', async () => {
    const selected = Array.from(addSongsCheckboxes.querySelectorAll('input[name="addSong"]:checked')).map(i => i.value);

    if (selected.length === 0) {
      alert('Veuillez sélectionner au moins une chanson.');
      return;
    }

    try {
      const currentSongIds = window.currentPlaylistSongs.map(s => s._id);
      const newSongIds = [...currentSongIds, ...selected];

      const res = await fetch(`/api/playlists/${window.currentPlaylistId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songIds: newSongIds })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erreur ajout');

      // Recharger la playlist
      const playlistRes = await fetch(`/api/playlists/${window.currentPlaylistId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const playlist = await playlistRes.json();

      window.currentPlaylistSongs = playlist.songs;
      document.getElementById('playlist-detail-count').textContent = `${playlist.songs.length} titres`;
      renderPlaylistSongs(playlist.songs, window.currentPlaylistId);

      addSongsModal.style.display = 'none';

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (err) {
      alert('Erreur lors de l\'ajout : ' + err.message);
    }
  });

  // Gestion du changement de couverture de playlist
  const editPlaylistCoverBtn = document.getElementById('editPlaylistCoverBtn');
  const playlistDetailCoverInput = document.getElementById('playlistDetailCoverInput');

  editPlaylistCoverBtn?.addEventListener('click', () => {
    playlistDetailCoverInput?.click();
  });

  playlistDetailCoverInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file || !window.currentPlaylistId) return;

    try {
      const formData = new FormData();
      formData.append('coverImage', file);

      const res = await fetch(`/api/playlists/${window.currentPlaylistId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erreur modification');

      // Mettre à jour l'affichage de la couverture
      const reader = new FileReader();
      reader.onload = (ev) => {
        updatePlaylistCover(ev.target.result);
        window.currentPlaylistCover = ev.target.result;
      };
      reader.readAsDataURL(file);

      // Recharger la liste des playlists
      loadPlaylists();
    } catch (err) {
      alert('Erreur modification couverture : ' + err.message);
    }
  });

  // ========== BLIND TEST STATS ==========

  async function loadBlindTestStats() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) return;

    try {
      const res = await fetch(`/api/blindtest/stats/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        console.log('Pas encore de stats blind test');
        return;
      }

      const json = await res.json();
      const stats = json.data;

      // Mettre à jour les stats
      document.getElementById('blindtest-victories').textContent = stats.totalGames || 0;
      document.getElementById('blindtest-accuracy').textContent = `${stats.averageAccuracy || 0}%`;
      document.getElementById('blindtest-bestscore').textContent = stats.bestScore || 0;

      // Afficher les playlists récemment jouées
      const recentPlaylistsGrid = document.getElementById('recent-playlists-grid');
      if (!recentPlaylistsGrid) return;

      if (!stats.recentPlaylists || stats.recentPlaylists.length === 0) {
        recentPlaylistsGrid.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">Aucune partie jouée récemment</p>';
        return;
      }

      recentPlaylistsGrid.innerHTML = stats.recentPlaylists.map(item => {
        const playlistName = item.playlistName || 'Playlist';
        const score = item.score || 0;
        const accuracy = item.accuracy || 0;

        return `
          <div class="card" style="cursor:default;">
            <div class="meta">
              <div class="title">${playlistName}</div>
              <div class="artist" style="color:#ff6b35; font-weight:600;">${score} pts (${accuracy}% réussite)</div>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('Erreur chargement stats blind test:', err);
    }
  }

  // Event listener pour la recherche dans les chansons disponibles
  const searchSongsInput = document.getElementById('searchSongs');
  if (searchSongsInput) {
    searchSongsInput.addEventListener('input', (e) => {
      renderSongs(e.target.value);
    });
  }

  // Event listener pour la recherche dans la fenêtre de création de playlist
  const searchPlaylistSongsInput = document.getElementById('searchPlaylistSongs');
  if (searchPlaylistSongsInput) {
    searchPlaylistSongsInput.addEventListener('input', (e) => {
      filterPlaylistCheckboxes(e.target.value);
    });
  }

  // Event listener pour la recherche dans le détail de la playlist
  const searchPlaylistDetailSongsInput = document.getElementById('searchPlaylistDetailSongs');
  if (searchPlaylistDetailSongsInput) {
    searchPlaylistDetailSongsInput.addEventListener('input', (e) => {
      if (currentPlaylistSongs && currentPlaylistIdForFilter) {
        renderPlaylistSongs(currentPlaylistSongs, currentPlaylistIdForFilter, e.target.value);
      }
    });
  }

  // Fonction pour filtrer les checkboxes dans la fenêtre de création de playlist
  function filterPlaylistCheckboxes(filter) {
    const checkboxes = playlistSongsCheckboxes.querySelectorAll('label');
    const searchTerm = filter.toLowerCase();

    checkboxes.forEach(label => {
      const text = label.textContent.toLowerCase();
      if (searchTerm === '' || text.includes(searchTerm)) {
        label.style.display = 'flex';
      } else {
        label.style.display = 'none';
      }
    });
  }

  // Initial load
  loadLibrarySongs();
  loadPlaylists();
  loadBlindTestStats();
});
