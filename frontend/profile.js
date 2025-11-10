// profile.js - Gestion du profil utilisateur

const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3500/api'
    : `http://${window.location.hostname}:3500/api`;

// Fonction pour faire des appels API avec authentification
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };

    // Ne pas ajouter Content-Type pour FormData
    if (!(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la requête');
    }

    return data;
}

// Variables globales
let currentUsername = '';
let passwordConfirmResolve = null;

// ========== SYSTÈME DE NOTIFICATIONS ==========

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
    notification.innerHTML = `
        <i data-lucide="${icons[type]}" class="notification-icon"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            ${message ? `<div class="notification-message">${message}</div>` : ''}
        </div>
        <button class="notification-close">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
        </button>
    `;

    // Bouton pour fermer
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });

    container.appendChild(notification);
    lucide.createIcons();

    // Auto-fermeture après 5 secondes
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

function removeNotification(notification) {
    if (!notification || !notification.parentElement) return;

    notification.classList.add('hiding');
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 300);
}

// ========== MODALE DE CONFIRMATION DE MOT DE PASSE ==========

function showPasswordConfirmModal() {
    return new Promise((resolve) => {
        passwordConfirmResolve = resolve;

        const modal = document.getElementById('passwordConfirmModal');
        const input = document.getElementById('passwordConfirmInput');
        const toggleBtn = document.getElementById('togglePasswordConfirm');

        // Réinitialiser et afficher
        input.value = '';
        input.type = 'password';
        modal.style.display = 'flex';

        // Réinitialiser l'icône de l'œil
        const eyeIcon = toggleBtn.querySelector('i');
        if (eyeIcon) {
            eyeIcon.setAttribute('data-lucide', 'eye');
            lucide.createIcons();
        }

        // Focus sur l'input
        setTimeout(() => input.focus(), 100);
    });
}

function closePasswordConfirmModal(password = null) {
    const modal = document.getElementById('passwordConfirmModal');
    modal.style.display = 'none';

    if (passwordConfirmResolve) {
        passwordConfirmResolve(password);
        passwordConfirmResolve = null;
    }
}

// ========== GESTION DU PROFIL ==========

// Charger et afficher le profil
async function loadProfile() {
    try {
        const response = await apiCall('/profile');
        const profile = response.data;

        // Sauvegarder et afficher le nom d'utilisateur
        currentUsername = profile.username;
        document.getElementById('profileUsernameDisplay').textContent = profile.username;
        document.getElementById('profileUsernameInput').value = profile.username;

        // Masquer la modification du nom d'utilisateur pour les admins
        if (profile.role === 'admin') {
            const usernameCard = document.querySelector('.card:has(#usernameDisplayMode)');
            if (usernameCard) {
                usernameCard.style.display = 'none';
            }

            // Afficher le lien admin
            const adminAccessCard = document.getElementById('adminAccessCard');
            if (adminAccessCard) {
                adminAccessCard.style.display = 'block';
            }
        }

        // Afficher l'image de profil si elle existe
        const profileImageDisplay = document.getElementById('profileImageDisplay');
        const profileIconDefault = document.getElementById('profileIconDefault');
        const removeButton = document.getElementById('removeProfileImage');

        if (profile.profileImage) {
            profileImageDisplay.src = profile.profileImage;
            profileImageDisplay.style.display = 'block';
            profileIconDefault.style.display = 'none';
            removeButton.style.display = 'inline-flex';
        } else {
            profileImageDisplay.src = '';
            profileImageDisplay.style.display = 'none';
            profileIconDefault.style.display = 'block';
            removeButton.style.display = 'none';
        }

        lucide.createIcons();
    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showNotification('Erreur', 'Impossible de charger le profil: ' + error.message, 'error');
    }
}

// Basculer en mode édition du nom d'utilisateur
function enableUsernameEdit() {
    document.getElementById('usernameDisplayMode').style.display = 'none';
    document.getElementById('usernameEditMode').style.display = 'flex';
    document.getElementById('profileUsernameInput').focus();
    lucide.createIcons();
}

// Annuler l'édition du nom d'utilisateur
function cancelUsernameEdit() {
    document.getElementById('usernameEditMode').style.display = 'none';
    document.getElementById('usernameDisplayMode').style.display = 'flex';
    document.getElementById('profileUsernameInput').value = currentUsername;
    lucide.createIcons();
}

// Reconnexion automatique avec nouvelles credentials
async function autoRelogin(username, password) {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.token) {
            // Mettre à jour le localStorage avec le nouveau token
            localStorage.setItem('token', data.token);
            if (data.userId) localStorage.setItem('userId', data.userId);
            if (data.username) localStorage.setItem('username', data.username);
            if (data.role) localStorage.setItem('role', data.role);

            // Mettre à jour l'affichage du nom d'utilisateur dans l'application
            const userElements = document.querySelectorAll('#user-accueil, #user-blind');
            userElements.forEach(el => {
                el.textContent = data.username;
            });

            return true;
        } else {
            throw new Error(data.error || 'Échec de la reconnexion');
        }
    } catch (error) {
        console.error('Erreur lors de la reconnexion:', error);
        throw error;
    }
}

// Uploader une nouvelle image de profil
async function uploadProfileImage(file) {
    try {
        // Vérifier la taille du fichier (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Erreur', 'L\'image ne doit pas dépasser 5MB', 'error');
            return;
        }

        // Vérifier le type de fichier
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showNotification('Erreur', 'Format non supporté. Utilisez JPG, PNG ou WebP', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        const response = await apiCall('/profile/image', {
            method: 'POST',
            body: formData
        });

        // Afficher la nouvelle image
        const profileImageDisplay = document.getElementById('profileImageDisplay');
        const profileIconDefault = document.getElementById('profileIconDefault');
        const removeButton = document.getElementById('removeProfileImage');

        profileImageDisplay.src = response.data.profileImage;
        profileImageDisplay.style.display = 'block';
        profileIconDefault.style.display = 'none';
        removeButton.style.display = 'inline-flex';

        showNotification('Succès', 'Image de profil mise à jour avec succès!', 'success');
        lucide.createIcons();
    } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image:', error);
        showNotification('Erreur', 'Impossible d\'uploader l\'image: ' + error.message, 'error');
    }
}

// Supprimer l'image de profil
async function deleteProfileImage() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
        return;
    }

    try {
        await apiCall('/profile/image', {
            method: 'DELETE'
        });

        // Réinitialiser l'affichage
        const profileImageDisplay = document.getElementById('profileImageDisplay');
        const profileIconDefault = document.getElementById('profileIconDefault');
        const removeButton = document.getElementById('removeProfileImage');

        profileImageDisplay.src = '';
        profileImageDisplay.style.display = 'none';
        profileIconDefault.style.display = 'block';
        removeButton.style.display = 'none';

        showNotification('Succès', 'Photo de profil supprimée avec succès!', 'success');
        lucide.createIcons();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image:', error);
        showNotification('Erreur', 'Impossible de supprimer l\'image: ' + error.message, 'error');
    }
}

// Mettre à jour le nom d'utilisateur
async function updateUsername() {
    const newUsername = document.getElementById('profileUsernameInput').value.trim();

    if (!newUsername) {
        showNotification('Erreur', 'Le nom d\'utilisateur ne peut pas être vide', 'error');
        return;
    }

    if (newUsername.length < 3) {
        showNotification('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères', 'error');
        return;
    }

    if (newUsername === currentUsername) {
        cancelUsernameEdit();
        return;
    }

    try {
        // Demander le mot de passe pour la reconnexion automatique
        const password = await showPasswordConfirmModal();
        if (!password) {
            return;
        }

        await apiCall('/profile', {
            method: 'PUT',
            body: JSON.stringify({ username: newUsername })
        });

        // Reconnexion automatique avec le nouveau nom d'utilisateur
        await autoRelogin(newUsername, password);

        // Mettre à jour l'affichage
        currentUsername = newUsername;
        document.getElementById('profileUsernameDisplay').textContent = newUsername;
        cancelUsernameEdit();

        showNotification('Succès', 'Nom d\'utilisateur mis à jour avec succès!', 'success');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du nom d\'utilisateur:', error);
        showNotification('Erreur', 'Impossible de modifier le nom d\'utilisateur: ' + error.message, 'error');
    }
}

// Mettre à jour le mot de passe
async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Validations
    if (!currentPassword) {
        showNotification('Erreur', 'Veuillez entrer votre mot de passe actuel', 'error');
        return;
    }

    if (!newPassword) {
        showNotification('Erreur', 'Veuillez entrer un nouveau mot de passe', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showNotification('Erreur', 'Les mots de passe ne correspondent pas', 'error');
        return;
    }

    try {
        await apiCall('/profile', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        // Reconnexion automatique avec le nouveau mot de passe
        await autoRelogin(currentUsername, newPassword);

        // Réinitialiser les champs
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';

        showNotification('Succès', 'Mot de passe mis à jour avec succès! Reconnexion automatique effectuée.', 'success');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe:', error);
        showNotification('Erreur', 'Impossible de modifier le mot de passe: ' + error.message, 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Charger le profil au chargement de la page
    const profilSection = document.getElementById('profil');
    if (profilSection) {
        // Observer pour charger le profil quand la section devient visible
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active') &&
                    mutation.target.id === 'profil') {
                    loadProfile();
                }
            });
        });

        observer.observe(profilSection, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Charger aussi si la section est déjà active
        if (profilSection.classList.contains('active')) {
            loadProfile();
        }
    }

    // Bouton éditer le nom d'utilisateur
    const editUsernameBtn = document.getElementById('editUsernameBtn');
    if (editUsernameBtn) {
        editUsernameBtn.addEventListener('click', enableUsernameEdit);
    }

    // Bouton annuler l'édition
    const cancelUsernameBtn = document.getElementById('cancelUsernameEdit');
    if (cancelUsernameBtn) {
        cancelUsernameBtn.addEventListener('click', cancelUsernameEdit);
    }

    // Bouton sauvegarder le nom d'utilisateur
    const saveUsernameBtn = document.getElementById('saveUsername');
    if (saveUsernameBtn) {
        saveUsernameBtn.addEventListener('click', updateUsername);
    }

    // Upload d'image
    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadProfileImage(file);
            }
        });
    }

    // Supprimer l'image
    const removeImageBtn = document.getElementById('removeProfileImage');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', deleteProfileImage);
    }

    // Modifier le mot de passe
    const updatePasswordBtn = document.getElementById('updatePassword');
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', updatePassword);
    }

    // ========== MODALE DE CONFIRMATION DE MOT DE PASSE ==========

    // Bouton toggle pour afficher/masquer le mot de passe
    const togglePasswordBtn = document.getElementById('togglePasswordConfirm');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const input = document.getElementById('passwordConfirmInput');
            const icon = togglePasswordBtn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye');
            }

            lucide.createIcons();
        });
    }

    // Bouton fermer la modale
    const closePasswordConfirmBtn = document.getElementById('closePasswordConfirm');
    if (closePasswordConfirmBtn) {
        closePasswordConfirmBtn.addEventListener('click', () => {
            closePasswordConfirmModal(null);
        });
    }

    // Bouton annuler
    const cancelPasswordConfirmBtn = document.getElementById('cancelPasswordConfirm');
    if (cancelPasswordConfirmBtn) {
        cancelPasswordConfirmBtn.addEventListener('click', () => {
            closePasswordConfirmModal(null);
        });
    }

    // Bouton confirmer
    const confirmPasswordConfirmBtn = document.getElementById('confirmPasswordConfirm');
    if (confirmPasswordConfirmBtn) {
        confirmPasswordConfirmBtn.addEventListener('click', () => {
            const password = document.getElementById('passwordConfirmInput').value;
            if (!password) {
                showNotification('Erreur', 'Veuillez entrer votre mot de passe', 'error');
                return;
            }
            closePasswordConfirmModal(password);
        });
    }

    // Valider avec Enter
    const passwordConfirmInput = document.getElementById('passwordConfirmInput');
    if (passwordConfirmInput) {
        passwordConfirmInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const password = e.target.value;
                if (!password) {
                    showNotification('Erreur', 'Veuillez entrer votre mot de passe', 'error');
                    return;
                }
                closePasswordConfirmModal(password);
            }
        });
    }

    // Fermer la modale en cliquant à l'extérieur
    const passwordConfirmModal = document.getElementById('passwordConfirmModal');
    if (passwordConfirmModal) {
        passwordConfirmModal.addEventListener('click', (e) => {
            if (e.target === passwordConfirmModal) {
                closePasswordConfirmModal(null);
            }
        });
    }
});
