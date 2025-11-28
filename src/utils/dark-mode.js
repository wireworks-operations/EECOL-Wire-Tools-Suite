/**
 * EECOL Wire Tools Suite - Dark Mode System
 * Handles theme toggling, persistence, and UI injection
 */

const DarkMode = {
    // Configuration
    config: {
        storageKey: 'eecol-theme',
        darkClass: 'dark-mode',
        toggleId: 'darkModeToggle',
        mobileToggleId: 'mobileDarkModeToggle'
    },

    // Initialize the system
    init() {
        this.applyTheme();
        this.injectDesktopToggle();
        // Mobile toggle is handled by mobile-menu.js integration or we can try to inject it if menu exists
        this.setupListeners();
    },

    // Check if dark mode is active
    isDark() {
        return localStorage.getItem(this.config.storageKey) === 'dark';
    },

    // Apply the current theme
    applyTheme() {
        const isDark = this.isDark();
        if (isDark) {
            document.documentElement.classList.add(this.config.darkClass);
        } else {
            document.documentElement.classList.remove(this.config.darkClass);
        }
        this.updateToggleIcons();
    },

    // Toggle the theme
    toggle() {
        const isDark = this.isDark();
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem(this.config.storageKey, newTheme);
        this.applyTheme();
    },

    // Update icons for all toggles
    updateToggleIcons() {
        const isDark = this.isDark();
        const icon = isDark ? '🌞' : '🌙'; // Sun for dark mode (to switch to light), Moon for light mode

        // Update Desktop Toggle
        const desktopBtn = document.getElementById(this.config.toggleId);
        if (desktopBtn) {
            desktopBtn.innerHTML = icon;
            desktopBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }

        // Update Mobile Toggle (if it exists independently)
        const mobileBtn = document.getElementById(this.config.mobileToggleId);
        if (mobileBtn) {
            mobileBtn.innerHTML = `${icon} <span class="ml-2">${isDark ? 'Light Mode' : 'Dark Mode'}</span>`;
        }
    },

    // Inject the desktop toggle button into the main container
    injectDesktopToggle() {
        // Look for the main container relative wrapper
        // Most pages have a div with class 'relative' inside body or as the main wrapper
        // We'll try to find the specific "Made With" footer or the Logo to anchor to,
        // OR just append to the first main container found.

        // Common pattern in these pages:
        // <div class="flex-1 w-full max-w... relative ...">

        const mainContainer = document.querySelector('.max-w-md, .max-w-xl, .max-w-7xl, .max-w-9xl');

        if (mainContainer && !document.getElementById(this.config.toggleId)) {
            const btn = document.createElement('button');
            btn.id = this.config.toggleId;
            btn.className = 'absolute top-4 right-4 z-30 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all duration-200 text-xl leading-none border border-gray-200 dark:bg-slate-700 dark:border-slate-600 dark:text-yellow-300';
            // Note: Classes above assume Tailwind. "dark:" classes work if "darkMode: 'class'" is enabled in tailwind config,
            // but we are using custom CSS. We will style this button in CSS too.

            btn.onclick = () => this.toggle();

            // If the container is relative, absolute positioning works.
            // If not, we might need to make it relative.
            const style = window.getComputedStyle(mainContainer);
            if (style.position === 'static') {
                mainContainer.style.position = 'relative';
            }

            mainContainer.appendChild(btn);
            this.updateToggleIcons();
        }
    },

    setupListeners() {
        // Listen for storage changes (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === this.config.storageKey) {
                this.applyTheme();
            }
        });
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DarkMode.init());
} else {
    DarkMode.init();
}

// Expose globally
window.DarkMode = DarkMode;
