// MusicStream Application - Main JavaScript File
class MusicStreamApp {
    constructor() {
        this.currentUser = null;
        this.currentTrack = null;
        this.currentPage = 'home';
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.8;
        this.queue = [];
        this.queueIndex = 0;
        this.shuffle = false;
        this.repeat = 0; // 0: no repeat, 1: repeat all, 2: repeat one
        this.theme = 'light';
        this.sidebarCollapsed = false;
        this.gameState = null;
        this.gameQuestions = [];
        this.gameScore = 0;
        this.gameCurrentQuestion = 0;
        
        this.data = {
            demoUser: {
                id: "demo-user-001",
                email: "demo@musicstream.com",
                username: "MusiqueLover",
                displayName: "Demo User",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
                bio: "Passionné de musique depuis toujours, j'adore découvrir de nouveaux artistes et partager mes coups de cœur !",
                favoriteGenres: ["Rock", "Pop", "Electronic", "Jazz", "Hip-Hop"],
                isPremium: true,
                stats: {
                    totalListeningTime: "1,247h 32min",
                    tracksPlayed: 8947,
                    artistsDiscovered: 342,
                    playlistsCreated: 23,
                    blindTestWins: 156,
                    achievements: 42
                }
            },
            tracks: [
                {
                    id: "track-001",
                    title: "Electric Dreams",
                    artist: "Neon Pulse",
                    album: "Cyber Nights",
                    duration: 243,
                    genre: "Electronic",
                    year: 2023,
                    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
                    isLiked: true,
                    bpm: 128,
                    key: "Am",
                    energy: 0.8,
                    danceability: 0.9,
                    lyrics: "Verse 1:\nIn the neon-lit streets we roam\nElectric dreams calling us home\nSynthetic beats pulse through the night\nWe dance until the morning light\n\nChorus:\nElectric dreams, electric dreams\nNothing is quite what it seems\nIn this digital paradise\nWe pay the ultimate price"
                },
                {
                    id: "track-002", 
                    title: "Midnight Jazz",
                    artist: "Blue Note Collective",
                    album: "After Hours",
                    duration: 298,
                    genre: "Jazz",
                    year: 2022,
                    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
                    isLiked: false,
                    bpm: 92,
                    key: "Bb",
                    energy: 0.4,
                    danceability: 0.3,
                    lyrics: "Instrumental track with sultry saxophone melodies weaving through smoky club atmosphere..."
                },
                {
                    id: "track-003",
                    title: "Rock Revolution",
                    artist: "Thunder Strike",
                    album: "Amplified",
                    duration: 267,
                    genre: "Rock",
                    year: 2023,
                    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
                    isLiked: true,
                    bpm: 140,
                    key: "E",
                    energy: 0.95,
                    danceability: 0.7,
                    lyrics: "Verse 1:\nGuitars screaming in the night\nAmplifiers burning bright\nFeel the power, feel the sound\nRock revolution all around"
                },
                {
                    id: "track-004",
                    title: "Pop Sensation",
                    artist: "Luna Star",
                    album: "Radio Hits", 
                    duration: 201,
                    genre: "Pop",
                    year: 2024,
                    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
                    isLiked: true,
                    bpm: 120,
                    key: "C",
                    energy: 0.85,
                    danceability: 0.95,
                    lyrics: "Verse 1:\nDancing under disco lights\nEverything's gonna be alright\nPop sensation in the air\nMusic magic everywhere"
                },
                {
                    id: "track-005",
                    title: "Hip-Hop Vibes",
                    artist: "MC Flow",
                    album: "Street Chronicles",
                    duration: 234,
                    genre: "Hip-Hop",
                    year: 2023,
                    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
                    isLiked: false,
                    bpm: 95,
                    key: "Gm",
                    energy: 0.75,
                    danceability: 0.8,
                    lyrics: "Verse 1:\nStarted from the bottom now we here\nHip-hop vibes crystal clear\nSpitting bars with passion and flow\nThis is how the legends grow"
                }
            ],
            playlists: [
                {
                    id: "playlist-001",
                    name: "Mes Favoris",
                    description: "Les titres que j'écoute en boucle",
                    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                    trackCount: 47,
                    duration: 11847,
                    isPublic: false,
                    createdAt: "2024-01-15",
                    tracks: ["track-001", "track-003", "track-004"]
                },
                {
                    id: "playlist-002", 
                    name: "Workout Energy",
                    description: "Pour booster mes séances de sport",
                    cover: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
                    trackCount: 32,
                    duration: 8976,
                    isPublic: true,
                    createdAt: "2024-02-03",
                    tracks: ["track-001", "track-003", "track-005"]
                },
                {
                    id: "playlist-003",
                    name: "Chill Evening",
                    description: "Pour les soirées détente",
                    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
                    trackCount: 28,
                    duration: 7234,
                    isPublic: true, 
                    createdAt: "2024-01-28",
                    tracks: ["track-002", "track-004"]
                }
            ],
            genres: [
                {name: "Electronic", color: "#FF6B35", trackCount: 1247},
                {name: "Rock", color: "#FF8C42", trackCount: 892},
                {name: "Pop", color: "#FFA500", trackCount: 1456}, 
                {name: "Jazz", color: "#FF7F50", trackCount: 523},
                {name: "Hip-Hop", color: "#FF6347", trackCount: 789}
            ],
            recentlyPlayed: [
                {trackId: "track-001", playedAt: "2024-03-15T14:30:00Z"},
                {trackId: "track-003", playedAt: "2024-03-15T14:26:00Z"},
                {trackId: "track-004", playedAt: "2024-03-15T14:22:00Z"},
                {trackId: "track-002", playedAt: "2024-03-15T14:18:00Z"}
            ],
            searchSuggestions: [
                "Electronic music", "Rock classics", "Jazz standards", "Pop hits 2024",
                "Chill vibes", "Workout songs", "Indie discoveries", "Retro synthwave"
            ],
            blindTestQuestions: [
                {
                    id: "q001",
                    trackId: "track-001",
                    audioStart: 30,
                    duration: 15,
                    difficulty: "easy",
                    category: "Electronic",
                    hints: ["Genre: Electronic", "Released in 2023", "Artist starts with 'N'"]
                },
                {
                    id: "q002", 
                    trackId: "track-002",
                    audioStart: 45,
                    duration: 10,
                    difficulty: "medium",
                    category: "Jazz", 
                    hints: ["Genre: Jazz", "Instrumental track", "Released in 2022"]
                },
                {
                    id: "q003",
                    trackId: "track-003", 
                    audioStart: 60,
                    duration: 12,
                    difficulty: "hard",
                    category: "Rock",
                    hints: ["High energy track", "Guitar-driven", "BPM: 140"]
                }
            ]
        };
        
        console.log('MusicStreamApp constructor called');
        this.init();
    }

    init() {
        console.log('Initializing MusicStream app...');
        this.loadTheme();
        
        // Wait for DOM to be fully loaded before setting up event listeners
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.checkAuth();
            });
        } else {
            this.setupEventListeners();
            this.checkAuth();
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Login form - Fixed with multiple approaches
        const loginForm = document.getElementById('login-form');
        const loginButton = document.querySelector('#login-form button[type="submit"]');
        
        if (loginForm) {
            console.log('Login form found, adding event listener');
            loginForm.addEventListener('submit', (e) => {
                console.log('Login form submitted');
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin();
                return false;
            });
        } else {
            console.error('Login form not found!');
        }

        // Also add click listener to login button as backup
        if (loginButton) {
            console.log('Login button found, adding click listener');
            loginButton.addEventListener('click', (e) => {
                console.log('Login button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin();
                return false;
            });
        }

        // Add Enter key listener to password field
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter pressed in password field');
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Theme toggle - Fixed event listener
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Theme toggle clicked');
                this.toggleTheme();
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Navigation - Fixed event listeners
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = e.currentTarget.dataset.page;
                console.log('Menu item clicked:', page);
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });

        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = e.currentTarget.dataset.page;
                console.log('Bottom nav item clicked:', page);
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });

        // Audio player controls
        this.setupAudioPlayerControls();

        // Search functionality
        this.setupSearchFunctionality();

        // Library tabs
        this.setupLibraryTabs();

        // Blind Test functionality
        this.setupBlindTestFunctionality();

        // Modal controls
        this.setupModalControls();

        // Responsive handling
        this.setupResponsiveHandling();
        
        console.log('Event listeners setup complete');
    }

    setupAudioPlayerControls() {
        const audio = document.getElementById('audio-element');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const playerToggle = document.getElementById('player-toggle');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const shuffleBtn = document.getElementById('shuffle-btn');
        const repeatBtn = document.getElementById('repeat-btn');
        const likeBtn = document.getElementById('like-btn');
        const volumeBtn = document.getElementById('volume-btn');
        const volumeSlider = document.querySelector('.volume-slider');
        const progressContainer = document.querySelector('.progress-container');

        // Play/Pause
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }
        if (playerToggle) {
            playerToggle.addEventListener('click', () => this.togglePlayPause());
        }

        // Previous/Next
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousTrack());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextTrack());
        }

        // Shuffle
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }

        // Repeat
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }

        // Like
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleLike());
        }

        // Volume
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
        if (volumeSlider) {
            volumeSlider.addEventListener('click', (e) => this.handleVolumeChange(e));
        }

        // Progress bar
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => this.handleProgressChange(e));
        }

        // Audio events
        if (audio) {
            audio.addEventListener('loadedmetadata', () => this.updateDuration());
            audio.addEventListener('timeupdate', () => this.updateProgress());
            audio.addEventListener('ended', () => this.handleTrackEnd());
            audio.addEventListener('loadstart', () => this.showLoading());
            audio.addEventListener('canplay', () => this.hideLoading());
        }

        // Mobile player controls
        const mobilePlayPause = document.getElementById('mobile-play-pause');
        const mobilePrev = document.getElementById('mobile-prev');
        const mobileNext = document.getElementById('mobile-next');
        const closeMobilePlayer = document.getElementById('close-mobile-player');
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        if (mobilePlayPause) {
            mobilePlayPause.addEventListener('click', () => this.togglePlayPause());
        }
        if (mobilePrev) {
            mobilePrev.addEventListener('click', () => this.previousTrack());
        }
        if (mobileNext) {
            mobileNext.addEventListener('click', () => this.nextTrack());
        }
        if (closeMobilePlayer) {
            closeMobilePlayer.addEventListener('click', () => this.closeMobilePlayer());
        }
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.openMobilePlayer());
        }

        // Queue and lyrics buttons
        const queueBtn = document.getElementById('queue-btn');
        const lyricsBtn = document.getElementById('lyrics-btn');

        if (queueBtn) {
            queueBtn.addEventListener('click', () => this.showQueue());
        }
        if (lyricsBtn) {
            lyricsBtn.addEventListener('click', () => this.showLyrics());
        }
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('search-input');
        const voiceSearch = document.getElementById('voice-search');
        const filterBtns = document.querySelectorAll('.filter-btn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        if (voiceSearch) {
            voiceSearch.addEventListener('click', () => {
                this.startVoiceSearch();
            });
        }

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.filterSearchResults(e.currentTarget.dataset.filter);
            });
        });
    }

    setupLibraryTabs() {
        const libraryTabs = document.querySelectorAll('.library-tab');
        
        libraryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                libraryTabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                document.querySelectorAll('.library-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                const tabName = e.currentTarget.dataset.tab;
                const contentElement = document.getElementById(`library-${tabName}`);
                if (contentElement) {
                    contentElement.classList.add('active');
                }
                
                this.loadLibraryContent(tabName);
            });
        });
    }

    setupBlindTestFunctionality() {
        // Game mode selection
        document.querySelectorAll('.game-mode').forEach(mode => {
            mode.addEventListener('click', (e) => {
                const modeType = e.currentTarget.dataset.mode;
                this.startBlindTestSetup(modeType);
            });
        });

        // Game setup
        const startGameBtn = document.getElementById('start-game');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.startBlindTestGame();
            });
        }

        // Game play
        const playClipBtn = document.getElementById('play-clip');
        const submitAnswerBtn = document.getElementById('submit-answer');
        const useHintBtn = document.getElementById('use-hint');
        const answerInput = document.getElementById('answer-input');

        if (playClipBtn) {
            playClipBtn.addEventListener('click', () => {
                this.playGameClip();
            });
        }

        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', () => {
                this.submitAnswer();
            });
        }

        if (useHintBtn) {
            useHintBtn.addEventListener('click', () => {
                this.useHint();
            });
        }

        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitAnswer();
                }
            });
        }

        // Game results
        const playAgainBtn = document.getElementById('play-again');
        const backToMenuBtn = document.getElementById('back-to-menu');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.playAgain();
            });
        }

        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                this.backToBlindTestMenu();
            });
        }
    }

    setupModalControls() {
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.currentTarget.closest('.modal');
                this.closeModal(modal);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    setupResponsiveHandling() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Touch events for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    // Authentication - Fixed with better error handling and logging
    checkAuth() {
        console.log('Checking authentication...');
        const savedUser = localStorage.getItem('musicstream_user');
        if (savedUser) {
            console.log('Saved user found, logging in automatically');
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showMainApp();
            } catch (e) {
                console.error('Error parsing saved user data:', e);
                localStorage.removeItem('musicstream_user');
                this.showLogin();
            }
        } else {
            console.log('No saved user, showing login screen');
            this.showLogin();
        }
    }

    handleLogin() {
        console.log('handleLogin called');
        
        try {
            const emailElement = document.getElementById('email');
            const passwordElement = document.getElementById('password');
            
            if (!emailElement || !passwordElement) {
                console.error('Email or password field not found');
                this.showToast('Erreur: champs de connexion non trouvés', 'error');
                return;
            }

            const email = emailElement.value.trim();
            const password = passwordElement.value.trim();
            
            console.log('Login attempt with email:', email);
            console.log('Password length:', password.length);

            if (!email || !password) {
                this.showToast('Veuillez remplir tous les champs', 'error');
                return;
            }

            if (email === 'demo@musicstream.com' && password === 'demo123') {
                console.log('Login successful');
                this.currentUser = this.data.demoUser;
                
                try {
                    localStorage.setItem('musicstream_user', JSON.stringify(this.currentUser));
                    console.log('User data saved to localStorage');
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
                
                this.showMainApp();
                this.showToast('Connexion réussie ! Bienvenue sur MusicStream 🎵', 'success');
            } else {
                console.log('Invalid credentials provided');
                this.showToast('Email ou mot de passe incorrect', 'error');
            }
        } catch (error) {
            console.error('Error in handleLogin:', error);
            this.showToast('Erreur lors de la connexion', 'error');
        }
    }

    handleLogout() {
        console.log('Logging out user');
        localStorage.removeItem('musicstream_user');
        this.currentUser = null;
        this.showLogin();
        this.showToast('Déconnexion réussie', 'success');
    }

    showLogin() {
        console.log('Showing login screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
            console.log('Login screen shown');
        } else {
            console.error('Login screen element not found');
        }
        
        if (mainApp) {
            mainApp.classList.add('hidden');
        }
    }

    showMainApp() {
        console.log('Showing main application');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }
        
        if (mainApp) {
            mainApp.classList.remove('hidden');
            console.log('Main app shown');
        } else {
            console.error('Main app element not found');
        }
        
        this.loadInitialData();
    }

    // Theme management - Fixed theme toggle functionality
    loadTheme() {
        const savedTheme = localStorage.getItem('musicstream_theme') || 'light';
        this.theme = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon();
        console.log('Theme loaded:', savedTheme);
    }

    toggleTheme() {
        console.log('Theme toggle clicked, current theme:', this.theme);
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.theme);
        localStorage.setItem('musicstream_theme', this.theme);
        this.updateThemeIcon();
        this.showToast(`Thème ${this.theme === 'dark' ? 'sombre' : 'clair'} activé`, 'success');
        console.log('Theme changed to:', this.theme);
    }

    updateThemeIcon() {
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    // Navigation - Fixed navigation functionality
    navigateToPage(page) {
        console.log('Navigating to page:', page);
        
        // Update active states in sidebar
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update active states in bottom nav
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Show page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log('Page shown:', page);
        } else {
            console.error('Page not found:', `${page}-page`);
        }

        this.currentPage = page;
        this.loadPageContent(page);
    }

    loadPageContent(page) {
        console.log('Loading content for page:', page);
        switch (page) {
            case 'home':
                this.loadHomePage();
                break;
            case 'search':
                this.loadSearchPage();
                break;
            case 'library':
                this.loadLibraryPage();
                break;
            case 'blindtest':
                this.loadBlindTestPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
        }
    }

    // Page loading functions
    loadInitialData() {
        console.log('Loading initial data...');
        this.loadSidebarPlaylists();
        this.loadHomePage();
    }

    loadSidebarPlaylists() {
        const container = document.getElementById('sidebar-playlists');
        if (!container) return;

        container.innerHTML = this.data.playlists.map(playlist => `
            <div class="playlist-item" data-playlist-id="${playlist.id}">
                <img src="${playlist.cover}" alt="${playlist.name}">
                <span class="playlist-name sidebar-text">${playlist.name}</span>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const playlistId = e.currentTarget.dataset.playlistId;
                this.playPlaylist(playlistId);
            });
        });
    }

    loadHomePage() {
        console.log('Loading home page...');
        this.loadRecommendations();
        this.loadRecentlyPlayed();
        this.loadSuggestedPlaylists();
        this.loadGenres();
    }

    loadRecommendations() {
        const container = document.getElementById('recommendations-grid');
        if (!container) return;

        const recommendations = this.data.tracks.slice(0, 4);
        container.innerHTML = recommendations.map(track => `
            <div class="music-card" data-track-id="${track.id}">
                <img src="${track.cover}" alt="${track.title}">
                <div class="music-title">${track.title}</div>
                <div class="music-artist">${track.artist}</div>
            </div>
        `).join('');

        this.addTrackCardListeners(container);
    }

    loadRecentlyPlayed() {
        const container = document.getElementById('recently-played-grid');
        if (!container) return;

        const recentTracks = this.data.recentlyPlayed.map(recent => 
            this.data.tracks.find(track => track.id === recent.trackId)
        ).filter(Boolean);

        container.innerHTML = recentTracks.map(track => `
            <div class="music-card" data-track-id="${track.id}">
                <img src="${track.cover}" alt="${track.title}">
                <div class="music-title">${track.title}</div>
                <div class="music-artist">${track.artist}</div>
            </div>
        `).join('');

        this.addTrackCardListeners(container);
    }

    loadSuggestedPlaylists() {
        const container = document.getElementById('suggested-playlists');
        if (!container) return;

        container.innerHTML = this.data.playlists.map(playlist => `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <img src="${playlist.cover}" alt="${playlist.name}">
                <div class="playlist-title">${playlist.name}</div>
                <div class="playlist-description">${playlist.description}</div>
            </div>
        `).join('');

        this.addPlaylistCardListeners(container);
    }

    loadGenres() {
        const container = document.getElementById('genres-grid');
        if (!container) return;

        container.innerHTML = this.data.genres.map(genre => `
            <div class="genre-card" style="background: linear-gradient(135deg, ${genre.color}, ${genre.color}99)" data-genre="${genre.name}">
                <div class="genre-name">${genre.name}</div>
            </div>
        `).join('');

        container.querySelectorAll('.genre-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const genre = e.currentTarget.dataset.genre;
                this.searchByGenre(genre);
            });
        });
    }

    loadSearchPage() {
        console.log('Loading search page...');
        this.loadSearchSuggestions();
    }

    loadSearchSuggestions() {
        const container = document.getElementById('suggestions-grid');
        if (!container) return;

        container.innerHTML = this.data.searchSuggestions.map(suggestion => `
            <div class="suggestion-item" data-suggestion="${suggestion}">
                <i class="fas fa-search"></i>
                <span>${suggestion}</span>
            </div>
        `).join('');

        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const suggestion = e.currentTarget.dataset.suggestion;
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = suggestion;
                    this.handleSearch(suggestion);
                }
            });
        });
    }

    loadLibraryPage() {
        console.log('Loading library page...');
        this.loadLibraryContent('music');
    }

    loadLibraryContent(tab) {
        console.log('Loading library content for tab:', tab);
        switch (tab) {
            case 'music':
                this.loadLikedTracks();
                break;
            case 'playlists':
                this.loadUserPlaylists();
                break;
            case 'artists':
                this.loadFollowedArtists();
                break;
            case 'history':
                this.loadListeningHistory();
                break;
        }
    }

    loadLikedTracks() {
        const container = document.getElementById('liked-tracks');
        if (!container) return;

        const likedTracks = this.data.tracks.filter(track => track.isLiked);
        container.innerHTML = likedTracks.map((track, index) => `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-number">${index + 1}</div>
                <img src="${track.cover}" alt="${track.title}" class="track-cover">
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${this.formatDuration(track.duration)}</div>
                <div class="track-actions">
                    <button class="track-action" data-action="play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="track-action" data-action="like">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.addTrackListListeners(container);
    }

    loadUserPlaylists() {
        const container = document.getElementById('user-playlists');
        if (!container) return;

        container.innerHTML = this.data.playlists.map(playlist => `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <img src="${playlist.cover}" alt="${playlist.name}">
                <div class="playlist-title">${playlist.name}</div>
                <div class="playlist-description">${playlist.trackCount} titres</div>
            </div>
        `).join('');

        this.addPlaylistCardListeners(container);
    }

    loadFollowedArtists() {
        const container = document.getElementById('followed-artists');
        if (!container) return;

        // Get unique artists from tracks
        const artists = [...new Set(this.data.tracks.map(track => track.artist))].map(artistName => {
            const track = this.data.tracks.find(t => t.artist === artistName);
            return {
                name: artistName,
                genre: track.genre,
                cover: track.cover
            };
        });

        container.innerHTML = artists.map(artist => `
            <div class="artist-card" data-artist="${artist.name}">
                <img src="${artist.cover}" alt="${artist.name}">
                <div class="artist-name">${artist.name}</div>
                <div class="artist-genre">${artist.genre}</div>
            </div>
        `).join('');

        container.querySelectorAll('.artist-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const artist = e.currentTarget.dataset.artist;
                this.searchByArtist(artist);
            });
        });
    }

    loadListeningHistory() {
        const container = document.getElementById('listening-history');
        if (!container) return;

        const historyTracks = this.data.recentlyPlayed.map(recent => 
            this.data.tracks.find(track => track.id === recent.trackId)
        ).filter(Boolean);

        container.innerHTML = historyTracks.map((track, index) => `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-number">${index + 1}</div>
                <img src="${track.cover}" alt="${track.title}" class="track-cover">
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${this.formatDuration(track.duration)}</div>
            </div>
        `).join('');

        this.addTrackListListeners(container);
    }

    loadBlindTestPage() {
        console.log('Loading blind test page...');
        this.showBlindTestMenu();
    }

    loadProfilePage() {
        console.log('Loading profile page...');
        const user = this.currentUser;
        if (!user) return;

        // Update profile info
        const profileAvatar = document.getElementById('profile-avatar');
        const profileName = document.getElementById('profile-name');
        const profileUsername = document.getElementById('profile-username');
        const profileBio = document.getElementById('profile-bio');

        if (profileAvatar) profileAvatar.src = user.avatar;
        if (profileName) profileName.textContent = user.displayName;
        if (profileUsername) profileUsername.textContent = `@${user.username}`;
        if (profileBio) profileBio.textContent = user.bio;

        // Update favorite genres
        const genresContainer = document.getElementById('profile-genres');
        if (genresContainer) {
            genresContainer.innerHTML = user.favoriteGenres.map(genre => `
                <span class="genre-tag">${genre}</span>
            `).join('');
        }
    }

    // Audio player functionality
    playTrack(trackId, playlistTracks = null) {
        const track = this.data.tracks.find(t => t.id === trackId);
        if (!track) return;

        console.log('Playing track:', track.title);
        this.currentTrack = track;
        
        if (playlistTracks) {
            this.queue = playlistTracks;
            this.queueIndex = playlistTracks.findIndex(t => t.id === trackId);
        } else {
            this.queue = [track];
            this.queueIndex = 0;
        }

        this.updatePlayerUI();
        this.loadTrackInPlayer();
        this.showToast(`Lecture en cours: ${track.title} - ${track.artist}`, 'success');
    }

    playPlaylist(playlistId) {
        const playlist = this.data.playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        const playlistTracks = playlist.tracks.map(trackId => 
            this.data.tracks.find(t => t.id === trackId)
        ).filter(Boolean);

        if (playlistTracks.length > 0) {
            this.playTrack(playlistTracks[0].id, playlistTracks);
        }
    }

    loadTrackInPlayer() {
        if (!this.currentTrack) return;

        const audio = document.getElementById('audio-element');
        if (audio) {
            audio.src = this.currentTrack.audioUrl;
            audio.volume = this.volume;
        }
    }

    updatePlayerUI() {
        if (!this.currentTrack) return;

        // Update main player
        const playerCover = document.getElementById('player-cover');
        const playerTitle = document.getElementById('player-title');
        const playerArtist = document.getElementById('player-artist');

        if (playerCover) playerCover.src = this.currentTrack.cover;
        if (playerTitle) playerTitle.textContent = this.currentTrack.title;
        if (playerArtist) playerArtist.textContent = this.currentTrack.artist;

        // Update mobile player
        const mobilePlayerCover = document.getElementById('mobile-player-cover');
        const mobilePlayerTitle = document.getElementById('mobile-player-title');
        const mobilePlayerArtist = document.getElementById('mobile-player-artist');

        if (mobilePlayerCover) mobilePlayerCover.src = this.currentTrack.cover;
        if (mobilePlayerTitle) mobilePlayerTitle.textContent = this.currentTrack.title;
        if (mobilePlayerArtist) mobilePlayerArtist.textContent = this.currentTrack.artist;

        // Update like button
        const likeBtn = document.getElementById('like-btn');
        const isLiked = this.currentTrack.isLiked;
        if (likeBtn) {
            likeBtn.innerHTML = `<i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>`;
            likeBtn.classList.toggle('active', isLiked);
        }
    }

    togglePlayPause() {
        const audio = document.getElementById('audio-element');
        if (!audio || !this.currentTrack) return;

        if (this.isPlaying) {
            audio.pause();
            this.isPlaying = false;
        } else {
            audio.play();
            this.isPlaying = true;
        }

        this.updatePlayButtons();
        this.updateCoverRotation();
    }

    updatePlayButtons() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const playerToggle = document.getElementById('player-toggle');
        const mobilePlayPause = document.getElementById('mobile-play-pause');

        const icon = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';

        [playPauseBtn, playerToggle, mobilePlayPause].forEach(btn => {
            if (btn) {
                btn.innerHTML = `<i class="${icon}"></i>`;
            }
        });
    }

    updateCoverRotation() {
        const trackCover = document.querySelector('.track-cover');
        if (trackCover) {
            trackCover.classList.toggle('playing', this.isPlaying);
        }
    }

    previousTrack() {
        if (this.queue.length === 0) return;
        
        if (this.shuffle) {
            this.queueIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            this.queueIndex = (this.queueIndex - 1 + this.queue.length) % this.queue.length;
        }

        this.playTrack(this.queue[this.queueIndex].id, this.queue);
    }

    nextTrack() {
        if (this.queue.length === 0) return;

        if (this.shuffle) {
            this.queueIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            this.queueIndex = (this.queueIndex + 1) % this.queue.length;
        }

        this.playTrack(this.queue[this.queueIndex].id, this.queue);
    }

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.shuffle);
        }
        this.showToast(`Lecture aléatoire ${this.shuffle ? 'activée' : 'désactivée'}`, 'success');
    }

    toggleRepeat() {
        this.repeat = (this.repeat + 1) % 3;
        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
            repeatBtn.classList.toggle('active', this.repeat > 0);
            const icon = this.repeat === 2 ? 'fas fa-redo' : 'fas fa-redo';
            repeatBtn.innerHTML = `<i class="${icon}"></i>`;
            if (this.repeat === 2) {
                repeatBtn.innerHTML += '<span style="position:absolute;top:2px;right:2px;font-size:8px;">1</span>';
            }
        }

        const modes = ['désactivée', 'activée (tout)', 'activée (un titre)'];
        this.showToast(`Répétition ${modes[this.repeat]}`, 'success');
    }

    toggleLike() {
        if (!this.currentTrack) return;

        this.currentTrack.isLiked = !this.currentTrack.isLiked;
        this.updatePlayerUI();

        const status = this.currentTrack.isLiked ? 'ajouté aux favoris' : 'retiré des favoris';
        this.showToast(`${this.currentTrack.title} ${status}`, 'success');

        // Update the track in data
        const trackIndex = this.data.tracks.findIndex(t => t.id === this.currentTrack.id);
        if (trackIndex !== -1) {
            this.data.tracks[trackIndex].isLiked = this.currentTrack.isLiked;
        }
    }

    toggleMute() {
        const audio = document.getElementById('audio-element');
        const volumeBtn = document.getElementById('volume-btn');
        
        if (audio.volume > 0) {
            this.previousVolume = audio.volume;
            audio.volume = 0;
            this.volume = 0;
            if (volumeBtn) volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            audio.volume = this.previousVolume || 0.8;
            this.volume = this.previousVolume || 0.8;
            if (volumeBtn) volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }

        this.updateVolumeSlider();
    }

    handleVolumeChange(e) {
        const volumeSlider = e.currentTarget;
        const rect = volumeSlider.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        this.volume = Math.max(0, Math.min(1, percentage));

        const audio = document.getElementById('audio-element');
        if (audio) {
            audio.volume = this.volume;
        }

        this.updateVolumeSlider();
    }

    updateVolumeSlider() {
        const volumeProgress = document.getElementById('volume-progress');
        const volumeHandle = document.getElementById('volume-handle');

        if (volumeProgress) {
            volumeProgress.style.width = `${this.volume * 100}%`;
        }

        if (volumeHandle) {
            volumeHandle.style.left = `${this.volume * 100}%`;
        }
    }

    handleProgressChange(e) {
        const progressContainer = e.currentTarget;
        const rect = progressContainer.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        const newTime = percentage * this.duration;

        const audio = document.getElementById('audio-element');
        if (audio) {
            audio.currentTime = newTime;
        }
    }

    updateProgress() {
        const audio = document.getElementById('audio-element');
        if (!audio) return;

        this.currentTime = audio.currentTime;
        this.duration = audio.duration || 0;

        const percentage = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;

        // Update progress bars
        const progress = document.getElementById('progress');
        const progressHandle = document.getElementById('progress-handle');
        const mobileProgress = document.getElementById('mobile-progress');

        [progress, mobileProgress].forEach(bar => {
            if (bar) {
                bar.style.width = `${percentage}%`;
            }
        });

        if (progressHandle) {
            progressHandle.style.left = `${percentage}%`;
        }

        // Update time displays
        const currentTime = document.getElementById('current-time');
        const totalTime = document.getElementById('total-time');
        const mobileCurrentTime = document.getElementById('mobile-current-time');
        const mobileTotalTime = document.getElementById('mobile-total-time');

        if (currentTime) currentTime.textContent = this.formatDuration(this.currentTime);
        if (totalTime) totalTime.textContent = this.formatDuration(this.duration);
        if (mobileCurrentTime) mobileCurrentTime.textContent = this.formatDuration(this.currentTime);
        if (mobileTotalTime) mobileTotalTime.textContent = this.formatDuration(this.duration);
    }

    updateDuration() {
        const audio = document.getElementById('audio-element');
        if (audio) {
            this.duration = audio.duration;
            const totalTime = document.getElementById('total-time');
            const mobileTotalTime = document.getElementById('mobile-total-time');
            if (totalTime) totalTime.textContent = this.formatDuration(this.duration);
            if (mobileTotalTime) mobileTotalTime.textContent = this.formatDuration(this.duration);
        }
    }

    handleTrackEnd() {
        if (this.repeat === 2) {
            // Repeat one
            this.togglePlayPause();
            setTimeout(() => this.togglePlayPause(), 100);
        } else if (this.repeat === 1 || this.queueIndex < this.queue.length - 1) {
            // Repeat all or next track available
            this.nextTrack();
        } else {
            // End of queue
            this.isPlaying = false;
            this.updatePlayButtons();
            this.updateCoverRotation();
        }
    }

    // Mobile player
    openMobilePlayer() {
        if (window.innerWidth <= 768) {
            const mobilePlayer = document.getElementById('mobile-player');
            if (mobilePlayer) mobilePlayer.classList.remove('hidden');
        }
    }

    closeMobilePlayer() {
        const mobilePlayer = document.getElementById('mobile-player');
        if (mobilePlayer) mobilePlayer.classList.add('hidden');
    }

    // Modals
    showLyrics() {
        if (!this.currentTrack) return;

        const modal = document.getElementById('lyrics-modal');
        const content = document.getElementById('lyrics-content');
        
        if (content) content.textContent = this.currentTrack.lyrics || 'Paroles non disponibles';
        if (modal) modal.classList.remove('hidden');
    }

    showQueue() {
        const modal = document.getElementById('queue-modal');
        const content = document.getElementById('queue-content');
        
        if (content) {
            content.innerHTML = this.queue.map((track, index) => `
                <div class="queue-item ${index === this.queueIndex ? 'playing' : ''}" data-track-id="${track.id}" data-queue-index="${index}">
                    <img src="${track.cover}" alt="${track.title}">
                    <div class="track-info">
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                </div>
            `).join('');

            // Add click listeners
            content.querySelectorAll('.queue-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const queueIndex = parseInt(e.currentTarget.dataset.queueIndex);
                    this.queueIndex = queueIndex;
                    this.playTrack(this.queue[queueIndex].id, this.queue);
                    this.closeModal(modal);
                });
            });
        }

        if (modal) modal.classList.remove('hidden');
    }

    closeModal(modal) {
        if (modal) modal.classList.add('hidden');
    }

    // Search functionality
    handleSearch(query) {
        if (!query.trim()) {
            this.showSearchSuggestions();
            return;
        }

        const results = this.searchTracks(query);
        this.displaySearchResults(results);
    }

    searchTracks(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.data.tracks.filter(track => 
            track.title.toLowerCase().includes(lowercaseQuery) ||
            track.artist.toLowerCase().includes(lowercaseQuery) ||
            track.album.toLowerCase().includes(lowercaseQuery) ||
            track.genre.toLowerCase().includes(lowercaseQuery)
        );
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('search-results');
        const searchSuggestions = document.getElementById('search-suggestions');
        const tracksContainer = document.querySelector('#search-tracks .tracks-list');

        if (results.length === 0) {
            if (searchResults) searchResults.innerHTML = '<div class="no-results"><h3>Aucun résultat trouvé</h3><p>Essayez d\'autres mots-clés</p></div>';
        } else {
            if (tracksContainer) {
                tracksContainer.innerHTML = results.map((track, index) => `
                    <div class="track-item" data-track-id="${track.id}">
                        <div class="track-number">${index + 1}</div>
                        <img src="${track.cover}" alt="${track.title}" class="track-cover">
                        <div class="track-info">
                            <div class="track-title">${track.title}</div>
                            <div class="track-artist">${track.artist}</div>
                        </div>
                        <div class="track-duration">${this.formatDuration(track.duration)}</div>
                    </div>
                `).join('');

                this.addTrackListListeners(tracksContainer);
            }
        }

        if (searchResults) searchResults.classList.remove('hidden');
        if (searchSuggestions) searchSuggestions.classList.add('hidden');
    }

    showSearchSuggestions() {
        const searchResults = document.getElementById('search-results');
        const searchSuggestions = document.getElementById('search-suggestions');
        if (searchResults) searchResults.classList.add('hidden');
        if (searchSuggestions) searchSuggestions.classList.remove('hidden');
    }

    searchByGenre(genre) {
        this.navigateToPage('search');
        setTimeout(() => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = genre;
                this.handleSearch(genre);
            }
        }, 100);
    }

    searchByArtist(artist) {
        this.navigateToPage('search');
        setTimeout(() => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = artist;
                this.handleSearch(artist);
            }
        }, 100);
    }

    filterSearchResults(filter) {
        // This method can be extended to implement filtering logic
        console.log('Filtering search results by:', filter);
    }

    startVoiceSearch() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                this.showToast('Parlez maintenant...', 'info');
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = transcript;
                    this.handleSearch(transcript);
                }
            };

            recognition.onerror = () => {
                this.showToast('Erreur de reconnaissance vocale', 'error');
            };

            recognition.start();
        } else {
            this.showToast('Reconnaissance vocale non supportée', 'error');
        }
    }

    // Blind Test functionality
    showBlindTestMenu() {
        const menuElement = document.getElementById('blindtest-menu');
        const setupElement = document.getElementById('game-setup');
        const playElement = document.getElementById('game-play');
        const resultsElement = document.getElementById('game-results');

        if (menuElement) menuElement.classList.remove('hidden');
        if (setupElement) setupElement.classList.add('hidden');
        if (playElement) playElement.classList.add('hidden');
        if (resultsElement) resultsElement.classList.add('hidden');
    }

    startBlindTestSetup(mode) {
        this.gameMode = mode;
        const menuElement = document.getElementById('blindtest-menu');
        const setupElement = document.getElementById('game-setup');

        if (menuElement) menuElement.classList.add('hidden');
        if (setupElement) setupElement.classList.remove('hidden');
    }

    startBlindTestGame() {
        const clipDurationElement = document.getElementById('clip-duration');
        const categoryElement = document.getElementById('game-category');
        const difficultyElement = document.getElementById('game-difficulty');

        const clipDuration = clipDurationElement ? parseInt(clipDurationElement.value) : 10;
        const category = categoryElement ? categoryElement.value : 'all';
        const difficulty = difficultyElement ? difficultyElement.value : 'medium';

        this.prepareGameQuestions(category, difficulty, clipDuration);
        this.gameScore = 0;
        this.gameCurrentQuestion = 0;

        const setupElement = document.getElementById('game-setup');
        const playElement = document.getElementById('game-play');

        if (setupElement) setupElement.classList.add('hidden');
        if (playElement) playElement.classList.remove('hidden');

        this.showNextQuestion();
    }

    prepareGameQuestions(category, difficulty, clipDuration) {
        let availableQuestions = [...this.data.blindTestQuestions];

        if (category !== 'all') {
            availableQuestions = availableQuestions.filter(q => q.category === category);
        }

        if (difficulty !== 'all') {
            availableQuestions = availableQuestions.filter(q => q.difficulty === difficulty);
        }

        // Shuffle and take 5 questions
        this.gameQuestions = availableQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)
            .map(q => ({...q, duration: clipDuration}));
    }

    showNextQuestion() {
        if (this.gameCurrentQuestion >= this.gameQuestions.length) {
            this.showGameResults();
            return;
        }

        const question = this.gameQuestions[this.gameCurrentQuestion];
        this.currentGameQuestion = question;

        // Update UI
        const currentQuestionElement = document.getElementById('current-question');
        const gameScoreElement = document.getElementById('game-score');

        if (currentQuestionElement) currentQuestionElement.textContent = this.gameCurrentQuestion + 1;
        if (gameScoreElement) gameScoreElement.textContent = `Score: ${this.gameScore}`;

        // Reset timer
        this.gameTimer = 30;
        this.updateGameTimer();
        this.gameTimerInterval = setInterval(() => {
            this.gameTimer--;
            this.updateGameTimer();
            
            if (this.gameTimer <= 0) {
                clearInterval(this.gameTimerInterval);
                this.handleTimeOut();
            }
        }, 1000);

        // Reset input
        const answerInput = document.getElementById('answer-input');
        const gameFeedback = document.getElementById('game-feedback');

        if (answerInput) answerInput.value = '';
        if (gameFeedback) gameFeedback.classList.add('hidden');

        // Update hint button
        const hintBtn = document.getElementById('use-hint');
        if (hintBtn) {
            hintBtn.textContent = `Indice (${question.hints.length} disponibles)`;
            hintBtn.disabled = false;
        }
        this.hintsUsed = 0;

        // Generate visualizer bars
        this.createVisualizerBars();
    }

    createVisualizerBars() {
        const container = document.querySelector('.visualizer-bars');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < 20; i++) {
            const bar = document.createElement('div');
            bar.className = 'visualizer-bar';
            bar.style.animationDelay = `${i * 0.1}s`;
            container.appendChild(bar);
        }
    }

    updateGameTimer() {
        const gameTimerElement = document.getElementById('game-timer');
        if (gameTimerElement) {
            gameTimerElement.textContent = this.gameTimer;
            
            if (this.gameTimer <= 5) {
                gameTimerElement.style.color = '#FF6B35';
            }
        }
    }

    playGameClip() {
        const question = this.currentGameQuestion;
        const track = this.data.tracks.find(t => t.id === question.trackId);
        
        if (!track) return;

        const audio = document.getElementById('audio-element');
        if (audio) {
            audio.src = track.audioUrl;
            audio.currentTime = question.audioStart;
            audio.play();

            // Stop after duration
            setTimeout(() => {
                audio.pause();
            }, question.duration * 1000);
        }

        this.showToast(`Extrait de ${question.duration} secondes`, 'info');
    }

    submitAnswer() {
        const answerInput = document.getElementById('answer-input');
        const answer = answerInput ? answerInput.value.trim() : '';
        if (!answer) return;

        clearInterval(this.gameTimerInterval);

        const question = this.currentGameQuestion;
        const track = this.data.tracks.find(t => t.id === question.trackId);
        
        const isCorrect = this.checkAnswer(answer, track);
        this.showAnswerFeedback(isCorrect, track);

        if (isCorrect) {
            const timeBonus = Math.max(0, this.gameTimer - 10) * 2;
            const score = 100 + timeBonus - (this.hintsUsed * 10);
            this.gameScore += Math.max(score, 10);
        }

        setTimeout(() => {
            this.gameCurrentQuestion++;
            this.showNextQuestion();
        }, 3000);
    }

    checkAnswer(answer, track) {
        const normalizeString = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
        
        const normalizedAnswer = normalizeString(answer);
        const normalizedTitle = normalizeString(track.title);
        const normalizedArtist = normalizeString(track.artist);

        return normalizedAnswer.includes(normalizedTitle) || 
               normalizedAnswer.includes(normalizedArtist) ||
               normalizedTitle.includes(normalizedAnswer) ||
               normalizedArtist.includes(normalizedAnswer);
    }

    showAnswerFeedback(isCorrect, track) {
        const feedback = document.getElementById('game-feedback');
        if (!feedback) return;
        
        if (isCorrect) {
            feedback.innerHTML = `
                <div class="feedback-correct">
                    <i class="fas fa-check-circle"></i>
                    <h3>Correct !</h3>
                    <p><strong>${track.title}</strong> par <strong>${track.artist}</strong></p>
                </div>
            `;
            feedback.className = 'game-feedback correct';
        } else {
            feedback.innerHTML = `
                <div class="feedback-incorrect">
                    <i class="fas fa-times-circle"></i>
                    <h3>Incorrect</h3>
                    <p>C'était <strong>${track.title}</strong> par <strong>${track.artist}</strong></p>
                </div>
            `;
            feedback.className = 'game-feedback incorrect';
        }

        feedback.classList.remove('hidden');
    }

    useHint() {
        if (!this.currentGameQuestion || this.hintsUsed >= this.currentGameQuestion.hints.length) return;

        const hint = this.currentGameQuestion.hints[this.hintsUsed];
        this.showToast(`Indice: ${hint}`, 'info');
        
        this.hintsUsed++;
        const hintBtn = document.getElementById('use-hint');
        
        if (hintBtn) {
            if (this.hintsUsed >= this.currentGameQuestion.hints.length) {
                hintBtn.disabled = true;
                hintBtn.textContent = 'Aucun indice restant';
            } else {
                hintBtn.textContent = `Indice (${this.currentGameQuestion.hints.length - this.hintsUsed} disponibles)`;
            }
        }
    }

    handleTimeOut() {
        const track = this.data.tracks.find(t => t.id === this.currentGameQuestion.trackId);
        this.showAnswerFeedback(false, track);
        
        setTimeout(() => {
            this.gameCurrentQuestion++;
            this.showNextQuestion();
        }, 3000);
    }

    showGameResults() {
        const playElement = document.getElementById('game-play');
        const resultsElement = document.getElementById('game-results');

        if (playElement) playElement.classList.add('hidden');
        if (resultsElement) resultsElement.classList.remove('hidden');

        const correctAnswers = Math.floor(this.gameScore / 100);
        const accuracy = Math.round((correctAnswers / this.gameQuestions.length) * 100);

        const finalScoreElement = document.getElementById('final-score');
        const correctAnswersElement = document.getElementById('correct-answers');
        const accuracyElement = document.getElementById('accuracy');
        const avgTimeElement = document.getElementById('avg-time');

        if (finalScoreElement) finalScoreElement.textContent = this.gameScore;
        if (correctAnswersElement) correctAnswersElement.textContent = correctAnswers;
        if (accuracyElement) accuracyElement.textContent = accuracy;
        if (avgTimeElement) avgTimeElement.textContent = '15';
    }

    playAgain() {
        this.startBlindTestSetup(this.gameMode);
    }

    backToBlindTestMenu() {
        this.showBlindTestMenu();
    }

    // Event listeners helpers
    addTrackCardListeners(container) {
        container.querySelectorAll('.music-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const trackId = e.currentTarget.dataset.trackId;
                this.playTrack(trackId);
            });
        });
    }

    addPlaylistCardListeners(container) {
        container.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const playlistId = e.currentTarget.dataset.playlistId;
                this.playPlaylist(playlistId);
            });
        });
    }

    addTrackListListeners(container) {
        container.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const trackId = e.currentTarget.dataset.trackId;
                this.playTrack(trackId);
            });
        });
    }

    // Utility functions
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showToast(message, type = 'info') {
        console.log('Toast:', message, type);
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error('Toast container not found');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    showLoading() {
        // Add loading indicator logic here
        console.log('Loading audio...');
    }

    hideLoading() {
        // Remove loading indicator logic here
        console.log('Audio loaded');
    }

    // Responsive functionality
    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
        }
    }

    handleResize() {
        const isMobile = window.innerWidth <= 768;
        
        // Auto-collapse sidebar on mobile
        if (isMobile && !this.sidebarCollapsed) {
            this.sidebarCollapsed = true;
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('sidebar-collapsed');
            }
        }
    }

    handleSwipe(startX, endX) {
        const diffX = endX - startX;
        const minSwipeDistance = 100;

        if (Math.abs(diffX) > minSwipeDistance) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                if (diffX > 0) {
                    // Swipe right - could open sidebar on mobile
                    if (window.innerWidth <= 768) {
                        sidebar.classList.add('mobile-open');
                    }
                } else {
                    // Swipe left - could close sidebar on mobile
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            }
        }
    }
}

// Initialize the application when DOM is loaded
console.log('Script loaded, waiting for DOM...');

function initApp() {
    console.log('DOM loaded, initializing app...');
    try {
        window.musicStreamApp = new MusicStreamApp();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}