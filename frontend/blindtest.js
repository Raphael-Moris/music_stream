/**
 * Script Blind Test - Mode solo et multijoueur
 *
 * Fonctionnalités :
 * - Mode solo : parties individuelles avec statistiques sauvegardées
 * - Mode multijoueur : création/rejoindre des salles avec WebSocket (Socket.io)
 * - Système de questions avec timer (30s par défaut)
 * - Score basé sur la rapidité et la précision
 * - Double buffer audio pour transitions fluides
 * - Gestion des playlists personnalisées
 * - Statistiques et historique des parties
 *
 * Architecture :
 * - Socket.io pour la communication temps réel (multijoueur)
 * - API REST pour les parties solo
 * - Double buffer audio (2 éléments <audio>) pour éviter les coupures
 */

// ========== CONFIGURATION ==========
const API_BASE = window.location.origin;
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username') || 'Joueur';

// ========== SOCKET.IO ==========
const socket = io(API_BASE);

// ========== STATE ==========
// État global de l'application Blind Test
let currentScreen = 'screen-mode-selection';  // Écran actuellement affiché
let selectedPlaylistId = null;                // ID de la playlist sélectionnée
let currentGameData = null;                   // Données de la partie en cours
let currentQuestionIndex = 0;                 // Index de la question actuelle
let currentScore = 0;                         // Score du joueur
let gameAnswers = [];                         // Réponses données pendant la partie
let questionStartTime = null;                 // Timestamp du début de la question
let timerInterval = null;                     // Interval pour le compte à rebours
let currentRoomCode = null;                   // Code de la salle (mode multijoueur)
let currentAudioIndex = 0;                    // Index du buffer audio actuel (0 ou 1)
let audioElements = null;                     // Éléments audio pour le double buffering
let isHost = false;                           // true si le joueur est l'hôte de la salle
let hasAnswered = false;                      // true si le joueur a répondu à la question actuelle

// ========== UTILITAIRES ==========

/**
 * Affiche un écran et masque les autres
 *
 * @param {string} screenId - ID de l'écran à afficher
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    lucide.createIcons();
}

async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Erreur réseau');
    }
    return data;
}

// ========== NAVIGATION ==========

document.getElementById('backToHome').addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.getElementById('selectSoloMode').addEventListener('click', () => {
    loadCompatiblePlaylists('solo');
    showScreen('screen-solo-playlist');
});

document.getElementById('selectMultiMode').addEventListener('click', () => {
    showScreen('screen-multi-choice');
});

document.getElementById('cancelSoloPlaylist').addEventListener('click', () => {
    showScreen('screen-mode-selection');
    selectedPlaylistId = null;
});

document.getElementById('backToModeSelection').addEventListener('click', () => {
    resetGame();
    showScreen('screen-mode-selection');
});

document.getElementById('backToModeSelectionFromMulti').addEventListener('click', () => {
    showScreen('screen-mode-selection');
});

document.getElementById('backToModeSelectionFromResults').addEventListener('click', () => {
    resetGame();
    showScreen('screen-mode-selection');
});

// ========== MODE SOLO ==========

async function loadCompatiblePlaylists(mode) {
    try {
        const response = await apiCall('/api/blindtest/playlists/compatible');
        const playlists = response.data;

        const gridId = mode === 'solo' ? 'soloPlaylistGrid' : 'multiPlaylistGrid';
        const grid = document.getElementById(gridId);
        grid.innerHTML = '';

        // Ajouter l'option "Toutes les chansons disponibles" en premier
        const allSongsItem = document.createElement('div');
        allSongsItem.className = 'playlist-item';
        allSongsItem.dataset.playlistId = 'all';

        allSongsItem.innerHTML = `
            <div class="playlist-cover">
                <i data-lucide="library-big" style="width:48px;height:48px;"></i>
            </div>
            <div class="playlist-name">Toutes les chansons</div>
            <div class="playlist-count">Bibliothèque complète</div>
        `;

        allSongsItem.addEventListener('click', () => {
            document.querySelectorAll(`#${gridId} .playlist-item`).forEach(p => p.classList.remove('selected'));
            allSongsItem.classList.add('selected');
            selectedPlaylistId = 'all';

            const startBtn = mode === 'solo'
                ? document.getElementById('startSoloGame')
                : document.getElementById('createRoomWithPlaylist');
            startBtn.disabled = false;
        });

        grid.appendChild(allSongsItem);

        // Ajouter les playlists normales
        if (playlists.length === 0) {
            const message = document.createElement('p');
            message.style.cssText = 'text-align:center; color:#999; padding:40px; grid-column: 1 / -1;';
            message.textContent = 'Aucune playlist personnalisée. Créez une playlist avec au moins 10 pistes ou utilisez "Toutes les chansons".';
            grid.appendChild(message);
        } else {
            playlists.forEach(playlist => {
                const item = document.createElement('div');
                item.className = 'playlist-item';
                item.dataset.playlistId = playlist._id;

                item.innerHTML = `
                    <div class="playlist-cover">
                        ${playlist.coverImage
                            ? `<img src="${playlist.coverImage}" alt="${playlist.name}">`
                            : '<i data-lucide="music" style="width:48px;height:48px;"></i>'}
                    </div>
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-count">${playlist.songCount} pistes</div>
                `;

                item.addEventListener('click', () => {
                    document.querySelectorAll(`#${gridId} .playlist-item`).forEach(p => p.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedPlaylistId = playlist._id;

                    const startBtn = mode === 'solo'
                        ? document.getElementById('startSoloGame')
                        : document.getElementById('createRoomWithPlaylist');
                    startBtn.disabled = false;
                });

                grid.appendChild(item);
            });
        }

        lucide.createIcons();
    } catch (error) {
        console.error('Erreur chargement playlists:', error);
        alert('Impossible de charger les playlists');
    }
}

document.getElementById('startSoloGame').addEventListener('click', async () => {
    if (!selectedPlaylistId) return;

    try {
        const response = await apiCall('/api/blindtest/solo/start', {
            method: 'POST',
            body: JSON.stringify({ playlistId: selectedPlaylistId })
        });

        currentGameData = response.data;
        currentQuestionIndex = 0;
        currentScore = 0;
        gameAnswers = [];
        currentAudioIndex = 0;

        // Initialiser les éléments audio
        audioElements = [
            document.getElementById('soloAudio1'),
            document.getElementById('soloAudio2')
        ];

        // Arrêter le lecteur principal pour éviter les conflits
        const mainAudio = document.getElementById('audio-element');
        if (mainAudio) {
            mainAudio.pause();
        }

        showScreen('screen-solo-game');
        showSoloQuestion();
    } catch (error) {
        console.error('Erreur démarrage partie:', error);
        alert(error.message);
    }
});

function showSoloQuestion() {
    const question = currentGameData.questions[currentQuestionIndex];

    console.log('🎵 Lecture question:', {
        index: currentQuestionIndex,
        audioUrl: question.audioUrl,
        startTime: question.startTime,
        correctAnswer: question.correctAnswer
    });

    // Réinitialiser le flag de réponse
    hasAnswered = false;

    // Update header
    document.getElementById('soloQuestionCounter').textContent = `Question ${currentQuestionIndex + 1}/10`;
    document.getElementById('soloScore').textContent = `${currentScore} pts`;

    // Système de double buffer pour éviter les coupures
    // On alterne entre audio1 et audio2
    const currentAudio = audioElements[currentAudioIndex];
    const nextAudio = audioElements[1 - currentAudioIndex];

    // Stopper l'audio précédent (au cas où)
    nextAudio.pause();
    nextAudio.currentTime = 0;

    // Configurer l'audio actuel
    currentAudio.src = question.audioUrl;
    const startTime = question.startTime || 0;

    // Précharger la prochaine question si elle existe
    if (currentQuestionIndex < currentGameData.questions.length - 1) {
        const nextQuestion = currentGameData.questions[currentQuestionIndex + 1];
        nextAudio.src = nextQuestion.audioUrl;
        nextAudio.load(); // Précharger en arrière-plan
    }

    // Fonction pour démarrer la lecture
    const playAudio = async () => {
        try {
            // Attendre que les métadonnées soient chargées
            if (currentAudio.readyState < 1) {
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout chargement audio')), 10000);
                    currentAudio.addEventListener('loadedmetadata', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                });
            }

            console.log(`📊 Audio prêt - Durée: ${currentAudio.duration}s, StartTime: ${startTime}s`);

            // Définir la position de départ
            currentAudio.currentTime = startTime;

            // Démarrer la lecture
            await currentAudio.play();
            console.log(`▶️  Lecture démarrée (Audio ${currentAudioIndex + 1})`);

            // Arrêter après 21 secondes
            setTimeout(() => {
                if (!currentAudio.paused) {
                    console.log(`⏹️  Arrêt audio après 21s`);
                    currentAudio.pause();
                }
            }, 21000);

        } catch (err) {
            console.error('❌ Erreur lecture:', err);
            // Réessayer une fois sans timeout
            try {
                currentAudio.currentTime = startTime;
                await currentAudio.play();
                console.log('✅ Lecture démarrée (retry réussi)');
            } catch (retryErr) {
                console.error('❌ Échec lecture après retry:', retryErr);
                alert('Erreur de lecture audio. Passage à la question suivante...');
            }
        }
    };

    // Démarrer la lecture immédiatement
    playAudio();

    // Alterner pour la prochaine question
    currentAudioIndex = 1 - currentAudioIndex;

    // Generate options
    const optionsContainer = document.getElementById('soloOptions');
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;

        btn.addEventListener('click', () => {
            handleSoloAnswer(option);
        });

        optionsContainer.appendChild(btn);
    });

    // Start timer
    questionStartTime = Date.now();
    startTimer('solo', 15);

    lucide.createIcons();
}

function startTimer(mode, duration) {
    let timeLeft = duration;
    const timerEl = document.getElementById(mode === 'solo' ? 'soloTimer' : 'multiTimer');
    const fillEl = document.getElementById(mode === 'solo' ? 'soloTimerFill' : 'multiTimerFill');

    timerEl.textContent = timeLeft;
    fillEl.style.width = '100%';

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        fillEl.style.width = `${(timeLeft / duration) * 100}%`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (mode === 'solo') {
                // Si le joueur n'a pas encore répondu, compter comme "passé"
                if (!hasAnswered) {
                    recordAnswer(null);
                }
                // Passer à la question suivante
                nextQuestion();
            }
        }
    }, 1000);
}

function recordAnswer(selectedAnswer) {
    const question = currentGameData.questions[currentQuestionIndex];
    const timeToAnswer = (Date.now() - questionStartTime) / 1000;

    // Calculate points
    let points = 0;
    const isCorrect = selectedAnswer === question.correctAnswer;

    if (selectedAnswer === null) {
        // Skip / Timeout
        points = -10;
    } else if (isCorrect) {
        points = 100;
        if (timeToAnswer < 2) points += 75;
        else if (timeToAnswer < 3) points += 50;
        else if (timeToAnswer < 7) points += 20;
    } else {
        points = -10;
    }

    currentScore += points;
    if (currentScore < 0) currentScore = 0;

    // Save answer
    gameAnswers.push({
        questionIndex: currentQuestionIndex,
        songId: question.songId,
        userAnswer: selectedAnswer || 'Passé',
        correctAnswer: question.correctAnswer,
        timeToAnswer,
        isCorrect,
        points
    });

    // Update score display
    document.getElementById('soloScore').textContent = `${currentScore} pts`;
}

function nextQuestion() {
    currentQuestionIndex++;

    // Délai de 3 secondes avant de passer à la question suivante
    setTimeout(() => {
        if (currentQuestionIndex < currentGameData.questions.length) {
            showSoloQuestion();
        } else {
            endSoloGame();
        }
    }, 3000);
}

function handleSoloAnswer(selectedAnswer) {
    // Empêcher les réponses multiples
    if (hasAnswered) return;
    hasAnswered = true;

    const question = currentGameData.questions[currentQuestionIndex];

    // Disable all buttons
    document.querySelectorAll('#soloOptions .option-btn').forEach(btn => {
        btn.disabled = true;

        if (btn.textContent === question.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.textContent === selectedAnswer && selectedAnswer !== question.correctAnswer) {
            btn.classList.add('incorrect');
        }
    });

    // Enregistrer la réponse
    recordAnswer(selectedAnswer);

    // Le timer continue et passera automatiquement à la question suivante à 0
}

document.getElementById('skipQuestion').addEventListener('click', () => {
    handleSoloAnswer(null);
});

async function endSoloGame() {
    try {
        const response = await apiCall('/api/blindtest/solo/complete', {
            method: 'POST',
            body: JSON.stringify({
                playlistId: currentGameData.playlistId,
                answers: gameAnswers
            })
        });

        const results = response.data;

        // Show results screen
        document.getElementById('finalScore').textContent = `${results.score} pts`;
        document.getElementById('finalAccuracy').textContent = `${results.accuracy}% de réussite`;

        // Generate answers recap
        const recapContainer = document.getElementById('answersRecap');
        recapContainer.innerHTML = '';

        results.answers.forEach((answer, index) => {
            const item = document.createElement('div');
            item.className = `answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;

            item.innerHTML = `
                <div>
                    <strong>Question ${index + 1}</strong><br>
                    <span style="color:#999; font-size:13px;">${answer.correctAnswer}</span>
                </div>
                <div style="text-align:right;">
                    <div style="color:${answer.isCorrect ? '#4ade80' : '#ef4444'}; font-weight:600;">
                        ${answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                    <div style="color:#999; font-size:13px;">${answer.points > 0 ? '+' : ''}${answer.points} pts</div>
                </div>
            `;

            recapContainer.appendChild(item);
        });

        showScreen('screen-solo-results');
    } catch (error) {
        console.error('Erreur fin de partie:', error);
        alert('Erreur lors de la sauvegarde des résultats');
    }
}

document.getElementById('replayWithSamePlaylist').addEventListener('click', () => {
    // Restart with same playlist
    document.getElementById('startSoloGame').click();
});

// ========== MODE MULTIJOUEUR ==========

document.getElementById('createRoom').addEventListener('click', () => {
    loadCompatiblePlaylists('multi');
    showScreen('screen-multi-playlist');
});

document.getElementById('cancelMultiPlaylist').addEventListener('click', () => {
    showScreen('screen-multi-choice');
    selectedPlaylistId = null;
});

document.getElementById('createRoomWithPlaylist').addEventListener('click', async () => {
    if (!selectedPlaylistId) return;

    try {
        const response = await apiCall('/api/blindtest/room/create', {
            method: 'POST',
            body: JSON.stringify({
                playlistId: selectedPlaylistId,
                username: username
            })
        });

        currentRoomCode = response.data.roomCode;
        isHost = true;

        // Join socket room
        socket.emit('join-room', { roomCode: currentRoomCode, userId, username });

        // Show lobby
        document.getElementById('lobbyRoomCode').textContent = currentRoomCode;
        document.getElementById('hostControls').style.display = 'block';
        document.getElementById('guestControls').style.display = 'none';

        showScreen('screen-multi-lobby');
        loadLobbyPlayers();
    } catch (error) {
        console.error('Erreur création salon:', error);
        alert(error.message);
    }
});

document.getElementById('joinRoom').addEventListener('click', () => {
    showScreen('screen-multi-join');
});

document.getElementById('cancelJoinRoom').addEventListener('click', () => {
    showScreen('screen-multi-choice');
});

document.getElementById('confirmJoinRoom').addEventListener('click', async () => {
    const code = document.getElementById('joinRoomCode').value.trim();

    if (code.length !== 6) {
        alert('Le code doit contenir 6 chiffres');
        return;
    }

    try {
        const response = await apiCall('/api/blindtest/room/join', {
            method: 'POST',
            body: JSON.stringify({
                code,
                username: username
            })
        });

        currentRoomCode = code;
        isHost = false;

        // Join socket room
        socket.emit('join-room', { roomCode: currentRoomCode, userId, username });

        // Show lobby
        document.getElementById('lobbyRoomCode').textContent = currentRoomCode;
        document.getElementById('hostControls').style.display = 'none';
        document.getElementById('guestControls').style.display = 'block';

        showScreen('screen-multi-lobby');
        loadLobbyPlayers();
    } catch (error) {
        console.error('Erreur rejoindre salon:', error);
        alert(error.message);
    }
});

async function loadLobbyPlayers() {
    try {
        const response = await apiCall(`/api/blindtest/room/${currentRoomCode}`);
        const room = response.data;

        updatePlayersList(room.players);
    } catch (error) {
        console.error('Erreur chargement joueurs:', error);
    }
}

function updatePlayersList(players) {
    const container = document.getElementById('playersList');
    container.innerHTML = '';

    document.getElementById('playerCount').textContent = players.length;

    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';

        item.innerHTML = `
            <div class="player-name">${player.username}</div>
            <div class="${player.ready ? 'player-ready' : 'player-waiting'}">
                ${player.ready ? 'Prêt' : 'En attente'}
            </div>
        `;

        container.appendChild(item);
    });
}

document.getElementById('playerReadyBtn').addEventListener('click', () => {
    socket.emit('player-ready', { roomCode: currentRoomCode, userId });
    document.getElementById('playerReadyBtn').disabled = true;
    document.getElementById('playerReadyBtn').textContent = 'Prêt !';
});

document.getElementById('startMultiGame').addEventListener('click', () => {
    socket.emit('start-game', { roomCode: currentRoomCode, userId });
});

document.getElementById('leaveLobby').addEventListener('click', () => {
    if (currentRoomCode) {
        socket.emit('leave-room', { roomCode: currentRoomCode, userId });
    }
    resetGame();
    showScreen('screen-mode-selection');
});

// ========== SOCKET.IO EVENTS ==========

socket.on('player-joined', ({ players }) => {
    updatePlayersList(players);
});

socket.on('player-ready-update', ({ players }) => {
    updatePlayersList(players);
});

socket.on('game-started', () => {
    showScreen('screen-multi-game');
    currentScore = 0;
    currentQuestionIndex = 0;
    currentAudioIndex = 0;
    document.getElementById('multiScore').textContent = '0 pts';

    // Initialiser les éléments audio pour le mode multi
    audioElements = [
        document.getElementById('multiAudio1'),
        document.getElementById('multiAudio2')
    ];

    // Arrêter le lecteur principal pour éviter les conflits
    const mainAudio = document.getElementById('audio-element');
    if (mainAudio) {
        mainAudio.pause();
    }
});

socket.on('new-question', ({ questionIndex, audioUrl, startTime, options, totalQuestions }) => {
    currentQuestionIndex = questionIndex;

    // Update header
    document.getElementById('multiQuestionCounter').textContent = `Question ${questionIndex + 1}/${totalQuestions}`;

    // Système de double buffer pour éviter les coupures
    const currentAudio = audioElements[currentAudioIndex];
    const nextAudio = audioElements[1 - currentAudioIndex];

    // Stopper l'audio précédent (au cas où)
    nextAudio.pause();
    nextAudio.currentTime = 0;

    // Configurer l'audio actuel
    currentAudio.src = audioUrl;
    const start = startTime || 0;

    // Fonction pour démarrer la lecture
    const playAudio = async () => {
        try {
            // Attendre que les métadonnées soient chargées
            if (currentAudio.readyState < 1) {
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout chargement audio')), 10000);
                    currentAudio.addEventListener('loadedmetadata', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                });
            }

            // Définir la position de départ
            currentAudio.currentTime = start;

            // Démarrer la lecture
            await currentAudio.play();
            console.log(`▶️  Multi - Lecture démarrée (Audio ${currentAudioIndex + 1})`);

            // Arrêter après 21 secondes
            setTimeout(() => {
                if (!currentAudio.paused) {
                    currentAudio.pause();
                }
            }, 21000);

        } catch (err) {
            console.error('❌ Erreur lecture multi:', err);
            // Réessayer une fois
            try {
                currentAudio.currentTime = start;
                await currentAudio.play();
                console.log('✅ Multi - Lecture démarrée (retry réussi)');
            } catch (retryErr) {
                console.error('❌ Échec lecture multi après retry:', retryErr);
            }
        }
    };

    // Démarrer la lecture
    playAudio();

    // Alterner pour la prochaine question
    currentAudioIndex = 1 - currentAudioIndex;

    // Generate options
    const optionsContainer = document.getElementById('multiOptions');
    optionsContainer.innerHTML = '';

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;

        btn.addEventListener('click', () => {
            handleMultiAnswer(option);
        });

        optionsContainer.appendChild(btn);
    });

    // Start timer
    questionStartTime = Date.now();
    startTimer('multi', 15);

    lucide.createIcons();
});

function handleMultiAnswer(answer) {
    // Ne pas arrêter le timer, il continue jusqu'à la fin des 15 secondes
    const timeToAnswer = (Date.now() - questionStartTime) / 1000;

    // Disable all buttons
    document.querySelectorAll('#multiOptions .option-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === answer) {
            btn.classList.add('selected');
        }
    });

    // Send answer to server
    socket.emit('submit-answer', {
        roomCode: currentRoomCode,
        userId,
        questionIndex: currentQuestionIndex,
        answer,
        timeToAnswer
    });
}

socket.on('answer-result', ({ isCorrect, points, correctAnswer }) => {
    // Show correct answer
    document.querySelectorAll('#multiOptions .option-btn').forEach(btn => {
        if (btn.textContent === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.classList.contains('selected') && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    currentScore += points;
    if (currentScore < 0) currentScore = 0;
    document.getElementById('multiScore').textContent = `${currentScore} pts`;
});

socket.on('question-end', ({ correctAnswer, scoreboard }) => {
    // Update live scoreboard
    const scoreboardContainer = document.getElementById('liveScoreboard');
    scoreboardContainer.innerHTML = '';

    scoreboard
        .sort((a, b) => b.score - a.score)
        .forEach((player, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; padding:8px; background:#1a1a1a; margin-bottom:8px; border-radius:8px;';

            item.innerHTML = `
                <div>
                    <span style="color:#ff6b35; font-weight:600;">${index + 1}.</span>
                    ${player.username}
                </div>
                <div style="font-weight:600;">${player.score} pts</div>
            `;

            scoreboardContainer.appendChild(item);
        });
});

socket.on('game-finished', ({ finalScoreboard }) => {
    // Show podium
    const podiumContainer = document.getElementById('podium');
    podiumContainer.innerHTML = '';

    const topThree = finalScoreboard.slice(0, 3);

    topThree.forEach((player, index) => {
        const place = document.createElement('div');
        const rankClass = index === 0 ? 'first' : index === 1 ? 'second' : 'third';
        place.className = `podium-place ${rankClass}`;

        place.innerHTML = `
            <div class="podium-rank">${index + 1}</div>
            <div class="podium-name">${player.username}</div>
            <div class="podium-score">${player.score} pts</div>
        `;

        podiumContainer.appendChild(place);
    });

    // Show full scoreboard
    const scoreboardContainer = document.getElementById('finalScoreboard');
    scoreboardContainer.innerHTML = '';

    finalScoreboard.forEach((player, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; justify-content:space-between; padding:12px; background:#1a1a1a; margin-bottom:8px; border-radius:8px;';

        item.innerHTML = `
            <div>
                <span style="color:#ff6b35; font-weight:700; font-size:18px;">${index + 1}.</span>
                <span style="font-weight:600; margin-left:12px;">${player.username}</span>
                <span style="color:#999; margin-left:8px;">(${player.correctAnswers}/10 correct)</span>
            </div>
            <div style="font-weight:700; font-size:18px; color:#ff6b35;">${player.score} pts</div>
        `;

        scoreboardContainer.appendChild(item);
    });

    showScreen('screen-multi-results');
});

socket.on('error', ({ message }) => {
    alert(`Erreur: ${message}`);
});

// ========== RESET ==========

function resetGame() {
    if (timerInterval) clearInterval(timerInterval);

    currentGameData = null;
    currentQuestionIndex = 0;
    currentScore = 0;
    gameAnswers = [];
    questionStartTime = null;
    selectedPlaylistId = null;
    currentRoomCode = null;
    isHost = false;

    // Reset audio
    const soloAudio = document.getElementById('soloAudio');
    const multiAudio = document.getElementById('multiAudio');
    if (soloAudio) soloAudio.pause();
    if (multiAudio) multiAudio.pause();
}
