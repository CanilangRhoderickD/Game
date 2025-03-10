
/**
 * Authentication utility functions
 */

const Auth = {
  // Check if user is authenticated
  isAuthenticated: async function() {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      return data.authenticated;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },
  
  // Redirect to sign in if not authenticated
  requireAuth: async function() {
    const authenticated = await this.isAuthenticated();
    if (!authenticated) {
      window.location.href = '/signin.html';
      return false;
    }
    return true;
  },
  
  // Get current user info
  getCurrentUser: async function() {
    try {
      const response = await fetch('/api/auth/me');
      return await response.json();
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }
};
