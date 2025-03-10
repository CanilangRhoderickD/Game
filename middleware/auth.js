
// Authentication middleware
function requireAuth(req, res, next) {
  // Check if user is authenticated
  const signedInUser = req.session?.signedInUser;
  
  // Handle favicon.ico requests differently
  if (req.path === '/favicon.ico') {
    // For favicon requests, just continue without authentication check
    return next();
  }
  
  if (!signedInUser) {
    console.log(`User not signed in, redirecting to signin page from: ${req.path}`);
    // Redirect to sign in page if not authenticated
    return res.redirect('/signin.html');
  }
  
  // User is authenticated, proceed to next middleware
  next();
}

module.exports = { requireAuth };
