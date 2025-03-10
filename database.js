
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Create a database connection
const db = new sqlite3.Database(path.join(dbDir, 'games.db'));

// Initialize the database tables
function initDatabase() {
  db.serialize(() => {
    // Game Types table
    db.run(`CREATE TABLE IF NOT EXISTS game_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    )`);

    // Games table
    db.run(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      difficulty TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (type_id) REFERENCES game_types(id)
    )`);

    // Missing Letter Games
    db.run(`CREATE TABLE IF NOT EXISTS missing_letter_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      incomplete_word TEXT NOT NULL,
      hint TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);

    // Word Scramble Games
    db.run(`CREATE TABLE IF NOT EXISTS word_scramble_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      original_word TEXT NOT NULL,
      scrambled_word TEXT NOT NULL,
      hint TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);

    // Quiz Games
    db.run(`CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS quiz_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
    )`);

    // Crossword Games
    db.run(`CREATE TABLE IF NOT EXISTS crossword_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      grid_size INTEGER NOT NULL,
      grid_data TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS crossword_clues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crossword_id INTEGER NOT NULL,
      clue_text TEXT NOT NULL,
      answer TEXT NOT NULL,
      direction TEXT NOT NULL, /* 'across' or 'down' */
      position_x INTEGER NOT NULL,
      position_y INTEGER NOT NULL,
      FOREIGN KEY (crossword_id) REFERENCES crossword_games(id) ON DELETE CASCADE
    )`);

    // 4 Pics 1 Word Games
    db.run(`CREATE TABLE IF NOT EXISTS four_pics_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS four_pics_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      four_pics_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (four_pics_id) REFERENCES four_pics_games(id) ON DELETE CASCADE
    )`);

    // PPE Games
    db.run(`CREATE TABLE IF NOT EXISTS ppe_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      level_data TEXT NOT NULL, /* JSON format for game level configuration */
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);

    // Admins table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT DEFAULT 'editor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default game types if they don't exist
    const gameTypes = [
      { name: 'Missing Letter', description: 'Fill in the missing letters to complete words' },
      { name: 'Word Scramble', description: 'Unscramble words related to fire safety' },
      { name: 'Quiz', description: 'Answer multiple-choice questions about fire safety' },
      { name: 'Crossword', description: 'Complete a crossword puzzle with fire safety terms' },
      { name: '4 Pics 1 Word', description: 'Guess the common word from four images' },
      { name: 'PPE Game', description: 'Catch and equip personal protective equipment' }
    ];

    const checkTypeStmt = db.prepare('SELECT id FROM game_types WHERE name = ?');
    const insertTypeStmt = db.prepare('INSERT INTO game_types (name, description) VALUES (?, ?)');
    
    gameTypes.forEach(type => {
      checkTypeStmt.get(type.name, (err, row) => {
        if (!row) {
          insertTypeStmt.run(type.name, type.description);
        }
      });
    });

    checkTypeStmt.finalize();
    insertTypeStmt.finalize();

    // Insert default admin if it doesn't exist
    db.get('SELECT id FROM admins WHERE username = ?', ['admin'], (err, row) => {
      if (!row) {
        // In a real application, you would hash the password
        db.run('INSERT INTO admins (username, password, role) VALUES (?, ?, ?)', 
          ['admin', 'password', 'administrator']);
      }
    });
  });
}

// Helper function to get all game types
function getGameTypes(callback) {
  db.all('SELECT * FROM game_types', callback);
}

// Helper function to get all games
function getAllGames(callback) {
  db.all(`
    SELECT games.*, game_types.name as type_name 
    FROM games 
    JOIN game_types ON games.type_id = game_types.id
    ORDER BY games.updated_at DESC
  `, callback);
}

// Helper function to get games by type
function getGamesByType(typeId, callback) {
  db.all('SELECT * FROM games WHERE type_id = ? ORDER BY updated_at DESC', [typeId], callback);
}

// Helper function to add a new game
function addGame(game, callback) {
  const { type_id, title, description, difficulty } = game;
  db.run(
    'INSERT INTO games (type_id, title, description, difficulty) VALUES (?, ?, ?, ?)',
    [type_id, title, description, difficulty],
    function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, this.lastID);
    }
  );
}

// Export the database and functions
module.exports = {
  db,
  initDatabase,
  getGameTypes,
  getAllGames,
  getGamesByType,
  addGame
};
