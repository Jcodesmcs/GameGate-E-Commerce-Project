console.log('🔧 api.js is loading...');

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    /**
     * Generic API request handler
     */
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log(`🔄 API Call: ${url}`, config);
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`❌ API Error (${endpoint}):`, error);
            return {
                success: false,
                error: error.message || 'Network error occurred'
            };
        }
    }

    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================

    static async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: userData
        });
    }

    static async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: credentials
        });
    }

    static async getProfile(userId) {
        return this.request(`/auth/profile/${userId}`);
    }

    // ============================================
    // GAME ITEMS ENDPOINTS
    // ============================================

    static async getAllGames() {
        return this.request('/items');
    }

    static async getGameById(gameId) {
        return this.request(`/items/${gameId}`);
    }

    static async searchGames(keyword) {
        return this.request(`/items/search?q=${encodeURIComponent(keyword)}`);
    }

    static async getGamesByPlatform(platform) {
        return this.request(`/items/platform/${platform}`);
    }

    // ============================================
    // TRANSACTION ENDPOINTS
    // ============================================

    static async purchaseItem(purchaseData) {
        return this.request('/transactions/purchase', {
            method: 'POST',
            body: purchaseData
        });
    }

    static async getUserTransactions(userId) {
        return this.request(`/transactions/user/${userId}`);
    }

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================

    static async addItem(itemData) {
        return this.request('/admin/items', {
            method: 'POST',
            body: itemData
        });
    }

    static async deleteItem(itemId) {
        return this.request(`/admin/items/${itemId}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // Promo Methods
    // ============================================
    static async getAllPromos() {
        return this.request('/promos');
    }

    static async addPromo(promoData) {
        return this.request('/promos', {
            method: 'POST',
            body: promoData
        });
    }

    static async deletePromo(promoId) {
        return this.request(`/promos/${promoId}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // HEALTH CHECK
    // ============================================

    static async healthCheck() {
        return this.request('/health');
    }
}

// ============================================
// AUTHENTICATION FUNCTIONS - BACKEND ONLY
// ============================================

/**
 * Create user account via backend ONLY
 */
async function createUserBackend(username, email, password) {
    try {
        const result = await ApiService.signup({
            username: username,
            email: email,
            password: password
        });
        
        return result;
    } catch (error) {
        console.error('Signup failed:', error);
        return {
            success: false,
            error: error.message || 'Registration failed - server connection error'
        };
    }
}

/**
 * Login user via backend ONLY
 */
async function loginUserBackend(email, password) {
    try {
        const result = await ApiService.login({
            username_or_email: email,  // Use email for login
            password: password
        });
        
        return result;
    } catch (error) {
        console.error('Login failed:', error);
        return {
            success: false,
            error: error.message || 'Login failed - server connection error'
        };
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Creates user session
 */
function createSession(user) {
    const session = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currencyhub_session', JSON.stringify(session));
    return session;
}

/**
 * Gets current session
 */
function getCurrentSession() {
    const session = localStorage.getItem('currencyhub_session');
    return session ? JSON.parse(session) : null;
}

/**
 * Checks if user is logged in
 */
function isLoggedIn() {
    return getCurrentSession() !== null;
}

/**
 * Logs out user
 */
function logout() {
    localStorage.removeItem('currencyhub_session');
}

// Make functions available globally
window.createSession = createSession;
window.getCurrentSession = getCurrentSession;
window.isLoggedIn = isLoggedIn;
window.logout = logout;

// ============================================
// TEST FUNCTIONS
// ============================================

async function testBackendConnection() {
    console.log('🧪 Testing backend connection...');
    
    try {
        const health = await ApiService.healthCheck();
        console.log('✅ Backend connection successful:', health);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        return false;
    }
}

// ============================================
// DEBUG FUNCTIONS
// ============================================

/**
 * Manually create an admin session for testing - ULTRA VERBOSE
 */
function createTestAdminSession() {
    console.log('🧪 Creating test admin session...');
    
    const testAdmin = {
        id: 999,
        username: 'testadmin',
        email: 'test@admin.com',
        role: 'admin'
    };
    
    console.log('🔍 Test admin data:', testAdmin);
    console.log('🔍 Test admin role:', testAdmin.role);
    
    const result = createSession(testAdmin);
    
    // Ultra verification
    console.log('🔍 Result from createSession:', result);
    console.log('🔍 Result role:', result.role);
    
    // Manual localStorage check
    const manualCheck = localStorage.getItem('currencyhub_session');
    console.log('🔍 Manual localStorage check:', manualCheck);
    
    const manualParsed = JSON.parse(manualCheck);
    console.log('🔍 Manual parsed check:', manualParsed);
    console.log('🔍 Manual role check:', manualParsed.role);
}

/**
 * Nuclear option: Force add role to session
 */
function nuclearFixSession() {
    console.log('☢️ NUCLEAR FIX: Forcing admin role...');
    
    const rawSession = localStorage.getItem('currencyhub_session');
    if (!rawSession) {
        console.log('❌ No session to fix');
        return;
    }
    
    const session = JSON.parse(rawSession);
    console.log('🔍 Current session:', session);
    
    // Force add role property
    session.role = 'admin';
    
    // Store it back
    localStorage.setItem('currencyhub_session', JSON.stringify(session));
    
    console.log('✅ Session after nuclear fix:', session);
    console.log('👤 Role after fix:', session.role);
    
    // Update UI
    if (typeof updateHeaderAuth === 'function') {
        updateHeaderAuth();
    }
}

// ============================================
// EXPORTS
// ============================================

window.ApiService = ApiService;
window.createUserBackend = createUserBackend;
window.loginUserBackend = loginUserBackend;
window.createSession = createSession;
window.getCurrentSession = getCurrentSession;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.testBackendConnection = testBackendConnection;
window.createTestAdminSession = createTestAdminSession;
window.nuclearFixSession = nuclearFixSession;

console.log('✅ api.js loaded successfully');