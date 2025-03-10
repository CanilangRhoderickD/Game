
const express = require('express');
const router = express.Router();
const database = require('../database');
const missingLetterModel = require('../models/missingLetter');
// Import other game models as needed

// Initialize database on server start
database.initDatabase();

// Middleware to check if user is authenticated as admin
function isAdmin(req, res, next) {
  const adminUser = req.session?.adminUser;
  if (!adminUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all game types
router.get('/game-types', isAdmin, (req, res) => {
  database.getGameTypes((err, types) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(types);
  });
});

// Get all games
router.get('/games', isAdmin, (req, res) => {
  database.getAllGames((err, games) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(games);
  });
});

// Get games by type
router.get('/games/type/:typeId', isAdmin, (req, res) => {
  const typeId = req.params.typeId;
  database.getGamesByType(typeId, (err, games) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(games);
  });
});

// Add a new game
router.post('/games', isAdmin, (req, res) => {
  const game = req.body;
  database.addGame(game, (err, gameId) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: gameId });
  });
});

// Missing Letter Game Routes
router.get('/missing-letter/games', isAdmin, (req, res) => {
  missingLetterModel.getAllMissingLetterGames((err, games) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(games);
  });
});

router.get('/missing-letter/game/:gameId', isAdmin, (req, res) => {
  const gameId = req.params.gameId;
  missingLetterModel.getMissingLetterGame(gameId, (err, words) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(words);
  });
});

router.post('/missing-letter/game', isAdmin, (req, res) => {
  const gameData = req.body;
  missingLetterModel.addMissingLetterGame(gameData, (err, success) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ success });
  });
});

router.put('/missing-letter/word/:wordId', isAdmin, (req, res) => {
  const wordId = req.params.wordId;
  const wordData = req.body;
  missingLetterModel.updateMissingLetterGame(wordId, wordData, (err, success) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!success) {
      return res.status(404).json({ error: 'Word not found' });
    }
    res.json({ success });
  });
});

router.delete('/missing-letter/word/:wordId', isAdmin, (req, res) => {
  const wordId = req.params.wordId;
  missingLetterModel.deleteMissingLetterWord(wordId, (err, success) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!success) {
      return res.status(404).json({ error: 'Word not found' });
    }
    res.json({ success });
  });
});

// Add similar routes for other game types

module.exports = router;
