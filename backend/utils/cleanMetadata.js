/**
 * Nettoie les métadonnées de titre et artiste
 * Supprime les patterns comme "(Official Video)", "[HQ]", "- Topic", etc.
 */

const PATTERNS_TO_REMOVE = [
  // Vidéo et qualité
  /\(official\s*video\)/gi,
  /\[official\s*video\]/gi,
  /\(official\s*music\s*video\)/gi,
  /\[official\s*music\s*video\]/gi,
  /\(official\s*audio\)/gi,
  /\[official\s*audio\]/gi,
  /\(lyric\s*video\)/gi,
  /\[lyric\s*video\]/gi,
  /\(lyrics\)/gi,
  /\[lyrics\]/gi,
  /\(audio\)/gi,
  /\[audio\]/gi,
  /\(visualizer\)/gi,
  /\[visualizer\]/gi,

  // Qualité
  /\[HQ\]/gi,
  /\(HQ\)/gi,
  /\[HD\]/gi,
  /\(HD\)/gi,
  /\[4K\]/gi,
  /\(4K\)/gi,
  /\[1080p\]/gi,
  /\(1080p\)/gi,
  /\[720p\]/gi,
  /\(720p\)/gi,

  // YouTube spécifiques
  /\s*-\s*topic$/gi,
  /\s*-\s*vevo$/gi,
  /\(vevo\)/gi,
  /\[vevo\]/gi,

  // Divers
  /\(explicit\)/gi,
  /\[explicit\]/gi,
  /\(clean\)/gi,
  /\[clean\]/gi,
  /\(remaster(ed)?\)/gi,
  /\[remaster(ed)?\]/gi,
];

/**
 * Nettoie une chaîne de caractères (titre ou artiste)
 * @param {string} text - Texte à nettoyer
 * @returns {string} - Texte nettoyé
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let cleaned = text;

  // Appliquer tous les patterns de suppression
  PATTERNS_TO_REMOVE.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Nettoyer les espaces multiples
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Nettoyer les tirets/virgules en trop
  cleaned = cleaned.replace(/\s*[-,]\s*$/g, '');
  cleaned = cleaned.replace(/^\s*[-,]\s*/g, '');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Nettoie le titre et l'artiste
 * @param {Object} metadata - { title, artist }
 * @returns {Object} - { title, artist } nettoyés
 */
function cleanMetadata({ title, artist }) {
  return {
    title: cleanText(title),
    artist: cleanText(artist)
  };
}

module.exports = {
  cleanText,
  cleanMetadata
};
