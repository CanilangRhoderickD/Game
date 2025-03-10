
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
