// Dark Mode Toggle Functionality

class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    // Check for saved theme preference or default to system preference
    this.setInitialTheme();
    this.createToggleButton();
    this.bindEvents();
  }

  setInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Use saved preference
      this.setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  createToggleButton() {
    // Create the theme toggle elements
    const themeToggle = document.createElement('div');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = `
      <span class="theme-icon sun-icon">☀️</span>
      <label class="theme-switch">
        <input type="checkbox" id="theme-toggle-checkbox">
        <span class="slider"></span>
      </label>
      <span class="theme-icon moon-icon">🌙</span>
    `;

    // Insert the toggle into the navbar
    const rightBox = document.getElementById('rightBox');
    if (rightBox) {
      rightBox.insertBefore(themeToggle, rightBox.firstChild);
    }

    // Set initial toggle state
    const checkbox = document.getElementById('theme-toggle-checkbox');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    checkbox.checked = currentTheme === 'dark';
  }

  bindEvents() {
    // Theme toggle event
    const checkbox = document.getElementById('theme-toggle-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        this.setTheme(newTheme);
        this.saveTheme(newTheme);
      });
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener((e) => {
        // Only update if no manual preference is saved
        if (!localStorage.getItem('theme')) {
          this.setTheme(e.matches ? 'dark' : 'light');
          const checkbox = document.getElementById('theme-toggle-checkbox');
          if (checkbox) {
            checkbox.checked = e.matches;
          }
        }
      });
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update checkbox state if it exists
    const checkbox = document.getElementById('theme-toggle-checkbox');
    if (checkbox) {
      checkbox.checked = theme === 'dark';
    }
  }

  saveTheme(theme) {
    localStorage.setItem('theme', theme);
  }

  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    this.saveTheme(newTheme);
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Export for use in other scripts
export default ThemeManager;
