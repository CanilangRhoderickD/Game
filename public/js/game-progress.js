
/**
 * Game Progress Tracking System
 * Tracks user progress across all games
 */
class GameProgressTracker {
  constructor() {
    this.progressKey = 'apula_game_progress';
    this.progress = this.loadProgress();
    
    // Initialize listener for game events
    window.addEventListener('game-completed', this.handleGameCompleted.bind(this));
    window.addEventListener('game-started', this.handleGameStarted.bind(this));
    window.addEventListener('score-updated', this.handleScoreUpdated.bind(this));
  }
  
  loadProgress() {
    const savedProgress = localStorage.getItem(this.progressKey);
    return savedProgress ? JSON.parse(savedProgress) : {
      totalScore: 0,
      gamesPlayed: 0,
      gamesCompleted: 0,
      lastPlayed: null,
      games: {}
    };
  }
  
  saveProgress() {
    localStorage.setItem(this.progressKey, JSON.stringify(this.progress));
    
    // If user is authenticated, send to server
    if (this.progress.userId) {
      this.syncWithServer();
    }
  }
  
  async syncWithServer() {
    try {
      await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.progress),
      });
    } catch (error) {
      console.error('Error syncing progress with server:', error);
    }
  }
  
  startGame(gameId, gameType) {
    // Initialize game entry if it doesn't exist
    if (!this.progress.games[gameId]) {
      this.progress.games[gameId] = {
        type: gameType,
        timesPlayed: 0,
        highScore: 0,
        completed: false,
        lastPlayed: null
      };
    }
    
    // Update game stats
    this.progress.games[gameId].timesPlayed++;
    this.progress.games[gameId].lastPlayed = new Date().toISOString();
    this.progress.gamesPlayed++;
    this.progress.lastPlayed = new Date().toISOString();
    
    this.saveProgress();
    
    // Dispatch event for other components
    const event = new CustomEvent('game-started', { 
      detail: { gameId, gameType } 
    });
    window.dispatchEvent(event);
  }
  
  updateScore(gameId, score, maxPossibleScore) {
    if (!this.progress.games[gameId]) return;
    
    const game = this.progress.games[gameId];
    
    // Update high score if current score is higher
    if (score > game.highScore) {
      game.highScore = score;
    }
    
    // Check if game is completed (80% or more of max score)
    const completionThreshold = maxPossibleScore * 0.8;
    if (score >= completionThreshold && !game.completed) {
      game.completed = true;
      this.progress.gamesCompleted++;
      
      // Dispatch completion event
      const event = new CustomEvent('game-completed', { 
        detail: { gameId, score, maxPossibleScore } 
      });
      window.dispatchEvent(event);
    }
    
    // Update total score
    this.progress.totalScore += score;
    
    this.saveProgress();
  }
  
  handleGameCompleted(event) {
    const { gameId } = event.detail;
    console.log(`Game completed: ${gameId}`);
    this.checkForAchievements();
  }
  
  handleGameStarted(event) {
    const { gameId, gameType } = event.detail;
    console.log(`Game started: ${gameId} (${gameType})`);
  }
  
  handleScoreUpdated(event) {
    const { gameId, score, maxPossibleScore } = event.detail;
    this.updateScore(gameId, score, maxPossibleScore);
  }
  
  checkForAchievements() {
    // Check for various achievements
    const achievements = [
      { id: 'first_game', title: 'First Steps', description: 'Complete your first game', condition: () => this.progress.gamesCompleted >= 1 },
      { id: 'half_way', title: 'Half Way There', description: 'Complete 3 different games', condition: () => this.progress.gamesCompleted >= 3 },
      { id: 'master', title: 'Safety Expert', description: 'Complete all games', condition: () => this.progress.gamesCompleted >= 6 },
      { id: 'high_scorer', title: 'High Scorer', description: 'Earn 1000+ total points', condition: () => this.progress.totalScore >= 1000 }
    ];
    
    // Process achievements
    achievements.forEach(achievement => {
      if (achievement.condition()) {
        this.unlockAchievement(achievement);
      }
    });
  }
  
  unlockAchievement(achievement) {
    // Initialize achievements array if it doesn't exist
    if (!this.progress.achievements) {
      this.progress.achievements = [];
    }
    
    // Check if achievement is already unlocked
    if (!this.progress.achievements.includes(achievement.id)) {
      // Add achievement
      this.progress.achievements.push(achievement.id);
      this.saveProgress();
      
      // Show achievement notification
      this.displayAchievementNotification(achievement);
    }
  }
  
  displayAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-details">
        <h3>${achievement.title}</h3>
        <p>${achievement.description}</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('visible');
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000);
  }
  
  updateUI() {
    const progressContainer = document.getElementById('game-progress-container');
    if (!progressContainer) return;
    
    // Clear container
    progressContainer.innerHTML = '';
    
    // Add overall stats
    const statsSection = document.createElement('div');
    statsSection.className = 'progress-stats';
    statsSection.innerHTML = `
      <h3>Your Progress</h3>
      <div class="stat-row">
        <div class="stat-label">Total Score:</div>
        <div class="stat-value">${this.progress.totalScore}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Games Completed:</div>
        <div class="stat-value">${this.progress.gamesCompleted}/6</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Last Played:</div>
        <div class="stat-value">${this.progress.lastPlayed ? new Date(this.progress.lastPlayed).toLocaleDateString() : 'Never'}</div>
      </div>
    `;
    progressContainer.appendChild(statsSection);
    
    // Add game-specific progress
    const gamesSection = document.createElement('div');
    gamesSection.className = 'games-progress';
    gamesSection.innerHTML = '<h3>Game Progress</h3>';
    
    Object.entries(this.progress.games).forEach(([gameId, game]) => {
      const gameItem = document.createElement('div');
      gameItem.className = `game-progress-item ${game.completed ? 'completed' : ''}`;
      gameItem.innerHTML = `
        <div class="game-title">${this.getGameName(game.type)}</div>
        <div class="game-score">High Score: ${game.highScore}</div>
        <div class="game-completion">${game.completed ? '✓ Completed' : '◯ In Progress'}</div>
      `;
      gamesSection.appendChild(gameItem);
    });
    
    progressContainer.appendChild(gamesSection);
    
    // Add achievements section
    const achievementsSection = document.createElement('div');
    achievementsSection.className = 'achievements-section';
    achievementsSection.innerHTML = '<h3>Achievements</h3>';
    
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'badges-container';
    achievementsSection.appendChild(badgesContainer);
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-danger mt-3';
    resetButton.textContent = 'Reset Progress';
    resetButton.addEventListener('click', () => this.resetProgress());
    
    progressContainer.appendChild(achievementsSection);
    progressContainer.appendChild(resetButton);
    
    // Add badges for earned achievements
    this.displayAchievementBadges(badgesContainer);
  }
  
  displayAchievementBadges(badgesContainer) {
    const achievements = [
      { id: 'first_game', title: 'First Steps', description: 'Complete your first game', condition: () => this.progress.gamesCompleted >= 1 },
      { id: 'half_way', title: 'Half Way There', description: 'Complete 3 different games', condition: () => this.progress.gamesCompleted >= 3 },
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
  
  getGameName(gameType) {
    const gameNames = {
      '4PicsOneWord': '4 Pics 1 Word',
      'Crossword': 'Crossword',
      'MissingLetter': 'Guess the Missing Letter',
      'PPEGame': 'PPE Game',
      'QuizGame': 'Quiz Game',
      'WordScrambler': 'Word Scramble'
    };
    
    return gameNames[gameType] || gameType;
  }
}

// Initialize the game progress tracker
window.gameTracker = new GameProgressTracker();

// Add styles for achievement notifications
const styleElement = document.createElement('style');
styleElement.textContent = `
  .achievement-notification {
    position: fixed;
    top: 20px;
    right: -300px;
    width: 280px;
    background-color: #343a40;
    color: white;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: right 0.5s ease;
    z-index: 9999;
  }
  
  .achievement-notification.visible {
    right: 20px;
  }
  
  .achievement-icon {
    font-size: 2rem;
    margin-right: 15px;
  }
  
  .achievement-details h3 {
    margin: 0 0 5px 0;
    font-size: 1.1rem;
  }
  
  .achievement-details p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .game-progress-item {
    background-color: #f8f9fa;
    padding: 10px 15px;
    border-radius: 5px;
    margin-bottom: 10px;
    border-left: 3px solid #dee2e6;
  }
  
  .game-progress-item.completed {
    border-left-color: #28a745;
  }
  
  .badges-container {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 10px;
  }
  
  .achievement-badge {
    text-align: center;
    width: 120px;
  }
  
  .badge-icon {
    font-size: 2rem;
    background-color: #f8f9fa;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 5px;
    border: 2px solid #ff4500;
  }
  
  .badge-title {
    font-size: 0.8rem;
    font-weight: 600;
  }
`;
document.head.appendChild(styleElement);
