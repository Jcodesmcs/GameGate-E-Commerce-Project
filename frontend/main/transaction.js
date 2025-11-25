// ============================================
// TRANSACTIONS MANAGEMENT
// ============================================

class TransactionManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
    }

    /**
     * Get user's transactions
     */
    async getUserTransactions(userId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/transactions/user/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.transactions || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching user transactions:', error);
            return [];
        }
    }

    /**
     * Get all transactions (admin only)
     */
    async getAllTransactions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/transactions/all`);
            const data = await response.json();
            
            if (data.success) {
                return data.transactions || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching all transactions:', error);
            return [];
        }
    }

    /**
     * Create a new transaction
     */
    async createTransaction(transactionData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/transactions/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating transaction:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Format transaction date
     */
    formatTransactionDate(dateString) {
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
    getStatusBadgeClass(status) {
        const statusClasses = {
            'completed': 'status-completed',
            'pending': 'status-pending',
            'failed': 'status-failed',
            'refunded': 'status-refunded'
        };
        return statusClasses[status] || 'status-pending';
    }
}

// Global instance
const transactionManager = new TransactionManager();

// ============================================
// TRANSACTIONS UI RENDERING
// ============================================

/**
 * Render user transactions in profile
 */
async function renderUserTransactions() {
    const session = getCurrentSession();
    if (!session) return;

    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;

    // Show loading state
    transactionsList.innerHTML = `
        <div class="loading-transactions">
            <div class="loading-spinner"></div>
            <p>Loading transactions...</p>
        </div>
    `;

    try {
        const transactions = await transactionManager.getUserTransactions(session.userId);
        
        if (transactions.length === 0) {
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

        transactionsList.innerHTML = transactions.map(transaction => `
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
                            <div class="detail-value">${transactionManager.formatTransactionDate(transaction.created_at)}</div>
                        </div>
                        <div class="transaction-detail">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">
                                <span class="transaction-status ${transactionManager.getStatusBadgeClass(transaction.status)}">
                                    ${transaction.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error rendering user transactions:', error);
        transactionsList.innerHTML = `
            <div class="error-transactions">
                <div class="error-icon">❌</div>
                <h3>Failed to Load Transactions</h3>
                <p>There was an error loading your transaction history. Please try again later.</p>
                <button class="btn-retry" onclick="renderUserTransactions()">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

/**
 * Render admin transactions view
 */
async function renderAdminTransactions() {
    const session = getCurrentSession();
    if (!session || session.role !== 'admin') {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }

    const adminTransactionsList = document.getElementById('adminTransactionsList');
    if (!adminTransactionsList) return;

    // Show loading state
    adminTransactionsList.innerHTML = `
        <div class="loading-transactions">
            <div class="loading-spinner"></div>
            <p>Loading all transactions...</p>
        </div>
    `;

    try {
        const transactions = await transactionManager.getAllTransactions();
        
        if (transactions.length === 0) {
            adminTransactionsList.innerHTML = `
                <div class="empty-transactions">
                    <div class="empty-transactions-icon">📊</div>
                    <h3>No Transactions</h3>
                    <p>No transactions have been made yet.</p>
                </div>
            `;
            return;
        }

        // Calculate statistics
        const totalRevenue = transactions.reduce((sum, t) => sum + t.final_price, 0);
        const completedTransactions = transactions.filter(t => t.status === 'completed').length;
        
        // Update statistics
        const statsElement = document.getElementById('transactionsStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${transactions.length}</div>
                    <div class="stat-label">Total Transactions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">₱${totalRevenue.toFixed(2)}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${completedTransactions}</div>
                    <div class="stat-label">Completed</div>
                </div>
            `;
        }

        adminTransactionsList.innerHTML = transactions.map(transaction => `
            <div class="transaction-card admin-transaction">
                <div class="transaction-header">
                    <div class="transaction-main-info">
                        <div class="transaction-game">🎮 ${transaction.item_name}</div>
                        <div class="transaction-user">👤 ${transaction.user_username} (${transaction.user_email})</div>
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
                            <div class="detail-label">User ID</div>
                            <div class="detail-value">${transaction.user_id}</div>
                        </div>
                    </div>
                    
                    <div class="transaction-detail-row">
                        <div class="transaction-detail">
                            <div class="detail-label">Platform</div>
                            <div class="detail-value">${transaction.game_platform || 'General'}</div>
                        </div>
                        <div class="transaction-detail">
                            <div class="detail-label">Quantity</div>
                            <div class="detail-value">${transaction.quantity}</div>
                        </div>
                    </div>
                    
                    <div class="transaction-detail-row">
                        <div class="transaction-detail">
                            <div class="detail-label">Date & Time</div>
                            <div class="detail-value">${transactionManager.formatTransactionDate(transaction.created_at)}</div>
                        </div>
                        <div class="transaction-detail">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">
                                <span class="transaction-status ${transactionManager.getStatusBadgeClass(transaction.status)}">
                                    ${transaction.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error rendering admin transactions:', error);
        adminTransactionsList.innerHTML = `
            <div class="error-transactions">
                <div class="error-icon">❌</div>
                <h3>Failed to Load Transactions</h3>
                <p>There was an error loading transactions. Please try again later.</p>
                <button class="btn-retry" onclick="renderAdminTransactions()">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

/**
 * Record a transaction after purchase
 */
async function recordTransaction(gameId, packageData, userDetails) {
    const session = getCurrentSession();
    if (!session) {
        console.error('No user session found for transaction');
        return false;
    }

    try {
        const transactionData = {
            user_id: session.userId,
            item_id: gameId,
            quantity: 1, // You can modify this based on package quantity
            // Add any additional data needed
        };

        const result = await transactionManager.createTransaction(transactionData);
        
        if (result.success) {
            console.log('Transaction recorded successfully:', result.transaction);
            
            // Also save to localStorage for immediate UI update
            saveTransactionToLocalStorage({
                orderNumber: generateOrderNumber(),
                game: purchaseFlowState.selectedGame.name,
                package: packageData.amount,
                price: packageData.price,
                userId: userDetails.userId,
                payment: purchaseFlowState.selectedPayment,
                date: new Date().toISOString(),
                status: 'completed'
            });
            
            return true;
        } else {
            console.error('Failed to record transaction:', result.error);
            return false;
        }
    } catch (error) {
        console.error('Error recording transaction:', error);
        return false;
    }
}

/**
 * Save transaction to localStorage for immediate UI update
 */
function saveTransactionToLocalStorage(transaction) {
    try {
        let transactions = JSON.parse(localStorage.getItem('user_orders') || '[]');
        transactions.unshift(transaction);
        localStorage.setItem('user_orders', JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error('Error saving transaction to localStorage:', error);
        return false;
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Make functions available globally
window.renderUserTransactions = renderUserTransactions;
window.renderAdminTransactions = renderAdminTransactions;
window.recordTransaction = recordTransaction;
window.transactionManager = transactionManager;