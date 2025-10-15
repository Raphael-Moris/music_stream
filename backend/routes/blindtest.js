const express = require('express');
const router = express.Router();
const Song = require('../models/song');

router.get('/solo', async (req, res) => {
  const { genre } = req.query;
  try {
    // Récupère 10 chansons aléatoires du genre demandé
    const songs = await Song.aggregate([
      { $match: { genre } },
      { $sample: { size: 10 } }
    ]);
    // Pour chaque chanson, génère 3 mauvaises options
    const allTitles = await Song.find({ genre }).select('title -_id');
    const questions = songs.map(song => {
      // Exclure la bonne réponse
      const wrongOptions = allTitles
        .filter(s => s.title !== song.title)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(s => s.title);
      // Mélanger les options
      const options = [song.title, ...wrongOptions].sort(() => 0.5 - Math.random());
      return {
        song,
        options
      };
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;