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
        script.onload = () => { if (window.DarkMode) window.DarkMode.updateToggleIcons(); };
        document.head.appendChild(script);
    }

    createMobileMenuElements(menuItems, version, credits, title);
    setupMobileMenuEvents();
}

/**
 * Programmatically create and inject mobile menu elements into the DOM.
 * This DOM-based approach is more robust and inherently secure.
 */
function createMobileMenuElements(menuItems, version, credits, title) {
    // Remove existing menu if re-initialized
    const existingOverlay = document.getElementById('mobileMenuOverlay');
    if (existingOverlay) existingOverlay.remove();
    const existingBtn = document.getElementById('mobileMenuBtn');
    if (existingBtn) existingBtn.remove();

    // 1. Hamburger Button
    const btn = document.createElement('button');
    btn.id = 'mobileMenuBtn';
    btn.setAttribute('aria-label', 'Open Navigation Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.className = 'sm:hidden fixed bottom-4 left-4 z-40 bg-[#0058B3] hover:bg-[#004a99] text-white p-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0058B3] focus:ring-opacity-50';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');

    const hPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hPath.id = 'hamburgerIcon';
    hPath.setAttribute('d', 'M3 12h18M3 6h18M3 18h18');
    hPath.setAttribute('stroke', 'currentColor');
    hPath.setAttribute('stroke-width', '2');
    hPath.setAttribute('stroke-linecap', 'round');
    hPath.setAttribute('stroke-linejoin', 'round');

    const cPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cPath.id = 'closeIcon';
    cPath.className = 'hidden';
    cPath.setAttribute('d', 'M18 6L6 18M6 6l12 12');
    cPath.setAttribute('stroke', 'currentColor');
    cPath.setAttribute('stroke-width', '2');
    cPath.setAttribute('stroke-linecap', 'round');
    cPath.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(hPath);
    svg.appendChild(cPath);
    btn.appendChild(svg);
    document.body.appendChild(btn);

    // 2. Mobile Menu Overlay
    const overlay = document.createElement('div');
    overlay.id = 'mobileMenuOverlay';
    overlay.className = 'fixed inset-0 z-50 sm:hidden transform -translate-x-full transition-transform duration-300 ease-out';

    const backdrop = document.createElement('div');
    backdrop.id = 'mobileMenuBackdrop';
    backdrop.className = 'absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm';
    overlay.appendChild(backdrop);

    const panel = document.createElement('div');
    panel.className = 'absolute left-0 top-0 h-full w-80 max-w-[90vw] bg-[#F0F8FF] shadow-2xl border-r-2 border-[#0058B3] flex flex-col';

    // Header
    const header = document.createElement('div');
    header.className = 'p-6 border-b border-blue-200 text-center';

    const logoContainer = document.createElement('div');
    logoContainer.className = 'flex justify-center mb-3';

    const logoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    logoSvg.setAttribute('width', '48');
    logoSvg.setAttribute('height', '48');
    logoSvg.setAttribute('viewBox', '0 0 24 24');
    logoSvg.setAttribute('fill', 'none');
    logoSvg.setAttribute('class', 'text-[#0058B3] drop-shadow-lg eecol-logo-tilt');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '11.35');
    circle.setAttribute('fill', 'white'); circle.setAttribute('stroke', 'currentColor'); circle.setAttribute('stroke-width', '2');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '4'); rect.setAttribute('y', '4'); rect.setAttribute('width', '4'); rect.setAttribute('height', '16');
    rect.setAttribute('rx', '1'); rect.setAttribute('fill', 'currentColor');

    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M 8,6.5 C 12,5.5 16,7.5 20,6.5');
    p1.setAttribute('stroke', 'currentColor'); p1.setAttribute('stroke-width', '3.5'); p1.setAttribute('stroke-linecap', 'round');

    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p2.setAttribute('d', 'M 8,12 C 12,11 16,13 20,12');
    p2.setAttribute('stroke', 'currentColor'); p2.setAttribute('stroke-width', '3.5'); p2.setAttribute('stroke-linecap', 'round');

    const p3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p3.setAttribute('d', 'M 8,17.5 C 12,16.5 16,18.5 20,17.5');
    p3.setAttribute('stroke', 'currentColor'); p3.setAttribute('stroke-width', '3.5'); p3.setAttribute('stroke-linecap', 'round');

    logoSvg.appendChild(circle); logoSvg.appendChild(rect); logoSvg.appendChild(p1); logoSvg.appendChild(p2); logoSvg.appendChild(p3);
    logoContainer.appendChild(logoSvg);
    header.appendChild(logoContainer);

    const h2 = document.createElement('h2');
    h2.className = 'text-xl font-black text-[#0058B3] header-gradient';
    h2.textContent = title;
    header.appendChild(h2);
    panel.appendChild(header);

    // Close Button
    const closeBtnDiv = document.createElement('div');
    closeBtnDiv.className = 'flex justify-end p-4';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'mobileMenuCloseBtn';
    closeBtn.setAttribute('aria-label', 'Close Navigation Menu');
    closeBtn.className = 'p-2 text-[#0058B3] hover:text-[#004a99] rounded-full hover:bg-gray-100 transition-colors duration-200';
    const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('width', '24'); closeSvg.setAttribute('height', '24'); closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('fill', 'none');
    const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    closePath.setAttribute('d', 'M18 6L6 18M6 6l12 12');
    closePath.setAttribute('stroke', 'currentColor'); closePath.setAttribute('stroke-width', '2');
    closePath.setAttribute('stroke-linecap', 'round'); closePath.setAttribute('stroke-linejoin', 'round');
    closeSvg.appendChild(closePath);
    closeBtn.appendChild(closeSvg);
    closeBtnDiv.appendChild(closeBtn);
    panel.appendChild(closeBtnDiv);

    // Navigation items
    const nav = document.createElement('div');
    nav.className = 'flex-1 px-6 py-2 space-y-4 overflow-y-auto';
    menuItems.forEach(item => {
        const baseClass = 'block px-6 py-3 text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-opacity-50 text-center text-sm';
        const colorClass = item.class || 'bg-[#0058B3] hover:bg-[#004a99]';

        if (item.action === 'click' && item.selector) {
            const button = document.createElement('button');
            button.dataset.action = 'click';
            button.dataset.selector = item.selector;
            button.className = `${baseClass} ${colorClass} w-full`;
            button.style.maxWidth = '300px';
            button.textContent = item.text;
            nav.appendChild(button);
        } else {
            const link = document.createElement('a');
            link.href = _sanitizeUrl(item.href);
            link.className = `${baseClass} ${colorClass} no-underline`;
            link.style.width = 'calc(100% - 3rem)';
            link.style.maxWidth = '300px';
            link.textContent = item.text;
            nav.appendChild(link);
        }
    });
    panel.appendChild(nav);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'p-6 border-t border-blue-200 text-center';

    const darkToggle = document.createElement('button');
    darkToggle.id = 'mobileDarkModeToggle';
    darkToggle.className = 'mb-4 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-center mx-auto w-full max-w-[200px] transition-colors';
    darkToggle.textContent = '🌙 Dark Mode';
    darkToggle.addEventListener('click', () => {
        if (window.DarkMode) window.DarkMode.toggle();
    });
    footer.appendChild(darkToggle);

    const pVersion = document.createElement('p');
    pVersion.className = 'text-xs text-gray-500 font-mono mb-2';
    pVersion.textContent = version;
    footer.appendChild(pVersion);

    const pCredits = document.createElement('p');
    pCredits.className = 'font-medium text-[#0058B3] text-sm mb-1';
    pCredits.textContent = credits;
    footer.appendChild(pCredits);

    const pBranding = document.createElement('p');
    pBranding.className = 'text-xs font-semibold header-gradient';
    pBranding.textContent = 'EECOL Wire Tools 2025 - Enterprise Edition';
    footer.appendChild(pBranding);

    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
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
