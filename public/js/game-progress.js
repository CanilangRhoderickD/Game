
/**
 * Game Progress Tracking System
 * Tracks user progress across all games
 */

class GameProgressTracker {
  constructor() {
    this.progressKey = 'apula_game_progress';
    this.progress = this.loadProgress();
  }
  
  loadProgress() {
    const saved = localStorage.getItem(this.progressKey);
    return saved ? JSON.parse(saved) : {
      totalScore: 0,
      gamesPlayed: 0,
      gamesCompleted: 0,
      lastPlayed: null,
      games: {}
    };
  }
  
  saveProgress() {
    localStorage.setItem(this.progressKey, JSON.stringify(this.progress));
    this.updateUI();
  }
  
  startGame(gameId, gameType) {
    if (!this.progress.games[gameId]) {
      this.progress.games[gameId] = {
        type: gameType,
        highScore: 0,
        timesPlayed: 0,
        completed: false,
        lastPlayed: new Date().toISOString()
      };
    }
    
    this.progress.games[gameId].timesPlayed++;
    this.progress.gamesPlayed++;
    this.progress.lastPlayed = new Date().toISOString();
    this.saveProgress();
    
    return this.progress.games[gameId];
  }
  
  updateScore(gameId, score, maxScore) {
    if (!this.progress.games[gameId]) {
      return false;
    }
    
    const gameData = this.progress.games[gameId];
    
    // Update high score if current score is higher
    if (score > gameData.highScore) {
      gameData.highScore = score;
    }
    
    // Check if game is completed (80% score threshold)
    const completionThreshold = maxScore * 0.8;
    if (score >= completionThreshold && !gameData.completed) {
      gameData.completed = true;
      this.progress.gamesCompleted++;
    }
    
    // Update total score
    this.progress.totalScore += score;
    
    this.saveProgress();
    return gameData;
  }
  
  getGameProgress(gameId) {
    return this.progress.games[gameId] || null;
  }
  
  getAllProgress() {
    return this.progress;
  }
  
  updateUI() {
    // Update progress display if element exists
    const progressElement = document.getElementById('game-progress-display');
    if (progressElement) {
      progressElement.innerHTML = `
        <div class="progress-stats">
          <div>Total Score: ${this.progress.totalScore}</div>
          <div>Games Completed: ${this.progress.gamesCompleted}</div>
          <div>Games Played: ${this.progress.gamesPlayed}</div>
        </div>
      `;
    }
    
    // Update badges if they exist
    this.updateBadges();
  }
  
  updateBadges() {
    const badgesContainer = document.getElementById('achievement-badges');
    if (!badgesContainer) return;
    
    // Clear existing badges
    badgesContainer.innerHTML = '';
    
    // Define achievements
    const achievements = [
      { id: 'first_game', title: 'First Steps', description: 'Play your first game', condition: () => this.progress.gamesPlayed >= 1 },
      { id: 'first_completion', title: 'Quick Learner', description: 'Complete your first game', condition: () => this.progress.gamesCompleted >= 1 },
      { id: 'five_games', title: 'Getting Started', description: 'Play 5 different games', condition: () => Object.keys(this.progress.games).length >= 5 },
      { id: 'master', title: 'Safety Expert', description: 'Complete all games', condition: () => this.progress.gamesCompleted >= 6 },
      { id: 'high_scorer', title: 'High Scorer', description: 'Earn 1000+ total points', condition: () => this.progress.totalScore >= 1000 }
    ];
    
    // Add badges for earned achievements
    achievements.forEach(achievement => {
      if (achievement.condition()) {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge';
        badge.innerHTML = `
          <div class="badge-icon" title="${achievement.description}">🏆</div>
          <span class="badge-title">${achievement.title}</span>
        `;
        badgesContainer.appendChild(badge);
      }
    });
  }
  
  resetProgress() {
    if (confirm('Are you sure you want to reset all game progress? This cannot be undone.')) {
      localStorage.removeItem(this.progressKey);
      this.progress = {
        totalScore: 0,
        gamesPlayed: 0,
        gamesCompleted: 0,
        lastPlayed: null,
        games: {}
      };
      this.updateUI();
    }
  }
}

// Initialize the tracker
const gameTracker = new GameProgressTracker();

// Make it globally available
window.gameTracker = gameTracker;
