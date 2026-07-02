/**
 * EECOL Wire Tools Suite - Shared Mobile Menu System
 * Enterprise PWA
 */

// Mobile menu state
let mobileMenuOpen = false;

/**
 * Internal helper to safely escape strings for HTML insertion.
 * Provides defense-in-depth against XSS.
 * @param {any} v - Value to escape
 * @returns {string} Escaped string
 */
function _esc(v) {
    if (v === null || v === undefined) return '';
    if (typeof window !== 'undefined' && typeof window.escapeHTML === 'function') {
        return window.escapeHTML(v);
    }
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Internal helper to sanitize URLs and prevent javascript: injections.
 * @param {string} url - The URL to sanitize
 * @returns {string} Sanitized URL
 */
function _sanitizeUrl(url) {
    if (!url) return '#';
    const trimmedUrl = url.trim();
    // Allow relative paths, http, https, mailto, and tel
    if (trimmedUrl.startsWith('/') ||
        trimmedUrl.startsWith('./') ||
        trimmedUrl.startsWith('../') ||
        /^(https?|mailto|tel):/i.test(trimmedUrl)) {
        return trimmedUrl;
    }
    // Block everything else (especially javascript:)
    console.warn(`Blocked potentially unsafe URL: ${trimmedUrl}`);
    return 'about:blank';
}

/**
 * Initialize mobile menu for a page
 * @param {Object} options - Configuration options
 */
function initMobileMenu(options = {}) {
    const {
        menuItems = [],
        version = 'v0.8.0.5',
        credits = 'Made With ❤️ By: Lucas and Cline 🤖',
        title = 'EECOL Wire Tools'
    } = options;

    // Dynamic dark mode script loading preserved
    if (typeof window.DarkMode === 'undefined' && !document.querySelector('script[src*="dark-mode.js"]')) {
        const scripts = document.getElementsByTagName('script');
        let basePath = '../../utils/';
        for (let s of scripts) {
            if (s.src.includes('mobile-menu.js')) {
                basePath = s.src.replace('mobile-menu.js', '');
                break;
            }
        }
        const script = document.createElement('script');
        script.src = basePath + 'dark-mode.js';
        script.onload = () => {
            if (window.DarkMode) window.DarkMode.updateToggleIcons();
        };
        document.head.appendChild(script);
    }

    createMobileMenuElements(menuItems, version, credits, title);
    setupMobileMenuEvents();
}

/**
 * Internal helper to resolve paths relative to the project root.
 * Uses the mobile-menu.js script location as a reference.
 * @param {string} href - The target href
 * @returns {string} Resolved href
 */
function _resolvePath(href) {
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return href;
    }

    // Find the project root URL by looking at where this script is loaded from
    const scripts = document.getElementsByTagName('script');
    let rootPath = '';
    for (let s of scripts) {
        if (s.src.includes('mobile-menu.js')) {
            const marker = 'src/utils/mobile-menu.js';
            const index = s.src.indexOf(marker);
            if (index !== -1) {
                rootPath = s.src.substring(0, index);
                break;
            }
        }
    }

    if (!rootPath) {
        // Fallback to relative path if root cannot be determined
        return href;
    }

    // Standardize href: remove leading slash if present
    const cleanHref = href.startsWith('/') ? href.substring(1) : href;

    return rootPath + cleanHref;
}

/**
 * Programmatically create and inject mobile menu elements into the DOM.
 * This DOM-based approach is more robust and inherently secure.
 */
function createMobileMenuElements(menuItems, version, credits, title) {
    /**
     * IDB SENTINEL: Safe Structural Template Pattern
     * Uses a static HTML string for the component's structure (ensuring SVG and CSS class integrity)
     * but programmatically populates all dynamic data (title, version, credits, menu items)
     * using .textContent and .setAttribute to prevent XSS.
     */

    // Hamburger button structure
    const hamburgerButtonHtml = `
        <button id="mobileMenuBtn" aria-label="Open Navigation Menu" aria-expanded="false" class="sm:hidden fixed bottom-4 left-4 z-40 bg-[#0058B3] hover:bg-[#004a99] text-white p-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0058B3] focus:ring-opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="hamburgerIcon" d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path id="closeIcon" class="hidden" d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;

    // Mobile menu overlay structure (empty navigation container)
    const mobileMenuHtml = `
        <div id="mobileMenuOverlay" class="fixed inset-0 z-50 sm:hidden transform -translate-x-full transition-transform duration-300 ease-out">
            <!-- Backdrop -->
            <div id="mobileMenuBackdrop" class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

            <!-- Menu Panel -->
            <div class="absolute left-0 top-0 h-full w-80 max-w-[90vw] bg-[#F0F8FF] shadow-2xl border-r-2 border-[#0058B3] flex flex-col">

                <!-- Header -->
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
                    <h2 id="mobileMenuTitle" class="text-xl font-black text-[#0058B3] header-gradient"></h2>
                </div>

                <!-- Close Button -->
                <div class="flex justify-end p-4">
                    <button id="mobileMenuCloseBtn" aria-label="Close Navigation Menu" class="p-2 text-[#0058B3] hover:text-[#004a99] rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>

                <!-- Navigation -->
                <div id="mobileMenuNav" class="flex-1 px-6 py-2 space-y-4 overflow-y-auto"></div>

                <!-- Footer Info -->
                <div class="p-6 border-t border-blue-200 text-center">
                    <!-- Mobile Dark Mode Toggle -->
                    <button id="mobileDarkModeToggle" class="mb-4 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-center mx-auto w-full max-w-[200px] transition-colors">
                        🌙 Dark Mode
                    </button>

                    <p id="mobileMenuVersion" class="text-xs text-gray-500 font-mono mb-2"></p>
                    <p id="mobileMenuCredits" class="font-medium text-[#0058B3] text-sm mb-1"></p>
                    <p class="text-xs font-semibold header-gradient">EECOL Wire Tools 2025 - Enterprise Edition</p>
                </div>
            </div>
        </div>
    `;

    // Inject static structures into DOM
    document.body.insertAdjacentHTML('beforeend', hamburgerButtonHtml);
    document.body.insertAdjacentHTML('beforeend', mobileMenuHtml);

    // Securely populate data using textContent
    const titleEl = document.getElementById('mobileMenuTitle');
    if (titleEl) titleEl.textContent = title;

    const versionEl = document.getElementById('mobileMenuVersion');
    if (versionEl) versionEl.textContent = version;

    const creditsEl = document.getElementById('mobileMenuCredits');
    if (creditsEl) creditsEl.textContent = credits;

    const navContainer = document.getElementById('mobileMenuNav');
    if (!navContainer) return;

    // Mobile menu navigation items
    menuItems.forEach((item) => {
        let el;
        const cssClass = item.class || 'bg-[#0058B3] hover:bg-[#004a99]';
        const baseClasses = "block px-6 py-3 text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-opacity-50 text-center text-sm";

        if (item.action === 'click' && item.selector) {
            el = document.createElement('button');
            el.setAttribute('data-action', 'click');
            el.setAttribute('data-selector', item.selector);
            el.className = `${baseClasses} ${cssClass} w-full`;
            el.style.maxWidth = "300px";
        } else {
            el = document.createElement('a');
            const resolvedHref = _resolvePath(item.href);
            el.setAttribute('href', _sanitizeUrl(resolvedHref));
            el.className = `${baseClasses} ${cssClass} no-underline`;
            el.style.width = "calc(100% - 3rem)";
            el.style.maxWidth = "300px";
        }

        el.textContent = item.text;
        navContainer.appendChild(el);
    });

    // Setup listener for mobile dark mode toggle if script is ready
    const mobileToggle = document.getElementById('mobileDarkModeToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            if (window.DarkMode) {
                window.DarkMode.toggle();
            } else {
                console.warn('Dark Mode script not loaded yet');
            }
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
    const btn = document.getElementById('mobileMenuBtn');
    const hIcon = document.getElementById('hamburgerIcon');
    const cIcon = document.getElementById('closeIcon');

    if (!overlay) return;

    mobileMenuOpen = true;
    overlay.classList.remove('-translate-x-full');
    overlay.classList.add('translate-x-0');
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
    const btn = document.getElementById('mobileMenuBtn');
    const hIcon = document.getElementById('hamburgerIcon');
    const cIcon = document.getElementById('closeIcon');

    if (!overlay) return;

    mobileMenuOpen = false;
    overlay.classList.remove('translate-x-0');
    overlay.classList.add('-translate-x-full');
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
