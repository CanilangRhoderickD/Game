require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const { initDatabase } = require('./database');
const app = express();
const port = process.env.PORT || 3000;

// Initialize database (SQLite fallback)
initDatabase();

// Middleware
app.use(express.static('public', {
  // Set max-age for caching
  maxAge: '1d'
}));
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/images', express.static('public/images'));
app.use('/games', express.static('public/games'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle favicon.ico specifically to prevent auth issues
app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname + '/public/favicon.ico');
});

// Session middleware (placed before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Routes
const adminRoutes = require('./routes/admin');
const gameRoutes = require('./routes/games');
const authRoutes = require('./routes/auth');

app.use('/api/admin', adminRoutes);
app.use('/api/games', gameRoutes);

// Apply auth routes last as catch-all
app.use(authRoutes);
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/images', express.static('public/images'));
app.use('/games', express.static('public/games'));
app.use(express.json());

// Public routes (no authentication required)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/landing.html');
});

app.get('/landing.html', (req, res) => {
  res.sendFile(__dirname + '/public/landing.html');
});

// Handle static assets without authentication
app.get('/css/*', (req, res, next) => {
  next();
});

app.get('/js/*', (req, res, next) => {
  next();
});

app.get('/images/*', (req, res, next) => {
  next();
});

// Import auth middleware
const { requireAuth } = require('./middleware/auth');

app.get('/signin.html', (req, res) => {
  res.sendFile(__dirname + '/public/signin.html');
});

app.get('/register.html', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

// Redirect from index.html to landing page
app.get('/index.html', (req, res) => {
  res.redirect('/landing.html');
});

// Protect game routes with authentication
app.use('/games', requireAuth);
app.use('/games.html', requireAuth, (req, res) => {
  res.sendFile(__dirname + '/public/games.html');
});

// Protect individual game pages
const protectedGamePages = [
  '/4pics-game.html',
  '/crossword.html',
  '/guessthemissingletter.html',
  '/ppe-game.html',
  '/quiz-game.html',
  '/word-scramble.html'
];

protectedGamePages.forEach(page => {
  app.get(page, requireAuth, (req, res) => {
    res.sendFile(__dirname + '/public' + page);
  });
});

// Protect all game API endpoints
app.use('/api/games', requireAuth);
app.use('/api/progress', requireAuth);


// MongoDB Connection with promise handling and fallback (Made optional)
let dbConnected = false;
let Game, FourPics, Crossword, MissingLetter, PPEGame, QuizGame, WordScrambler, User, UserProgress;

const connectToMongoDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://0.0.0.0:27017/gameAdmin';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Reduce timeout to 5 seconds
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    console.log('MongoDB Connected Successfully');
    dbConnected = true;

    // Define Mongoose models only if connected to MongoDB
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
    const FourPicsSchema = new mongoose.Schema({
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
      images: [{ type: String, required: true }], // URLs to images
      answer: { type: String, required: true },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
    });
    const CrosswordSchema = new mongoose.Schema({
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
      grid: [[String]], // 2D array for the crossword grid
      clues: {
        across: [{ number: Number, clue: String, answer: String }],
        down: [{ number: Number, clue: String, answer: String }]
      },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
    });
    const MissingLetterSchema = new mongoose.Schema({
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
      word: { type: String, required: true }, // Word with underscores for missing letters
      answer: { type: String, required: true }, // Complete word
      hint: { type: String, required: true },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
    });
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
    const QuizGameSchema = new mongoose.Schema({
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
      question: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctAnswer: { type: Number, required: true }, // Index of correct option
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
    });
    const WordScramblerSchema = new mongoose.Schema({
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
      scrambledWord: { type: String, required: true },
      correctWord: { type: String, required: true },
      hint: { type: String },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
    });
    const UserSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      isAdmin: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });
    const UserProgressSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
      score: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      lastPlayed: { type: Date, default: Date.now }
    });

    Game = mongoose.model('Game', GameSchema);
    FourPics = mongoose.model('FourPics', FourPicsSchema);
    Crossword = mongoose.model('Crossword', CrosswordSchema);
    MissingLetter = mongoose.model('MissingLetter', MissingLetterSchema);
    PPEGame = mongoose.model('PPEGame', PPEGameSchema);
    QuizGame = mongoose.model('QuizGame', QuizGameSchema);
    WordScrambler = mongoose.model('WordScrambler', WordScramblerSchema);
    User = mongoose.model('User', UserSchema);
    UserProgress = mongoose.model('UserProgress', UserProgressSchema);

    return true;
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    console.log('Using local SQLite data storage as fallback');
    return false;
  }
};

// Try to connect to MongoDB but continue without it if it fails
(async () => {
  try {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('App running without MongoDB - using SQLite fallback');
    }
  } catch (error) {
    console.error('Error initializing database connections:', error);
  }
})();


// API Routes for Games (Made conditional on MongoDB connection)
app.get('/api/games', async (req, res) => {
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/games', async (req, res) => {
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
  const game = new Game(req.body);
  try {
    const newGame = await game.save();
    res.status(201).json(newGame);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/games/:id', async (req, res) => {
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    // Get game-specific content based on type
    let gameContent;
    switch (game.type) {
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
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
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
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    // Delete game-specific content
    switch (game.type) {
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

    await Game.deleteOne({ _id: game._id });
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User routes
app.post('/api/users/register', async (req, res) => {
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
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
    console.log('Login attempt with:', req.body);
    const { username, password } = req.body;

    // Fallback Authentication if MongoDB is not connected
    if (!dbConnected) {
      console.log('Using fallback authentication since MongoDB is not connected');
      
      // Check credentials against SQLite database
      const db = require('./database').db;
      
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
          if (err) {
            console.error('SQLite query error:', err);
            res.status(500).json({ message: 'Authentication error', details: 'Database query failed' });
            reject(err);
            return;
          }
          
          if (user && user.password === password) {
            // Successfully authenticated with SQLite
            req.session.signedInUser = { 
              id: user.id, 
              username: user.username, 
              isAdmin: Boolean(user.isAdmin) 
            };
            
            res.json({ 
              id: user.id, 
              username: user.username, 
              isAdmin: Boolean(user.isAdmin), 
              message: 'Logged in successfully using SQLite' 
            });
            resolve();
          } else {
            // Default admin fallback as last resort
            if (username === 'admin' && password === 'password') {
              req.session.signedInUser = { id: 'default-admin-id', username: 'admin', isAdmin: true };
              res.json({ 
                id: 'default-admin-id', 
                username: 'admin', 
                isAdmin: true, 
                message: 'Logged in with default admin account' 
              });
              resolve();
            } else {
              res.status(401).json({ message: 'Invalid credentials' });
              resolve();
            }
          }
        });
      });
    }

    // MongoDB Authentication path
    try {
      const user = await User.findOne({ username }).maxTimeMS(3000); // Add timeout to query
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.signedInUser = { id: user._id, username: user.username, isAdmin: user.isAdmin };
      return res.json({ 
        id: user._id, 
        username: user.username, 
        isAdmin: user.isAdmin, 
        message: 'Logged in successfully using MongoDB' 
      });
    } catch (mongoErr) {
      console.error('MongoDB query error:', mongoErr);
      // Fall back to SQLite if MongoDB query fails
      console.log('Falling back to SQLite after MongoDB query failure');
      
      const db = require('./database').db;
      
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
          if (err) {
            console.error('SQLite query error:', err);
            res.status(500).json({ message: 'Authentication error', details: 'All database queries failed' });
            reject(err);
            return;
          }
          
          if (user && user.password === password) {
            req.session.signedInUser = { 
              id: user.id, 
              username: user.username, 
              isAdmin: Boolean(user.isAdmin) 
            };
            
            res.json({ 
              id: user.id, 
              username: user.username, 
              isAdmin: Boolean(user.isAdmin), 
              message: 'Logged in successfully using SQLite (MongoDB query failed)' 
            });
            resolve();
          } else {
            res.status(401).json({ message: 'Invalid credentials' });
            resolve();
          }
        });
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Authentication service unavailable', details: err.message });
  }
});

// Add logout endpoint
app.get('/api/users/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/signin.html');
});

// User progress routes (made conditional)
app.get('/api/progress/:userId', async (req, res) => {
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
  try {
    const progress = await UserProgress.find({ userId: req.params.userId })
      .populate('gameId');
    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/progress', async (req, res) => {
  if (!dbConnected) return res.status(500).json({ message: 'Database unavailable' });
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

// Start server with fallback to multiple ports
function startServer(portToUse) {
  app.listen(portToUse, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${portToUse}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Try another port if current one is busy
      const newPort = parseInt(portToUse) + 1;
      console.log(`Port ${portToUse} is busy, trying port ${newPort}...`);
      startServer(newPort); // Recursively try next port
    } else {
      console.error('Server error:', err);
    }
  });
}

// Initial port attempt
startServer(port);