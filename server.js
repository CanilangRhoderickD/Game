const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const { initDatabase } = require('./config/db');
const app = express();
const port = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Middleware
app.use(express.static('public'));
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/images', express.static('public/images'));
app.use('/games', express.static('public/games'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const adminRoutes = require('./routes/admin');
const gameRoutes = require('./routes/games');

app.use('/api/admin', adminRoutes);
app.use('/api/games', gameRoutes);
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/images', express.static('public/images'));
app.use('/games', express.static('public/games'));
app.use(express.json());

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using https
}));

// Set landing page as default route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/landing.html');
});

// MongoDB Connection - Using try/catch for better error handling
try {
  mongoose.connect('mongodb://0.0.0.0:27017/gameAdmin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('MongoDB Connected');
} catch (err) {
  console.error('MongoDB Connection Error:', err);
  // Fall back to using local data if MongoDB connection fails
  console.log('Using local data storage');
}

// Game Schema
const GameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['4PicsOneWord', 'Crossword', 'MissingLetter', 'PPEGame', 'QuizGame', 'WordScrambler']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 4 Pics 1 Word Schema
const FourPicsSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  images: [{ type: String, required: true }], // URLs to images
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

// Crossword Schema
const CrosswordSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  grid: [[String]], // 2D array for the crossword grid
  clues: {
    across: [{ number: Number, clue: String, answer: String }],
    down: [{ number: Number, clue: String, answer: String }]
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

// Missing Letter Schema
const MissingLetterSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  word: { type: String, required: true }, // Word with underscores for missing letters
  answer: { type: String, required: true }, // Complete word
  hint: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

// PPE Game Schema
const PPEGameSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  items: [{ 
    name: String, 
    image: String, 
    points: Number 
  }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, default: 60 } // Time limit in seconds
});

// Quiz Game Schema
const QuizGameSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index of correct option
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

// Word Scrambler Schema
const WordScramblerSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  scrambledWord: { type: String, required: true },
  correctWord: { type: String, required: true },
  hint: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// User Progress Schema
const UserProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  score: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  lastPlayed: { type: Date, default: Date.now }
});

// Create models
const Game = mongoose.model('Game', GameSchema);
const FourPics = mongoose.model('FourPics', FourPicsSchema);
const Crossword = mongoose.model('Crossword', CrosswordSchema);
const MissingLetter = mongoose.model('MissingLetter', MissingLetterSchema);
const PPEGame = mongoose.model('PPEGame', PPEGameSchema);
const QuizGame = mongoose.model('QuizGame', QuizGameSchema);
const WordScrambler = mongoose.model('WordScrambler', WordScramblerSchema);
const User = mongoose.model('User', UserSchema);
const UserProgress = mongoose.model('UserProgress', UserProgressSchema);

// API Routes for Games
app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/games', async (req, res) => {
  const game = new Game(req.body);
  try {
    const newGame = await game.save();
    res.status(201).json(newGame);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    // Get game-specific content based on type
    let gameContent;
    switch(game.type) {
      case '4PicsOneWord':
        gameContent = await FourPics.find({ gameId: game._id });
        break;
      case 'Crossword':
        gameContent = await Crossword.find({ gameId: game._id });
        break;
      case 'MissingLetter':
        gameContent = await MissingLetter.find({ gameId: game._id });
        break;
      case 'PPEGame':
        gameContent = await PPEGame.find({ gameId: game._id });
        break;
      case 'QuizGame':
        gameContent = await QuizGame.find({ gameId: game._id });
        break;
      case 'WordScrambler':
        gameContent = await WordScrambler.find({ gameId: game._id });
        break;
    }

    res.json({ game, content: gameContent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    Object.assign(game, req.body);
    game.updatedAt = Date.now();

    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    // Delete game-specific content
    switch(game.type) {
      case '4PicsOneWord':
        await FourPics.deleteMany({ gameId: game._id });
        break;
      case 'Crossword':
        await Crossword.deleteMany({ gameId: game._id });
        break;
      case 'MissingLetter':
        await MissingLetter.deleteMany({ gameId: game._id });
        break;
      case 'PPEGame':
        await PPEGame.deleteMany({ gameId: game._id });
        break;
      case 'QuizGame':
        await QuizGame.deleteMany({ gameId: game._id });
        break;
      case 'WordScrambler':
        await WordScrambler.deleteMany({ gameId: game._id });
        break;
    }

    await game.remove();
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User routes
app.post('/api/users/register', async (req, res) => {
  const user = new User(req.body);
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ 
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User progress routes
app.get('/api/progress/:userId', async (req, res) => {
  try {
    const progress = await UserProgress.find({ userId: req.params.userId })
      .populate('gameId');
    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/progress', async (req, res) => {
  const progress = new UserProgress(req.body);
  try {
    const newProgress = await progress.save();
    res.status(201).json(newProgress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Google Sheets Integration for Game Data
const { GoogleSpreadsheet } = require('google-spreadsheet');

async function loadGameDataFromGoogleSheets(sheetId, credentialsPath) {
  try {
    // Initialize the sheet
    const doc = new GoogleSpreadsheet(sheetId);
    
    // Try to authenticate - first with service account if available
    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT));
    } else if (credentialsPath) {
      const creds = require(credentialsPath);
      await doc.useServiceAccountAuth(creds);
    } else {
      console.log('No Google Sheets credentials found. Using public access only.');
    }
    
    await doc.loadInfo(); // Load document properties
    console.log(`Loaded Google Sheet: ${doc.title}`);
    
    // Load game data from different sheets
    const quizSheet = doc.sheetsByTitle['QuizQuestions'];
    const wordSheet = doc.sheetsByTitle['WordScramble'];
    const crosswordSheet = doc.sheetsByTitle['Crossword'];
    
    if (quizSheet) {
      const quizRows = await quizSheet.getRows();
      console.log(`Loaded ${quizRows.length} quiz questions from Google Sheets`);
      // Process and store quiz data
    }
    
    if (wordSheet) {
      const wordRows = await wordSheet.getRows();
      console.log(`Loaded ${wordRows.length} word scramble items from Google Sheets`);
      // Process and store word scramble data
    }
    
    return true;
  } catch (error) {
    console.error('Error loading data from Google Sheets:', error);
    return false;
  }
}

// Optional: Load game data from Google Sheets on startup
// Uncomment and configure with your sheet ID to enable
/*
const SHEET_ID = 'your-google-sheet-id-here';
loadGameDataFromGoogleSheets(SHEET_ID).then(success => {
  if (success) {
    console.log('Successfully loaded game data from Google Sheets');
  } else {
    console.log('Using local game data');
  }
});
*/

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});