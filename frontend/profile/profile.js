// ============================================
// PROFILE PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page loading...');
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        showNotification('⚠️ Please login to view your profile', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Load profile data
    loadProfileData();
    loadTransactionHistory();
    
    // Update header
    updateHeaderAuth();
});

// ============================================
// PROFILE DATA LOADING
// ============================================

function loadProfileData() {
    const session = getCurrentSession();
    
    if (!session) {
        console.error('❌ No session found');
        return;
    }
    
    console.log('👤 Loading profile for:', session.username);
    
    // Update profile header
    const userInitial = session.username.charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = userInitial;
    document.getElementById('profileUsername').textContent = session.username;
    document.getElementById('profileEmail').textContent = session.email;
    
    // Update account information
    document.getElementById('infoUsername').textContent = session.username;
    document.getElementById('infoEmail').textContent = session.email;
    
    // Set account role badge
    const roleBadge = document.getElementById('accountRole');
    if (session.role === 'admin') {
        roleBadge.textContent = 'Admin';
        roleBadge.classList.add('admin');
    } else {
        roleBadge.textContent = 'User';
    }
    
    // Format member since date
    const loginDate = new Date(session.loginTime);
    const memberSince = loginDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('infoMemberSince').textContent = memberSince;
    document.getElementById('memberSince').textContent = loginDate.getFullYear();
    
    // Load transaction statistics FROM DATABASE
    loadTransactionStats(session.userId);
}

// ============================================
// TRANSACTION STATISTICS - FROM DATABASE
// ============================================

async function loadTransactionStats(userId) {
    try {
        // Get transactions from database
        const transactions = await transactionManager.getUserTransactions(userId);
        
        // Calculate statistics
        const totalOrders = transactions.length;
        const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.final_price, 0);
        
        // Update UI
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalSpent').textContent = `₱${totalSpent.toFixed(2)}`;
        
        console.log(`📊 Stats: ${totalOrders} orders, ₱${totalSpent.toFixed(2)} spent`);
        
    } catch (error) {
        console.error('❌ Error loading transaction stats:', error);
        // Set default values if there's an error
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalSpent').textContent = '₱0.00';
    }
}

// ============================================
// TRANSACTION HISTORY - FROM DATABASE
// ============================================

async function loadTransactionHistory() {
    const session = getCurrentSession();
    if (!session) {
        console.error('❌ No session found for loading transactions');
        return;
    }

    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) {
        console.error('❌ Transactions list element not found');
        return;
    }
    
    // Show loading state
    transactionsList.innerHTML = `
        <div class="loading-transactions">
            <div class="loading-spinner"></div>
            <p>Loading transactions...</p>
        </div>
    `;

    try {
        console.log(`🔍 Loading transactions for user ID: ${session.userId}`);
        const transactions = await transactionManager.getUserTransactions(session.userId);
        
        console.log('📊 Transactions data received:', transactions);
        
        if (!transactions || transactions.length === 0) {
            console.log('ℹ️ No transactions found for user');
            transactionsList.innerHTML = `
                <div class="empty-transactions">
                    <div class="empty-transactions-icon">🛒</div>
                    <h3>No Transactions Yet</h3>
                    <p>You haven't made any purchases yet. Start shopping to see your transaction history here!</p>
                    <button class="btn-start-shopping" onclick="window.location.href='index.html#shop'">
                        🎮 Start Shopping
                    </button>
                </div>
            `;
            return;
        }
        
        console.log(`🎯 Rendering ${transactions.length} transactions`);
        // Render transactions
        renderTransactionsList(transactions, transactionsList);
        
    } catch (error) {
        console.error('❌ Error loading transaction history:', error);
        transactionsList.innerHTML = `
            <div class="error-transactions">
                <div class="error-icon">❌</div>
                <h3>Failed to Load Transactions</h3>
                <p>There was an error loading your transaction history. Please try again later.</p>
                <button class="btn-retry" onclick="loadTransactionHistory()">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

/**
 * Render transactions list
 */
function renderTransactionsList(transactions, container) {
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-card">
            <div class="transaction-header">
                <div class="transaction-main-info">
                    <div class="transaction-game">🎮 ${transaction.item_name}</div>
                    <div class="transaction-platform">${transaction.game_platform || 'General'}</div>
                </div>
                <div class="transaction-amount">${transaction.currency} ${transaction.final_price.toFixed(2)}</div>
            </div>
            
            <div class="transaction-details">
                <div class="transaction-detail-row">
                    <div class="transaction-detail">
                        <div class="detail-label">Order Number</div>
                        <div class="detail-value">#${transaction.id.toString().padStart(6, '0')}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="detail-label">Quantity</div>
                        <div class="detail-value">${transaction.quantity}</div>
                    </div>
                </div>
                
                <div class="transaction-detail-row">
                    <div class="transaction-detail">
                        <div class="detail-label">Date & Time</div>
                        <div class="detail-value">${formatTransactionDate(transaction.created_at)}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">
                            <span class="transaction-status ${getStatusBadgeClass(transaction.status)}">
                                ${transaction.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Format transaction date
 */
function formatTransactionDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
    const statusClasses = {
        'completed': 'status-completed',
        'pending': 'status-pending',
        'failed': 'status-failed',
        'refunded': 'status-refunded'
    };
    return statusClasses[status] || 'status-pending';
}

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================

function logoutFromProfile() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currencyhub_session');
        showNotification('✅ Logged out successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// ============================================
// NOTIFICATIONS (Reuse from main script)
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' 
        ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
        : type === 'info'
        ? 'linear-gradient(135deg, #667eea, #764ba2)'
        : 'linear-gradient(135deg, #10b981, #059669)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        z-index: 5000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        max-width: 350px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function refreshProfileData() {
    const session = getCurrentSession();
    if (session) {
        loadProfileData();
        loadTransactionHistory();
    }
}

// Make functions available globally
window.loadTransactionHistory = loadTransactionHistory;
window.logoutFromProfile = logoutFromProfile;
window.refreshProfileData = refreshProfileData;