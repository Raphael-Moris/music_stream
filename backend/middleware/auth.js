/**
 * Middleware d'authentification JWT
 *
 * Vérifie la présence et la validité d'un token JWT dans le header Authorization.
 * Si le token est valide, le payload est attaché à req.user.
 * Si le token est absent ou invalide, req.user est défini à null.
 *
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction middleware suivante
 */
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Récupération du header Authorization (format: "Bearer <token>")
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // Si pas de header ou format invalide, continuer sans utilisateur authentifié
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  // Extraction du token JWT
  const token = authHeader.split(' ')[1];

  try {
    // Vérification et décodage du token
    // Le payload contient typiquement: { id: userId, username: userName, role: userRole }
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    return next();
  } catch (err) {
    // Token invalide ou expiré - continuer sans authentification
    req.user = null;
    return next();
  }
};