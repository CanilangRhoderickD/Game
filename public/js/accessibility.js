
/**
 * Accessibility Features for APULA Games
 * Includes support for Lynx text-based browser and screen readers
 */

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', function() {
  initAccessibilityFeatures();
});

function initAccessibilityFeatures() {
  addSkipToContentLink();
  enhanceKeyboardNavigation();
  addScreenReaderAnnouncements();
  detectLynxBrowser();
  addHighContrastToggle();
}

// Add a skip to content link for keyboard users
function addSkipToContentLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  skipLink.style.cssText = 'position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 100; transition: top 0.3s;';
  
  skipLink.addEventListener('focus', function() {
    this.style.top = '0';
  });
  
  skipLink.addEventListener('blur', function() {
    this.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Add id to main content area if it doesn't exist
  const mainContent = document.querySelector('main') || document.querySelector('.container');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content';
  }
}

// Enhance keyboard navigation for interactive elements
function enhanceKeyboardNavigation() {
  const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
  
  interactiveElements.forEach(element => {
    // Ensure all interactive elements are keyboard accessible
    if (!element.getAttribute('tabindex') && element.disabled !== true) {
      element.setAttribute('tabindex', '0');
    }
    
    // Add visual focus indicator
    element.addEventListener('focus', function() {
      this.style.outline = '3px solid #0066cc';
    });
    
    element.addEventListener('blur', function() {
      this.style.outline = '';
    });
  });
}

// Add screen reader announcements for dynamic content
function addScreenReaderAnnouncements() {
  // Create an aria-live region for announcements
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.className = 'sr-only';
  announcer.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;';
  document.body.appendChild(announcer);
  
  // Expose the announcer globally so it can be used from game logic
  window.screenReaderAnnounce = function(message) {
    announcer.textContent = message;
  };
}

// Detect Lynx text-browser and optimize display
function detectLynxBrowser() {
  const isLynx = navigator.userAgent.toLowerCase().indexOf('lynx') !== -1;
  
  if (isLynx) {
    applyLynxOptimizations();
  }
}

// Apply optimizations for Lynx text-based browser
function applyLynxOptimizations() {
  // Create text-only alternatives for visual content
  document.querySelectorAll('img').forEach(img => {
    const altText = img.alt || 'Image';
    const textEquivalent = document.createElement('span');
    textEquivalent.textContent = `[Image: ${altText}]`;
    textEquivalent.className = 'lynx-alt-text';
    img.parentNode.insertBefore(textEquivalent, img.nextSibling);
  });
  
  // Simplify layout for text-browser
  document.body.classList.add('lynx-mode');
  
  // Add a style element with Lynx-specific CSS
  const lynxStyles = document.createElement('style');
  lynxStyles.textContent = `
    .lynx-mode {
      font-family: monospace;
      line-height: 1.5;
      max-width: 80ch;
    }
    .lynx-mode div, .lynx-mode p {
      display: block;
      margin: 1em 0;
    }
    .lynx-mode .d-none, .lynx-mode .visually-hidden {
      display: block !important;
      visibility: visible !important;
    }
    .lynx-mode .card {
      border: 1px solid #ccc;
      padding: 1em;
      margin: 1em 0;
    }
    .lynx-mode .btn::before {
      content: "[";
    }
    .lynx-mode .btn::after {
      content: "]";
    }
  `;
  document.head.appendChild(lynxStyles);
}

// Add high contrast mode toggle
function addHighContrastToggle() {
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle High Contrast';
  toggleButton.className = 'btn btn-sm btn-outline-secondary high-contrast-toggle';
  toggleButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 100;';
  toggleButton.setAttribute('aria-pressed', 'false');
  
  toggleButton.addEventListener('click', function() {
    document.body.classList.toggle('high-contrast');
    const isHighContrast = document.body.classList.contains('high-contrast');
    this.setAttribute('aria-pressed', isHighContrast);
    localStorage.setItem('highContrast', isHighContrast);
    
    // Announce to screen readers
    window.screenReaderAnnounce(`High contrast mode ${isHighContrast ? 'enabled' : 'disabled'}`);
  });
  
  // Add high contrast styles
  const contrastStyles = document.createElement('style');
  contrastStyles.textContent = `
    .high-contrast {
      background-color: black !important;
      color: white !important;
    }
    .high-contrast a, .high-contrast button {
      color: yellow !important;
      background-color: black !important;
      border: 2px solid yellow !important;
    }
    .high-contrast img {
      filter: grayscale(100%) contrast(150%);
    }
    .high-contrast .card, .high-contrast .container {
      background-color: black !important;
      border: 2px solid white !important;
    }
    .high-contrast input, .high-contrast select, .high-contrast textarea {
      background-color: black !important;
      color: white !important;
      border: 2px solid white !important;
    }
  `;
  document.head.appendChild(contrastStyles);
  
  // Check for saved preference
  if (localStorage.getItem('highContrast') === 'true') {
    document.body.classList.add('high-contrast');
    toggleButton.setAttribute('aria-pressed', 'true');
  }
  
  document.body.appendChild(toggleButton);
}
/**
 * Accessibility improvements for fire safety games
 */

class AccessibilityHelper {
  constructor() {
    this.screenReaderActive = false;
    this.highContrastMode = false;
    this.largeTextMode = false;
    this.animationReduced = false;
    
    // Load user preferences
    this.loadPreferences();
    
    // Initialize accessibility toolbar
    this.initAccessibilityToolbar();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Screen reader announcer
    this.setupScreenReaderAnnouncer();
  }
  
  loadPreferences() {
    const preferences = localStorage.getItem('apula_accessibility');
    if (preferences) {
      const { highContrastMode, largeTextMode, animationReduced } = JSON.parse(preferences);
      this.highContrastMode = highContrastMode || false;
      this.largeTextMode = largeTextMode || false;
      this.animationReduced = animationReduced || false;
      
      // Apply saved preferences
      this.applyPreferences();
    }
  }
  
  savePreferences() {
    const preferences = {
      highContrastMode: this.highContrastMode,
      largeTextMode: this.largeTextMode,
      animationReduced: this.animationReduced
    };
    
    localStorage.setItem('apula_accessibility', JSON.stringify(preferences));
  }
  
  applyPreferences() {
    // Apply high contrast if enabled
    if (this.highContrastMode) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Apply large text if enabled
    if (this.largeTextMode) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }
    
    // Apply reduced animations if enabled
    if (this.animationReduced) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }
  
  initAccessibilityToolbar() {
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'accessibility-toolbar';
    toolbar.setAttribute('aria-label', 'Accessibility Options');
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'accessibility-toggle';
    toggleButton.innerHTML = '<i class="fas fa-universal-access"></i>';
    toggleButton.setAttribute('aria-label', 'Toggle Accessibility Menu');
    toggleButton.addEventListener('click', () => {
      toolbar.classList.toggle('expanded');
    });
    
    // Add options
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'accessibility-options';
    
    // High Contrast Mode
    const contrastOption = this.createOptionButton(
      'High Contrast', 
      'fas fa-adjust',
      this.highContrastMode,
      () => {
        this.highContrastMode = !this.highContrastMode;
        contrastOption.classList.toggle('active', this.highContrastMode);
        this.applyPreferences();
        this.savePreferences();
      }
    );
    
    // Large Text Mode
    const textOption = this.createOptionButton(
      'Large Text', 
      'fas fa-text-height',
      this.largeTextMode,
      () => {
        this.largeTextMode = !this.largeTextMode;
        textOption.classList.toggle('active', this.largeTextMode);
        this.applyPreferences();
        this.savePreferences();
      }
    );
    
    // Reduce Animations
    const animationOption = this.createOptionButton(
      'Reduce Motion', 
      'fas fa-running',
      this.animationReduced,
      () => {
        this.animationReduced = !this.animationReduced;
        animationOption.classList.toggle('active', this.animationReduced);
        this.applyPreferences();
        this.savePreferences();
      }
    );
    
    // Add options to container
    optionsContainer.appendChild(contrastOption);
    optionsContainer.appendChild(textOption);
    optionsContainer.appendChild(animationOption);
    
    // Add keyboard help button
    const keyboardHelpButton = this.createOptionButton(
      'Keyboard Shortcuts', 
      'fas fa-keyboard',
      false,
      () => {
        this.showKeyboardShortcutsHelp();
      }
    );
    optionsContainer.appendChild(keyboardHelpButton);
    
    // Add all to toolbar
    toolbar.appendChild(toggleButton);
    toolbar.appendChild(optionsContainer);
    
    // Add to document
    document.body.appendChild(toolbar);
    
    // Add styles
    this.addAccessibilityStyles();
  }
  
  createOptionButton(label, iconClass, isActive, clickHandler) {
    const button = document.createElement('button');
    button.className = `accessibility-option ${isActive ? 'active' : ''}`;
    button.innerHTML = `<i class="${iconClass}"></i> ${label}`;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', clickHandler);
    return button;
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + A - Toggle accessibility toolbar
      if (e.altKey && e.key === 'a') {
        const toolbar = document.querySelector('.accessibility-toolbar');
        if (toolbar) {
          toolbar.classList.toggle('expanded');
        }
      }
      
      // Alt + C - Toggle high contrast
      if (e.altKey && e.key === 'c') {
        this.highContrastMode = !this.highContrastMode;
        this.applyPreferences();
        this.savePreferences();
        this.screenReaderAnnounce(`High contrast mode ${this.highContrastMode ? 'enabled' : 'disabled'}`);
      }
      
      // Alt + T - Toggle large text
      if (e.altKey && e.key === 't') {
        this.largeTextMode = !this.largeTextMode;
        this.applyPreferences();
        this.savePreferences();
        this.screenReaderAnnounce(`Large text mode ${this.largeTextMode ? 'enabled' : 'disabled'}`);
      }
      
      // Alt + M - Toggle reduced motion
      if (e.altKey && e.key === 'm') {
        this.animationReduced = !this.animationReduced;
        this.applyPreferences();
        this.savePreferences();
        this.screenReaderAnnounce(`Reduced motion ${this.animationReduced ? 'enabled' : 'disabled'}`);
      }
      
      // Alt + H - Show keyboard shortcuts
      if (e.altKey && e.key === 'h') {
        this.showKeyboardShortcutsHelp();
      }
    });
  }
  
  showKeyboardShortcutsHelp() {
    const helpDialog = document.createElement('div');
    helpDialog.className = 'keyboard-shortcuts-dialog';
    helpDialog.innerHTML = `
      <div class="keyboard-shortcuts-content">
        <h2>Keyboard Shortcuts</h2>
        <button class="close-button" aria-label="Close dialog">×</button>
        <ul>
          <li><strong>Alt + A</strong>: Toggle accessibility toolbar</li>
          <li><strong>Alt + C</strong>: Toggle high contrast mode</li>
          <li><strong>Alt + T</strong>: Toggle large text mode</li>
          <li><strong>Alt + M</strong>: Toggle reduced motion</li>
          <li><strong>Alt + H</strong>: Show this help dialog</li>
          <li><strong>Tab</strong>: Navigate through interactive elements</li>
          <li><strong>Enter/Space</strong>: Activate buttons and controls</li>
          <li><strong>Escape</strong>: Close dialogs or cancel actions</li>
        </ul>
        <h3>Game Specific Shortcuts</h3>
        <ul>
          <li><strong>Arrow Keys</strong>: Navigate game elements when applicable</li>
          <li><strong>P</strong>: Pause/resume game (when supported)</li>
          <li><strong>R</strong>: Restart current game (when supported)</li>
        </ul>
      </div>
    `;
    
    // Add close functionality
    document.body.appendChild(helpDialog);
    setTimeout(() => {
      helpDialog.classList.add('visible');
    }, 10);
    
    const closeButton = helpDialog.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      helpDialog.classList.remove('visible');
      setTimeout(() => {
        helpDialog.remove();
      }, 300);
    });
    
    // Close on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        closeButton.click();
        document.removeEventListener('keydown', closeOnEscape);
      }
    });
  }
  
  setupScreenReaderAnnouncer() {
    // Create live region for screen reader announcements
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-announcer';
    document.body.appendChild(announcer);
    
    // Method to announce messages
    window.screenReaderAnnounce = (message) => {
      announcer.textContent = ''; // Clear it first to ensure new identical messages are announced
      setTimeout(() => {
        announcer.textContent = message;
      }, 50);
    };
  }
  
  addAccessibilityStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Accessibility Toolbar */
      .accessibility-toolbar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background-color: #343a40;
        border-radius: 50px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        overflow: hidden;
      }
      
      .accessibility-toolbar.expanded {
        border-radius: 10px;
        padding-bottom: 10px;
      }
      
      .accessibility-toggle {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #343a40;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .accessibility-options {
        display: none;
        flex-direction: column;
        padding: 10px;
      }
      
      .accessibility-toolbar.expanded .accessibility-options {
        display: flex;
      }
      
      .accessibility-option {
        background: none;
        border: none;
        color: white;
        padding: 8px 12px;
        text-align: left;
        border-radius: 5px;
        margin-top: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
      }
      
      .accessibility-option:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .accessibility-option.active {
        background-color: #ff4500;
      }
      
      .accessibility-option i {
        margin-right: 8px;
        width: 20px;
        text-align: center;
      }
      
      /* High Contrast Mode */
      body.high-contrast {
        background-color: #000 !important;
        color: #fff !important;
      }
      
      body.high-contrast a,
      body.high-contrast button:not(.accessibility-option):not(.accessibility-toggle) {
        background-color: #000 !important;
        color: #ffff00 !important;
        border: 2px solid #ffff00 !important;
      }
      
      body.high-contrast input,
      body.high-contrast textarea,
      body.high-contrast select {
        background-color: #000 !important;
        color: #fff !important;
        border: 2px solid #fff !important;
      }
      
      body.high-contrast .card,
      body.high-contrast .container,
      body.high-contrast .navbar {
        background-color: #000 !important;
        color: #fff !important;
        border: 1px solid #fff !important;
      }
      
      /* Large Text Mode */
      body.large-text {
        font-size: 120% !important;
      }
      
      body.large-text h1 {
        font-size: 2.5rem !important;
      }
      
      body.large-text h2 {
        font-size: 2rem !important;
      }
      
      body.large-text h3 {
        font-size: 1.75rem !important;
      }
      
      body.large-text p,
      body.large-text div,
      body.large-text button,
      body.large-text input {
        font-size: 1.2rem !important;
      }
      
      /* Reduced Motion */
      body.reduced-motion *,
      body.reduced-motion *::before,
      body.reduced-motion *::after {
        animation-duration: 0.001s !important;
        animation-delay: 0.001s !important;
        transition-duration: 0.001s !important;
        transition-delay: 0.001s !important;
      }
      
      /* Screen Reader Announcer */
      .sr-announcer {
        position: absolute;
        height: 1px;
        width: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      /* Keyboard Shortcuts Dialog */
      .keyboard-shortcuts-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .keyboard-shortcuts-dialog.visible {
        opacity: 1;
      }
      
      .keyboard-shortcuts-content {
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
      }
      
      .keyboard-shortcuts-content h2 {
        margin-top: 0;
      }
      
      .keyboard-shortcuts-content .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .keyboard-shortcuts-content .close-button:hover {
        background-color: #f0f0f0;
      }
      
      .keyboard-shortcuts-content ul {
        padding-left: 20px;
      }
      
      .keyboard-shortcuts-content li {
        margin-bottom: 10px;
      }
    `;
    document.head.appendChild(styleElement);
  }
}

// Initialize accessibility helper when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.accessibilityHelper = new AccessibilityHelper();
});
