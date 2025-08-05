// Dark Mode Toggle Functionality

class DarkModeManager {
    constructor() {
        this.init();
    }

    init() {
        // Create and inject the toggle switch
        this.createToggleSwitch();
        
        // Set initial theme based on user preference or system preference
        this.setInitialTheme();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Listen for system theme changes
        this.setupSystemThemeListener();
    }

    createToggleSwitch() {
        // Find the right box in navbar
        const rightBox = document.getElementById('rightBox');
        if (!rightBox) return;

        // Create theme toggle container
        const themeToggle = document.createElement('div');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = `
            <span class="theme-icon sun">☀️</span>
            <label class="theme-switch">
                <input type="checkbox" id="themeToggle">
                <span class="theme-slider"></span>
            </label>
            <span class="theme-icon moon">🌙</span>
        `;

        // Insert before the first child (create blog button)
        rightBox.insertBefore(themeToggle, rightBox.firstChild);
    }

    setInitialTheme() {
        // Check for saved theme preference or default to system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme;
        if (savedTheme) {
            theme = savedTheme;
        } else {
            theme = systemPrefersDark ? 'dark' : 'light';
        }

        this.applyTheme(theme);
        this.updateToggleState(theme === 'dark');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Save to localStorage
        localStorage.setItem('theme', theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    }

    updateToggleState(isDark) {
        const toggleInput = document.getElementById('themeToggle');
        if (toggleInput) {
            toggleInput.checked = isDark;
        }
    }

    setupEventListeners() {
        const toggleInput = document.getElementById('themeToggle');
        if (toggleInput) {
            toggleInput.addEventListener('change', (e) => {
                const theme = e.target.checked ? 'dark' : 'light';
                this.applyTheme(theme);
                
                // Add a subtle animation feedback
                this.animateThemeChange();
            });
        }
    }

    setupSystemThemeListener() {
        // Listen for system theme changes only if user hasn't manually set a preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            // Only auto-switch if no manual preference is saved
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                const theme = e.matches ? 'dark' : 'light';
                this.applyTheme(theme);
                this.updateToggleState(theme === 'dark');
            }
        });
    }

    animateThemeChange() {
        // Add a smooth transition effect
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // Remove transition after animation completes
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    // Public method to toggle theme programmatically
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.updateToggleState(newTheme === 'dark');
    }

    // Public method to get current theme
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    // Public method to set theme
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
            this.updateToggleState(theme === 'dark');
        }
    }
}

// Initialize dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.darkModeManager = new DarkModeManager();
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeManager;
}
