// Configuration for calendar API
const CALENDAR_CONFIG = {
    API_URL: (() => {
        if (typeof window === 'undefined' || !window.location) {
            return 'http://localhost:8787';
        }

        const { hostname } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return window.location.origin || 'http://localhost:8787';
        }

        return window.location.origin;
    })(),

    USE_FALLBACK: true,
    DEBUG: false,
    LOG_DATA: false,
};

// Helper function to log if debugging is enabled
function logDebug(...args) {
    if (CALENDAR_CONFIG.DEBUG) {
        console.log('[Calendar Debug]', ...args);
    }
}

// Export for use in calendar.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CALENDAR_CONFIG, logDebug };
}
