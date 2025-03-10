
const { db } = require('../database');

// Get all missing letter games
function getAllMissingLetterGames(callback) {
  db.all(`
    SELECT mlg.*, g.title, g.description, g.difficulty 
    FROM missing_letter_games mlg
    JOIN games g ON mlg.game_id = g.id
    WHERE g.type_id = (SELECT id FROM game_types WHERE name = 'Missing Letter')
    ORDER BY g.updated_at DESC
  `, callback);
}

// Get missing letter game by id
function getMissingLetterGame(gameId, callback) {
  db.all(`
    SELECT mlg.* 
    FROM missing_letter_games mlg
    WHERE mlg.game_id = ?
  `, [gameId], callback);
}

// Add new missing letter game words
function addMissingLetterGame(gameData, callback) {
  const { game_id, words } = gameData;
  
  if (!Array.isArray(words) || words.length === 0) {
    return callback(new Error('Words array is required'));
  }

  let completed = 0;
  let errors = [];

  words.forEach(word => {
    db.run(
      'INSERT INTO missing_letter_games (game_id, word, incomplete_word, hint) VALUES (?, ?, ?, ?)',
      [game_id, word.word, word.incomplete_word, word.hint],
      function(err) {
        completed++;
        if (err) {
          errors.push(err);
        }
        
        if (completed === words.length) {
          if (errors.length > 0) {
            callback(errors[0]);
          } else {
            callback(null, true);
          }
        }
      }
    );
  });
}

// Update missing letter game
function updateMissingLetterGame(wordId, wordData, callback) {
  const { word, incomplete_word, hint } = wordData;
  
  db.run(
    'UPDATE missing_letter_games SET word = ?, incomplete_word = ?, hint = ? WHERE id = ?',
    [word, incomplete_word, hint, wordId],
    function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, this.changes > 0);
    }
  );
}

// Delete missing letter game word
function deleteMissingLetterWord(wordId, callback) {
  db.run('DELETE FROM missing_letter_games WHERE id = ?', [wordId], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, this.changes > 0);
  });
}

module.exports = {
  getAllMissingLetterGames,
  getMissingLetterGame,
  addMissingLetterGame,
  updateMissingLetterGame,
  deleteMissingLetterWord
};
