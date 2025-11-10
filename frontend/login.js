const API = '/api/auth';

function showMessage(message, type) {
  const msgEl = document.getElementById('authMsg');
  msgEl.textContent = message;
  msgEl.className = type; // 'success' ou 'error'
}

document.getElementById('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      // Stocker les informations de session
      localStorage.setItem('token', data.token);
      if (data.userId) localStorage.setItem('userId', data.userId);
      if (data.username) localStorage.setItem('username', data.username);
      if (data.role) localStorage.setItem('role', data.role);

      // Rediriger vers la page admin si l'utilisateur est admin
      const isAdmin = data.role === 'admin';
      const redirectPage = isAdmin ? 'admin.html' : 'index.html';

      showMessage(`✓ Connexion réussie ! Redirection vers ${isAdmin ? 'le panneau admin' : 'l\'application'}...`, 'success');
      setTimeout(() => {
        window.location.href = redirectPage;
      }, 1000);
    } else {
      showMessage(data.error || 'Erreur de connexion', 'error');
    }
  } catch (err) {
    showMessage(err.message || 'Erreur réseau', 'error');
  }
};

document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      showMessage('✓ Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
      // Basculer vers l'onglet connexion après 2 secondes
      setTimeout(() => {
        document.querySelector('.tab-btn[data-tab="login"]').click();
      }, 2000);
    } else {
      showMessage(data.error || 'Erreur d\'inscription', 'error');
    }
  } catch (err) {
    showMessage(err.message || 'Erreur réseau', 'error');
  }
};

