/**
 * EECOL Wire Tools Suite - Shared Mobile Menu System
 * Enterprise PWA
 */

// Mobile menu state
let mobileMenuOpen = false;

/**
 * Internal helper to sanitize URLs against javascript: pseudo-protocol.
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
function _sanitizeUrl(url) {
    if (!url) return '#';
    const trimmed = url.trim();
    // Allow relative paths, http, https, mailto, and tel
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../') ||
        /^(https?|mailto|tel):/i.test(trimmed)) {
        return trimmed;
    }
    // Block potential javascript: or other unsafe protocols
    if (/^javascript:/i.test(trimmed)) {
        console.warn('⚠️ Blocked unsafe javascript: URL in mobile menu');
        return '#';
    }
    // For anything else, allow if it doesn't look like a protocol
    return trimmed.includes(':') ? '#' : trimmed;
}

/**
 * Initialize mobile menu for a page
 * @param {Object} options - Configuration options
 */
function initMobileMenu(options = {}) {
    const {
        menuItems = [],
        version = 'v0.8.0.4',
        credits = 'Made With ❤️ By: Lucas and Cline 🤖',
        title = 'EECOL Wire Tools'
    } = options;

    // Load Dark Mode Script dynamically if not present
    if (typeof window.DarkMode === 'undefined' && !document.querySelector('script[src*="dark-mode.js"]')) {
        const scripts = document.getElementsByTagName('script');
        let basePath = null;
        for (let s of scripts) {
            if (s.src.includes('mobile-menu.js')) {
                const url = new URL(s.src, window.location.href);
                basePath = url.pathname.replace('mobile-menu.js', '');
                break;
            }
        }

        if (basePath) {
            const script = document.createElement('script');
            script.src = basePath + 'dark-mode.js';
            script.onload = () => { if (window.DarkMode) window.DarkMode.updateToggleIcons(); };
            document.head.appendChild(script);
        }
    }

    createMobileMenu(menuItems, version, credits, title);
    setupMobileMenuEvents();
}

/**
 * Rebuilds the mobile menu component using a safe structural template.
 * "Rebuild the floor before the ceiling" - Fixed structure, dynamic data.
 */
function createMobileMenu(menuItems, version, credits, title) {
    // 1. Cleanup existing
    const existingOverlay = document.getElementById('mobileMenuOverlay');
    if (existingOverlay) existingOverlay.remove();
    const existingBtn = document.getElementById('mobileMenuBtn');
    if (existingBtn) existingBtn.remove();

    // 2. Build the "Floor" (Structural Template)
    // We use innerHTML only for this fixed, developer-defined structure.
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = `
        <button id="mobileMenuBtn" aria-label="Open Navigation Menu" aria-expanded="false" class="sm:hidden fixed bottom-4 left-4 z-40 bg-[#0058B3] hover:bg-[#004a99] text-white p-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0058B3] focus:ring-opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="hamburgerIcon" d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path id="closeIcon" class="hidden" d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>

        <div id="mobileMenuOverlay" class="fixed inset-0 z-50 sm:hidden transform -translate-x-full transition-all duration-300 ease-in-out opacity-0 pointer-events-none">
            <div id="mobileMenuBackdrop" class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
            <div class="absolute left-0 top-0 h-full w-80 max-w-[90vw] bg-[#F0F8FF] dark:bg-slate-900 shadow-2xl border-r-2 border-[#0058B3] flex flex-col transform -translate-x-full transition-transform duration-300 ease-in-out">
                <div class="p-6 border-b border-blue-200 text-center">
                    <div class="flex justify-center mb-3">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-[#0058B3] drop-shadow-lg eecol-logo-tilt">
                            <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" stroke-width="2"/>
                            <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                            <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
                            <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
                            <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h2 id="menuTitle" class="text-xl font-black text-[#0058B3] header-gradient"></h2>
                </div>
                <div class="flex justify-end p-4">
                    <button id="mobileMenuCloseBtn" aria-label="Close Navigation Menu" class="p-2 text-[#0058B3] hover:text-[#004a99] rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div id="navContainer" class="flex-1 px-6 py-2 space-y-4 overflow-y-auto"></div>
                <div class="p-6 border-t border-blue-200 text-center">
                    <button id="mobileDarkModeToggle" class="mb-4 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-center mx-auto w-full max-w-[200px] transition-colors">
                        🌙 Dark Mode
                    </button>
                    <p id="menuVersion" class="text-xs text-gray-500 font-mono mb-2"></p>
                    <p id="menuCredits" class="font-medium text-[#0058B3] text-sm mb-1"></p>
                    <p class="text-xs font-semibold header-gradient">EECOL Wire Tools 2025 - Enterprise Edition</p>
                </div>
            </div>
        </div>
    `;

    // Inject floor
    document.body.appendChild(tempContainer.firstElementChild); // Btn
    document.body.appendChild(tempContainer.firstElementChild); // Overlay

    // 3. Build the "Ceiling" (Dynamic Content)
    // We populate user-provided data using textContent only.
    document.getElementById('menuTitle').textContent = title;
    document.getElementById('menuVersion').textContent = version;
    document.getElementById('menuCredits').textContent = credits;

    const navContainer = document.getElementById('navContainer');
    menuItems.forEach(item => {
        const baseClass = 'block px-6 py-3 text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-opacity-50 text-center text-sm';
        const colorClass = item.class || 'bg-[#0058B3] hover:bg-[#004a99]';

        if (item.action === 'click' && item.selector) {
            const btn = document.createElement('button');
            btn.dataset.action = 'click';
            btn.dataset.selector = item.selector;
            btn.className = `${baseClass} ${colorClass} w-full`;
            btn.style.maxWidth = '300px';
            btn.textContent = item.text;
            navContainer.appendChild(btn);
        } else {
            const link = document.createElement('a');
            link.href = _sanitizeUrl(item.href);
            link.className = `${baseClass} ${colorClass} no-underline`;
            link.style.width = 'calc(100% - 3rem)';
            link.style.maxWidth = '300px';
            link.textContent = item.text;
            navContainer.appendChild(link);
        }
    });

    // Re-attach dark mode listener
    const darkToggle = document.getElementById('mobileDarkModeToggle');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            if (window.DarkMode) window.DarkMode.toggle();
        });
    }
}

/**
 * Setup event listeners for mobile menu
 */
function setupMobileMenuEvents() {
    const hamburgerBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('mobileMenuCloseBtn');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    const overlay = document.getElementById('mobileMenuOverlay');

    if (!hamburgerBtn || !overlay) return;

    hamburgerBtn.addEventListener('click', () => toggleMobileMenu());
    if (closeBtn) closeBtn.addEventListener('click', () => closeMobileMenu());
    if (backdrop) backdrop.addEventListener('click', () => closeMobileMenu());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOpen) closeMobileMenu();
    });

    document.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action="click"]');
        if (button) {
            e.preventDefault();
            const selector = button.getAttribute('data-selector');
            if (selector) {
                const target = document.querySelector(selector);
                if (target) {
                    target.click();
                    closeMobileMenu();
                }
            }
        }
    });

    overlay.addEventListener('wheel', (e) => {
        if (mobileMenuOpen) e.preventDefault();
    }, { passive: false });
}

function toggleMobileMenu() {
    if (mobileMenuOpen) closeMobileMenu();
    else openMobileMenu();
}

function openMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const panel = overlay?.querySelector('div:nth-child(2)');
    const btn = document.getElementById('mobileMenuBtn');
    const hIcon = document.getElementById('hamburgerIcon');
    const cIcon = document.getElementById('closeIcon');

    if (!overlay) return;

    mobileMenuOpen = true;
    overlay.classList.remove('-translate-x-full', 'opacity-0', 'pointer-events-none');
    overlay.classList.add('translate-x-0', 'opacity-100');
    if (panel) panel.classList.remove('-translate-x-full');

    document.body.style.overflow = 'hidden';

    if (btn) {
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Close Navigation Menu');
    }
    if (hIcon) hIcon.classList.add('hidden');
    if (cIcon) cIcon.classList.remove('hidden');
}

function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const panel = overlay?.querySelector('div:nth-child(2)');
    const btn = document.getElementById('mobileMenuBtn');
    const hIcon = document.getElementById('hamburgerIcon');
    const cIcon = document.getElementById('closeIcon');

    if (!overlay) return;

    mobileMenuOpen = false;
    overlay.classList.add('opacity-0', 'pointer-events-none');
    if (panel) panel.classList.add('-translate-x-full');

    // Delay physical removal from viewport to allow transition
    setTimeout(() => {
        if (!mobileMenuOpen) overlay.classList.add('-translate-x-full');
    }, 300);

    document.body.style.overflow = '';

    if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Open Navigation Menu');
    }
    if (hIcon) hIcon.classList.remove('hidden');
    if (cIcon) cIcon.classList.add('hidden');
}

if (typeof window !== 'undefined') {
    window.initMobileMenu = initMobileMenu;
    window.toggleMobileMenu = toggleMobileMenu;
    window.openMobileMenu = openMobileMenu;
    window.closeMobileMenu = closeMobileMenu;
}
