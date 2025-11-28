/**
 * EECOL Wire Tools Suite - Theme Loader
 * This script is intended to be placed in the <head> of the document.
 * It blocks rendering to prevent the "flash of unstyled content" (FOUC)
 * by applying the correct theme class ('dark-mode') to the <html> element
 * before the body is rendered.
 */
(function() {
    const storageKey = 'eecol-theme';
    const darkClass = 'dark-mode';

    function applyTheme() {
        try {
            const storedTheme = localStorage.getItem(storageKey);
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = storedTheme === 'dark' || (storedTheme === null && prefersDark);

            if (isDark) {
                document.documentElement.classList.add(darkClass);
            } else {
                document.documentElement.classList.remove(darkClass);
            }
        } catch (e) {
            console.warn('Could not apply theme from theme-loader:', e);
        }
    }

    applyTheme();
})();
