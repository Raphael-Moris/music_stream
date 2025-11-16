/**
 * Script de gestion de l'authentification (connexion et inscription)
 *
 * Ce script gère les formulaires de login et d'inscription,
 * communique avec l'API d'authentification et redirige l'utilisateur
 * vers la page appropriée selon son rôle (admin ou utilisateur normal).
 */

// URL de l'API d'authentification
const API = '/api/auth';

/**
 * Affiche un message de feedback utilisateur
 *
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de message ('success' ou 'error')
 */
function showMessage(message, type) {
  const msgEl = document.getElementById('authMsg');
  msgEl.textContent = message;
  msgEl.className = type; // Applique le style CSS correspondant
}

/**
 * Gestion de la soumission du formulaire de connexion
 *
 * Envoie les identifiants au serveur, stocke le token JWT en cas de succès,
 * et redirige vers la page appropriée selon le rôle de l'utilisateur.
 */
document.getElementById('loginForm').onsubmit = async (e) => {
  e.preventDefault();

  // Récupération des données du formulaire
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    // Envoi de la requête de connexion
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      // Stocker les informations de session dans le localStorage
      // Ces informations seront utilisées pour les requêtes authentifiées
      localStorage.setItem('token', data.token);
      if (data.userId) localStorage.setItem('userId', data.userId);
      if (data.username) localStorage.setItem('username', data.username);
      if (data.role) localStorage.setItem('role', data.role);

      // Déterminer la page de redirection selon le rôle
      const isAdmin = data.role === 'admin';
      const redirectPage = isAdmin ? 'admin.html' : 'index.html';

      // Afficher un message de succès avant redirection
      showMessage(`✓ Connexion réussie ! Redirection vers ${isAdmin ? 'le panneau admin' : 'l\'application'}...`, 'success');

      // Redirection après 1 seconde pour laisser le temps de lire le message
      setTimeout(() => {
        window.location.href = redirectPage;
      }, 1000);
    } else {
      // Afficher l'erreur retournée par le serveur
      showMessage(data.error || 'Erreur de connexion', 'error');
    }
  } catch (err) {
    // Gestion des erreurs réseau ou de parsing JSON
    showMessage(err.message || 'Erreur réseau', 'error');
  }
};

/**
 * Gestion de la soumission du formulaire d'inscription
 *
 * Crée un nouveau compte utilisateur et bascule automatiquement
 * vers l'onglet de connexion en cas de succès.
 */
document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();

  // Récupération des données du formulaire
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  try {
    // Envoi de la requête d'inscription
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      // Afficher le message de succès
      showMessage('✓ Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');

      // Basculer automatiquement vers l'onglet connexion après 2 secondes
      setTimeout(() => {
        document.querySelector('.tab-btn[data-tab="login"]').click();
      }, 2000);
    } else {
      // Afficher l'erreur retournée par le serveur
      showMessage(data.error || 'Erreur d\'inscription', 'error');
    }
  } catch (err) {
    // Gestion des erreurs réseau ou de parsing JSON
    showMessage(err.message || 'Erreur réseau', 'error');
  }
};

