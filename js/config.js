// Configuration for calendar API
const CALENDAR_CONFIG = {
    // API endpoint - change based on environment
    API_URL: 'http://localhost:3000',
    
    // Fallback to local JSON if API is unavailable
    USE_FALLBACK: true,
    
    // Enable debug logging
    DEBUG: true,
    
    // Log all availability data
    LOG_DATA: true
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
