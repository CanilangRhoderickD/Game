
const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Get all games
router.get('/', (req, res) => {
  db.all(`SELECT * FROM games WHERE is_active = 1`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a specific game by ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM games WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(row);
  });
});

module.exports = router;
