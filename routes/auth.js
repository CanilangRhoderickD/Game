
const express = require('express');
const router = express.Router();
const path = require('path');

// Middleware to check if user is signed in
const isSignedIn = (req, res, next) => {
  if (req.session?.signedInUser) {
    return next();
  }
  return res.redirect('/signin.html');
};

// Redirect to games if already signed in
router.get('/signin.html', (req, res, next) => {
  if (req.session?.signedInUser) {
    return res.redirect('/games.html');
  }
  next();
});

router.get('/register.html', (req, res, next) => {
  if (req.session?.signedInUser) {
    return res.redirect('/games.html');
  }
  next();
});

// Add debugging route to check session status
router.get('/api/session-check', (req, res) => {
  if (req.session?.signedInUser) {
    return res.json({ 
      authenticated: true, 
      user: req.session.signedInUser 
    });
  }
  return res.json({ authenticated: false });
});

// Define public paths that don't require authentication
const publicPaths = [
  '/landing.html',
  '/',
  '/signin.html',
  '/register.html',
  '/favicon.ico',
  '/css/',
  '/js/',
  '/images/'
];

// Handle routes with authentication check
router.get('*', (req, res, next) => {
  // Check if the path is public
  const isPublicPath = publicPaths.some(publicPath => 
    req.path === publicPath || req.path.startsWith(publicPath)
  );
  
  if (isPublicPath) {
    // For public paths, continue to the next middleware
    return next();
  }
  
  // Protected resources require authentication
  if (!req.session?.signedInUser) {
    console.log(`User not signed in, redirecting to signin page from: ${req.path}`);
    return res.redirect('/signin.html');
  }
  
  // Attempt to send requested file if it exists, otherwise fallback to games page
  const requestedFile = path.join(__dirname, '../public', req.path);
  res.sendFile(requestedFile, (err) => {
    if (err) {
      console.log(`File not found: ${requestedFile}, redirecting to games page`);
      return res.redirect('/games.html');
    }
  });
});

// Add a debug endpoint to check authentication status
router.get('/api/auth/status', (req, res) => {
  res.json({
    authenticated: !!req.session?.signedInUser,
    user: req.session?.signedInUser || null,
    sessionExists: !!req.session,
    sessionId: req.session?.id || null
  });
});

module.exports = router;
// Add authentication status endpoint
router.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.signedInUser) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Add current user endpoint
router.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.signedInUser) {
    res.json({
      id: req.session.signedInUser.id,
      username: req.session.signedInUser.username,
      isAdmin: req.session.signedInUser.isAdmin
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});
