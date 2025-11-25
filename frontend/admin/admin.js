// Add this at the top of admin.js
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAccess();
});

function checkAdminAccess() {
    const session = getCurrentSession();
    
    console.log('🔍 Checking admin access...');
    console.log('Session:', session);
    
    if (!session) {
        // Not logged in - redirect to login
        showNotification('⚠️ Please login to access admin panel', 'error');
        setTimeout(() => {
            window.location.href = '../main/index.html';
        }, 2000);
        return false;
    }
    
    console.log('👤 User role:', session.role);
    
    if (session.role !== 'admin') {
        // Not an admin - redirect to main page
        showNotification('❌ Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = '../main/index.html';
        }, 2000);
        return false;
    }
    
    console.log('✅ Admin access granted for:', session.username);
    return true;
}

// Update the DOMContentLoaded event in admin.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Admin panel loading...');
    
    if (!checkAdminAccess()) {
        return;
    }
    
    // Only initialize admin features if access is granted
    initializeAdminPanel();
});

/**
 * Test function to manually set admin role (for development only)
 */
function setTestAdmin() {
    const testAdmin = {
        id: 999,
        username: 'testadmin',
        email: 'test@admin.com',
        role: 'admin'
    };
    
    createSession(testAdmin);
    console.log('✅ Test admin session created');
    updateHeaderAuth();
    showNotification('Test admin session created', 'success');
}

// Make it available globally for testing
window.setTestAdmin = setTestAdmin;

function initializeAdminPanel() {
    console.log('🚀 Initializing admin panel...');
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Debug current state
    console.log('=== INITIAL STATE ===');
    debugGames();
    
    // Set today's date for news form
    const today = new Date().toISOString().split('T')[0];
    const newsDateInput = document.getElementById('newsDate');
    if (newsDateInput) {
        newsDateInput.value = today;
    }
    
    // Render initial lists - NOW ASYNC
    console.log('🔄 Rendering initial lists...');
    renderGamesList();
    renderPromosList();
    renderNewsList();
    
    console.log('✅ Admin panel initialization complete');
}

// ============================================
// DATA MANAGEMENT - DATABASE ONLY
// ============================================

/**
 * Gets all games - DATABASE ONLY
 */
async function getAllGames() {
    try {
        const response = await ApiService.getAllGames();
        if (response.success) {
            return response.items || [];
        }
        return [];
    } catch (error) {
        console.log('❌ Failed to load games from database:', error);
        return [];
    }
}

async function addPromo(event) {
    event.preventDefault();
    
    const imageFile = document.getElementById('promoImage').files[0];
    
    if (!imageFile) {
        showNotification('Please upload a promo image', 'error');
        return;
    }
    
    // Check file size (limit to 1MB)
    if (imageFile.size > 5 *1024 * 1024) {
        showNotification('Image too large! Please use images under 5MB.', 'error');
        return;
    }
    
    try {
        // Compress image before converting to base64
        const compressedImageBase64 = await compressImage(imageFile);
        
        console.log('🔄 Adding promo to database...');
        console.log('📏 Original file size:', imageFile.size, 'bytes');
        console.log('📏 Compressed base64 length:', compressedImageBase64.length, 'characters');
        
        // DATABASE ONLY - Add to backend
        const backendResult = await addPromoToBackend({
            image: compressedImageBase64,
            title: 'Promo Image',
            description: 'Uploaded from admin panel'
        });

        console.log('📦 Backend response:', backendResult);

        
        if (backendResult.success) {
            showNotification(`✅ Promo image added to database! ID: ${backendResult.promo_id}`);
            
            // Reset form
            document.getElementById('addPromoForm').reset();
            clearPromoImage();
            
            // Refresh the list
            await renderPromosList();
        } else {
            showNotification(`❌ Failed to add promo: ${backendResult.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error adding promo:', error);
        showNotification('Error adding promo to database', 'error');
    }
}

function compressAndConvertImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // Validate file
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            reject(new Error('File is not an image'));
            return;
        }
        
        // INCREASE FILE SIZE LIMIT: Change from 5MB to 10MB before compression
        if (file.size > 10 * 1024 * 1024) {
            reject(new Error('Image too large (max 10MB)'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.onload = function() {
                try {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Calculate new dimensions - increase max width for better quality
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw image on canvas
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF'; // White background
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 with compression
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    
                    // Verify output
                    if (!compressedBase64 || compressedBase64.length < 100) {
                        reject(new Error('Image compression failed'));
                        return;
                    }
                    
                    console.log('✅ Image compressed:', {
                        originalSize: file.size,
                        originalDimensions: `${img.width}x${img.height}`,
                        newDimensions: `${width}x${height}`,
                        base64Length: compressedBase64.length
                    });
                    
                    resolve(compressedBase64);
                } catch (error) {
                    reject(new Error('Image processing error: ' + error.message));
                }
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}


async function deletePromo(promoId) {
    if (!confirm('Are you sure you want to delete this promo?')) {
        return;
    }
    
    try {
        // Delete from backend
        const result = await deletePromoFromBackend(promoId);
        
        if (result.success) {
            await renderPromosList();
            showNotification(`🗑️ Promo deleted from database!`);
        } else {
            showNotification(`❌ Failed to delete promo: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting promo:', error);
        showNotification('Error deleting promo from database', 'error');
    }
}

/**
 * Saves games - tries backend first, falls back to localStorage
 */
async function saveGames(games) {
    try {
        // For now, we'll only save to localStorage since backend add_item endpoint
        // might need adjustments for your frontend data structure
        localStorage.setItem('games', JSON.stringify(games));
        
        // TODO: Add backend sync here once endpoints are ready
        console.log('✅ Games saved to localStorage. Backend sync needed.');
        
    } catch (error) {
        console.error('Error saving games:', error);
        showNotification('Error saving games', 'error');
    }
}

/**
 * Saves promos to localStorage
 */
function savePromos(promos) {
    try {
        localStorage.setItem('promos', JSON.stringify(promos));
    } catch (error) {
        console.error('Error saving promos:', error);
        showNotification('Error saving promos', 'error');
    }
}

/**
 * Saves news to localStorage
 */
function saveNews(news) {
    try {
        localStorage.setItem('news', JSON.stringify(news));
    } catch (error) {
        console.error('Error saving news:', error);
        showNotification('Error saving news', 'error');
    }
}

/**
 * Add game to backend database
 */
async function addGameToBackend(gameData) {
    try {
        const response = await ApiService.addItem({
            name: gameData.name,
            description: gameData.description,
            price: gameData.price,
            currency: gameData.currency || 'PHP',
            game_platform: gameData.category, // This should match the selected category
            image: gameData.image,
            currency_icon: gameData.currency_icon,
            price_options: gameData.price_options
        });
        
        return response;
    } catch (error) {
        console.error('Backend add game failed:', error);
        throw error;
    }
}

/**
 * Delete game from backend
 */
async function deleteGameFromBackend(gameId) {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/items/${gameId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Backend delete failed:', error);
        throw error;
    }
}

// ============================================
// TAB NAVIGATION
// ============================================

function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        console.log('Hiding tab:', tab.id);
    });
    
    // Remove active class from all buttons
    const allBtns = document.querySelectorAll('.tab-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log('Showing tab:', tabName);
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Refresh content
    if (tabName === 'games') {
        renderGamesList();
    } else if (tabName === 'promos') {
        renderPromosList();
    } else if (tabName === 'news') {
        renderNewsList();
    } else if (tabName === 'transactions') {
        renderAdminTransactions();
    }
}

window.renderAdminTransactions = renderAdminTransactions;

// ============================================
// IMAGE UPLOAD HANDLERS
// ============================================

function fileToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        showNotification('Error reading image file', 'error');
    };
    reader.readAsDataURL(file);
}

// Helper function for file conversion
function fileToBase64Promise(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function previewGameImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be smaller than 5MB', 'error');
        event.target.value = '';
        return;
    }

    fileToBase64(file, function(base64) {
        const previewDiv = document.getElementById('gameImagePreview');
        previewDiv.innerHTML = `
            <img src="${base64}" alt="Game preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
            <div class="preview-info">Image loaded successfully!</div>
            <button type="button" class="remove-image-btn" onclick="clearGameImage()">Remove</button>
        `;
        previewDiv.classList.add('active');
    });
}

function clearGameImage() {
    document.getElementById('gameImage').value = '';
    const previewDiv = document.getElementById('gameImagePreview');
    previewDiv.innerHTML = '';
    previewDiv.classList.remove('active');
}

function previewCurrencyIcon(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be smaller than 5MB', 'error');
        event.target.value = '';
        return;
    }

    fileToBase64(file, function(base64) {
        const previewDiv = document.getElementById('currencyIconPreview');
        previewDiv.innerHTML = `
            <img src="${base64}" alt="Currency icon" style="max-width: 100px; max-height: 100px; border-radius: 8px;">
            <button type="button" class="remove-image-btn" onclick="clearCurrencyIcon()">Remove</button>
        `;
        previewDiv.classList.add('active');
    });
}

function clearCurrencyIcon() {
    document.getElementById('currencyIcon').value = '';
    const previewDiv = document.getElementById('currencyIconPreview');
    previewDiv.innerHTML = '';
    previewDiv.classList.remove('active');
}

function previewPromoImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be smaller than 5MB', 'error');
        event.target.value = '';
        return;
    }

    fileToBase64(file, function(base64) {
        const previewDiv = document.getElementById('promoImagePreview');
        previewDiv.innerHTML = `
            <img src="${base64}" alt="Promo preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
            <div class="preview-info">Image loaded successfully!</div>
            <button type="button" class="remove-image-btn" onclick="clearPromoImage()">Remove</button>
        `;
        previewDiv.classList.add('active');
    });
}

function clearPromoImage() {
    document.getElementById('promoImage').value = '';
    const previewDiv = document.getElementById('promoImagePreview');
    previewDiv.innerHTML = '';
    previewDiv.classList.remove('active');
}

// ============================================
// GAMES MANAGEMENT - DATABASE ONLY
// ============================================

// In the addGame function, add better image logging:
async function addGame(event) {
    event.preventDefault();
    
    const name = document.getElementById('gameName').value.trim();
    const category = document.getElementById('gameCategory').value;
    const description = document.getElementById('gameDescription').value.trim();
    const currency = document.getElementById('gameCurrency').value.trim();
    const imageFile = document.getElementById('gameImage').files[0];
    const currencyIconFile = document.getElementById('currencyIcon').files[0];
    
    // Get price options
    const priceOptions = getPriceOptionsFromForm();
    
    // Validation
    if (!name || !category || !description || !currency) {
        showNotification('❌ Please fill in all required fields', 'error');
        return;
    }
    
    if (!imageFile) {
        showNotification('❌ Please upload a game image', 'error');
        return;
    }
    
    if (!currencyIconFile) {
        showNotification('❌ Please upload a currency icon', 'error');
        return;
    }
    
    if (priceOptions.length === 0) {
        showNotification('❌ Please add at least one price option', 'error');
        return;
    }
    
    try {
        // Show loading notification
        showNotification('⏳ Uploading game... Please wait', 'info');
        
        const mainPrice = priceOptions[0].price;
        
        // Process images with proper compression and validation
        console.log('📸 Processing game image...');
        const gameImageBase64 = await compressAndConvertImage(imageFile, 400, 0.8);
        
        console.log('💰 Processing currency icon...');
        const currencyIconBase64 = await compressAndConvertImage(currencyIconFile, 200, 0.9);
        
        // CRITICAL: Validate base64 images
        if (!gameImageBase64 || !gameImageBase64.startsWith('data:image/')) {
            console.error('❌ Invalid game image format:', gameImageBase64?.substring(0, 100));
            throw new Error('Invalid game image format. Please upload a valid image file.');
        }
        
        if (!currencyIconBase64 || !currencyIconBase64.startsWith('data:image/')) {
            console.error('❌ Invalid currency icon format:', currencyIconBase64?.substring(0, 100));
            throw new Error('Invalid currency icon format. Please upload a valid image file.');
        }
        
        console.log('✅ Images processed successfully');
        console.log('📦 Game image size:', gameImageBase64.length, 'characters');
        console.log('📦 Currency icon size:', currencyIconBase64.length, 'characters');
        
        // Prepare the data to send - USE CONSISTENT PROPERTY NAMES
        const requestData = {
            name: name,
            description: description,
            price: mainPrice,
            currency: currency,
            game_platform: category,
            image: gameImageBase64,  // Use 'image' consistently
            currency_icon: currencyIconBase64,
            price_options: priceOptions
        };
        
        console.log('🚀 Sending to backend...', {
            name: requestData.name,
            hasImage: !!requestData.image,
            imageStartsWith: requestData.image?.substring(0, 50),
            hasCurrencyIcon: !!requestData.currency_icon,
            priceOptionsCount: requestData.price_options.length
        });
        
        const backendResult = await ApiService.addItem(requestData);
        
        console.log('📨 Backend response:', backendResult);
        
        if (backendResult.success) {
            showNotification(`✅ Game "${name}" added successfully!`, 'success');
            
            // Reset form
            document.getElementById('addGameForm').reset();
            clearGameImage();
            clearCurrencyIcon();
            
            // Reset price options
            document.getElementById('priceOptionsContainer').innerHTML = `
                <div class="price-option-row" id="priceOption-1">
                    <input type="number" class="price-option-input" placeholder="Amount (e.g., 100)" step="1" min="1" required>
                    <input type="number" class="price-option-price" placeholder="Price ₱" step="0.01" min="0.01" required>
                    <button type="button" class="btn-remove-option" onclick="removePriceOption(1)">❌</button>
                </div>
            `;
            priceOptionsCount = 1;
            
            // Refresh the list
            await renderGamesList();
        } else {
            showNotification(`❌ Failed to add game: ${backendResult.error}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error adding game:', error);
        showNotification(`❌ Error: ${error.message}`, 'error');
    }
}

async function deleteGame(gameId) {
    if (!confirm('Are you sure you want to delete this game?')) {
        return;
    }
    
    try {
        let games = await getAllGames();
        const gameName = games.find(g => g.id === gameId)?.name;
        
        // Try to delete from backend first
        try {
            await deleteGameFromBackend(gameId);
            console.log('✅ Game deleted from backend');
        } catch (backendError) {
            console.log('🔄 Backend delete failed, deleting from localStorage only');
        }
        
        // Delete from local array
        games = games.filter(g => g.id !== gameId);
        await saveGames(games);
        
        await renderGamesList();
        showNotification(`🗑️ Game "${gameName}" deleted!`);
        
    } catch (error) {
        console.error('Error deleting game:', error);
        showNotification('Error deleting game', 'error');
    }
}

async function editGame(gameId) {
    const games = await getAllGames();
    const game = games.find(g => g.id === gameId);
    
    if (!game) return;
    
    const itemElement = event.target.closest('.item');
    const existingEditForm = itemElement.querySelector('.edit-form');
    
    if (existingEditForm) {
        existingEditForm.remove();
        return;
    }
    
    const currentGameCategory = game.game_platform || game.category || 'General';
    
    const form = document.createElement('div');
    form.className = 'edit-form';
    form.innerHTML = `
        <div class="edit-form-content">
            <div class="edit-form-row">
                <div>
                    <label>Game Name</label>
                    <input type="text" id="editGameName-${gameId}" value="${game.name}">
                </div>
                <div>
                    <label>Category</label>
                    <select id="editGameCategory-${gameId}">
                        <option value="MOBA" ${currentGameCategory === 'MOBA' ? 'selected' : ''}>MOBA</option>
                        <option value="RPG" ${currentGameCategory === 'RPG' ? 'selected' : ''}>RPG</option>
                        <option value="FPS" ${currentGameCategory === 'FPS' ? 'selected' : ''}>FPS</option>
                        <option value="Casual" ${currentGameCategory === 'Casual' ? 'selected' : ''}>Casual</option>
                        <option value="Battle Royale" ${currentGameCategory === 'Battle Royale' ? 'selected' : ''}>Battle Royale</option>
                        <option value="MMORPG" ${currentGameCategory === 'MMORPG' ? 'selected' : ''}>MMORPG</option>
                        <option value="Strategies" ${currentGameCategory === 'Strategies' ? 'selected' : ''}>Strategies</option>
                    </select>
                </div>
            </div>
            <div class="edit-form-row">
                <div>
                    <label>Price ($)</label>
                    <input type="number" id="editGamePrice-${gameId}" step="0.01" value="${game.price}">
                </div>
                <div>
                    <label>Currency Name</label>
                    <input type="text" id="editGameCurrency-${gameId}" value="${game.currency}">
                </div>
            </div>
            <div>
                <label>Description</label>
                <textarea id="editGameDescription-${gameId}">${game.description}</textarea>
            </div>
            <div class="edit-form-actions">
                <button type="button" class="btn-cancel" onclick="this.closest('.edit-form').remove()">Cancel</button>
                <button type="button" class="btn-save" onclick="saveGameEdit(${gameId})">Save Changes</button>
            </div>
        </div>
    `;
    
    itemElement.appendChild(form);
}

async function saveGameEdit(gameId) {
    const games = await getAllGames();
    const gameIndex = games.findIndex(g => g.id === gameId);
    
    if (gameIndex === -1) return;
    
    const name = document.getElementById(`editGameName-${gameId}`).value.trim();
    const category = document.getElementById(`editGameCategory-${gameId}`).value;
    const price = parseFloat(document.getElementById(`editGamePrice-${gameId}`).value);
    const description = document.getElementById(`editGameDescription-${gameId}`).value.trim();
    const currency = document.getElementById(`editGameCurrency-${gameId}`).value.trim();
    
    if (!name || !category || !price || !description || !currency) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (price <= 0) {
        showNotification('Price must be greater than 0', 'error');
        return;
    }
    
    // Preserve the existing image
    const existingImage = games[gameIndex].image;
    games[gameIndex] = { 
        ...games[gameIndex], 
        name, 
        category, 
        price, 
        description, 
        currency,
        image: existingImage // Keep the original image
    };
    await saveGames(games);
    
    await renderGamesList();
    showNotification('✏️ Game updated successfully!');
}

async function renderGamesList() {
    console.log('🔄 Rendering games list...');
    
    const games = await getAllGames();
    const gamesList = document.getElementById('gamesList');
    
    if (!gamesList) {
        console.error('❌ gamesList element not found');
        return;
    }
    
    gamesList.innerHTML = '';
    
    if (games.length === 0) {
        gamesList.innerHTML = `
            <div class="empty-state">
                <p>🎮 No games added yet.</p>
                <p>Add your first game using the form above!</p>
            </div>
        `;
        return;
    }
    
    console.log(`📦 Rendering ${games.length} games`);
    
    games.forEach((game, index) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('data-game-id', game.id);
        
        // FIX: Rename 'category' variable here too
        const imageData = game.image || game.game_image || game.gameImage || null;
        const currencyIconData = game.currency_icon || game.currencyIcon || null;
        const gameCategory = game.game_platform || game.category || 'General';
        
        console.log(`🎮 Game ${index + 1}: ${game.name}`, {
            hasImage: !!imageData,
            imageType: imageData ? (imageData.startsWith('data:image') ? 'base64' : 'unknown') : 'none',
            imageLength: imageData ? imageData.length : 0,
            category: gameCategory
        });
        
        // Create image preview with error handling
        const gameImagePreview = imageData && imageData.startsWith('data:image') ? `
            <img src="${imageData}" 
                 alt="${game.name}" 
                 style="max-width: 200px; max-height: 120px; border-radius: 8px; border: 2px solid var(--border); display: block;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; color: var(--text-secondary); padding: 20px; background: var(--bg-lighter); border-radius: 8px;">
                🖼️ Image failed to load
            </div>
        ` : `
            <div style="color: var(--text-secondary); padding: 20px; background: var(--bg-lighter); border-radius: 8px;">
                🖼️ No game image
            </div>
        `;
        
        const currencyIconPreview = currencyIconData && currencyIconData.startsWith('data:image') ? `
            <img src="${currencyIconData}" 
                 alt="${game.currency}" 
                 style="width: 50px; height: 50px; border-radius: 8px; border: 2px solid var(--border);"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
            <span style="display: none; color: var(--text-secondary);">💰 Icon error</span>
        ` : `
            <div style="color: var(--text-secondary);">💰 No icon</div>
        `;
        
        // Build price options display
        let priceOptionsHTML = '';
        if (game.priceOptions && game.priceOptions.length > 0) {
            priceOptionsHTML = '<div style="margin-top: 12px;"><strong>💰 Price Options:</strong><ul style="margin: 8px 0; padding-left: 20px;">';
            game.priceOptions.forEach(option => {
                priceOptionsHTML += `<li>${option.amount} ${game.currency} - ₱${option.price.toFixed(2)}</li>`;
            });
            priceOptionsHTML += '</ul></div>';
        } else if (game.price) {
            priceOptionsHTML = `<div style="margin-top: 12px; font-weight: 600; color: var(--primary);">💵 Price: ₱${game.price.toFixed(2)}</div>`;
        }
        
        item.innerHTML = `
            <div class="item-header">
                <div class="item-info">
                    <div style="margin-bottom: 12px; text-align: center;">
                        ${gameImagePreview}
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Game ID: ${game.id}</div>
                    </div>
                    <div class="item-title">${game.name}</div>
                    <span class="item-badge">${game.game_platform || game.category || 'General'}</span>
                    <div class="item-subtitle">
                        <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
                            <span>Currency Icon:</span>
                            ${currencyIconPreview}
                            <span>${game.currency}</span>
                        </div>
                    </div>
                    <div class="item-description">${game.description}</div>
                    ${priceOptionsHTML}
                </div>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteGame(${game.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
        
        gamesList.appendChild(item);
    });
    
    console.log('✅ Games list rendered successfully');
}

/**
 * Compress image before uploading
 */
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with compression
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// PROMOS MANAGEMENT - DATABASE ONLY
// ============================================

/**
 * Gets all promos - DATABASE ONLY
 */
async function getAllPromos() {
    try {
        const response = await ApiService.getAllPromos();
        if (response.success) {
            return response.promos || [];
        }
        return [];
    } catch (error) {
        console.log('❌ Failed to load promos from database:', error);
        return [];
    }
}

/**
 * Add promo to backend database
 */
async function addPromoToBackend(promoData) {
    try {
        const response = await ApiService.addPromo(promoData);
        return response;
    } catch (error) {
        console.error('Backend add promo failed:', error);
        throw error;
    }
}

/**
 * Delete promo from backend
 */
async function deletePromoFromBackend(promoId) {
    try {
        const response = await ApiService.deletePromo(promoId);
        return response;
    } catch (error) {
        console.error('Backend delete promo failed:', error);
        throw error;
    }
}

/**
 * Saves promos to database (for compatibility)
 */
async function savePromos(promos) {
    console.log('✅ Promos are now saved to database directly');
    // Individual promos are saved via API calls, this is just for compatibility
}

async function renderPromosList() {
    try {
        const promos = await getAllPromos();
        const promosList = document.getElementById('promosList');
        
        if (!promosList) {
            console.error('❌ Promos list element not found');
            return;
        }
        
        promosList.innerHTML = '';
        
        console.log('📦 Promos loaded:', promos);
        
        if (promos.length === 0) {
            promosList.innerHTML = `
                <div class="empty-state">
                    <p>🎁 No promos added yet.</p>
                    <p>Add your first promo image using the form above!</p>
                </div>
            `;
            return;
        }
        
        promos.forEach(promo => {
            const item = document.createElement('div');
            item.className = 'item';
            
            const imagePreview = promo.image ? `
                <div style="text-align: center;">
                    <img src="${promo.image}" alt="Promo image" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid var(--border); margin-bottom: 12px;">
                    <div style="font-size: 12px; color: var(--text-secondary);">Promo ID: ${promo.id}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Created: ${new Date(promo.created_at).toLocaleDateString()}</div>
                </div>
            ` : '<div style="color: var(--text-secondary);">No image</div>';
            
            item.innerHTML = `
                <div class="item-header">
                    <div class="item-info">
                        ${imagePreview}
                    </div>
                    <div class="item-actions">
                        <button class="btn-delete" onclick="deletePromo(${promo.id})">🗑️ Delete</button>
                    </div>
                </div>
            `;
            promosList.appendChild(item);
        });
        
        console.log(`✅ Displayed ${promos.length} promos`);
        
    } catch (error) {
        console.error('❌ Error rendering promos list:', error);
        const promosList = document.getElementById('promosList');
        if (promosList) {
            promosList.innerHTML = `
                <div class="error-message">
                    ❌ Failed to load promos: ${error.message}
                </div>
            `;
        }
    }
}

// ============================================
// NEWS MANAGEMENT - DATABASE
// ============================================

/**
 * Gets all news - DATABASE
 */
async function getAllNews() {
    try {
        const response = await fetch('http://localhost:5000/api/news');
        const data = await response.json();
        
        if (data.success) {
            return data.news || [];
        }
        return [];
    } catch (error) {
        console.log('❌ Failed to load news from database:', error);
        return [];
    }
}

/**
 * Add news to database
 */
async function addNews(event) {
    event.preventDefault();
    
    const title = document.getElementById('newsTitle').value.trim();
    const date = document.getElementById('newsDate').value;
    const icon = document.getElementById('newsIcon').value.trim();
    const description = document.getElementById('newsDescription').value.trim();
    
    if (!title || !date || !icon || !description) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description,
                date: date,
                icon: icon
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ News "${title}" added successfully!`);
            
            // Reset form
            document.getElementById('addNewsForm').reset();
            
            // Refresh the list
            await renderNewsList();
        } else {
            showNotification(`❌ Failed to add news: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error adding news:', error);
        showNotification('Error adding news to database', 'error');
    }
}

/**
 * Delete news from database
 */
async function deleteNews(newsId) {
    if (!confirm('Are you sure you want to delete this news?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/api/news/${newsId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            await renderNewsList();
            showNotification(`🗑️ News deleted from database!`);
        } else {
            showNotification(`❌ Failed to delete news: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting news:', error);
        showNotification('Error deleting news from database', 'error');
    }
}

/**
 * Edit news - show edit form
 */
async function editNews(newsId) {
    const news = await getAllNews();
    const newsItem = news.find(n => n.id === newsId);
    
    if (!newsItem) return;
    
    const itemElement = event.target.closest('.item');
    const existingEditForm = itemElement.querySelector('.edit-form');
    
    if (existingEditForm) {
        existingEditForm.remove();
        return;
    }
    
    const form = document.createElement('div');
    form.className = 'edit-form';
    form.innerHTML = `
        <div class="edit-form-content">
            <div class="edit-form-row">
                <div>
                    <label>Title</label>
                    <input type="text" id="editNewsTitle-${newsId}" value="${newsItem.title}">
                </div>
                <div>
                    <label>Date</label>
                    <input type="date" id="editNewsDate-${newsId}" value="${newsItem.date}">
                </div>
            </div>
            <div class="edit-form-row">
                <div>
                    <label>Icon/Emoji</label>
                    <input type="text" id="editNewsIcon-${newsId}" value="${newsItem.icon}" maxlength="2">
                </div>
            </div>
            <div>
                <label>Description</label>
                <textarea id="editNewsDescription-${newsId}">${newsItem.description}</textarea>
            </div>
            <div class="edit-form-actions">
                <button type="button" class="btn-cancel" onclick="this.closest('.edit-form').remove()">Cancel</button>
                <button type="button" class="btn-save" onclick="saveNewsEdit(${newsId})">Save Changes</button>
            </div>
        </div>
    `;
    
    itemElement.appendChild(form);
}

/**
 * Save news edit to database
 */
async function saveNewsEdit(newsId) {
    const title = document.getElementById(`editNewsTitle-${newsId}`).value.trim();
    const date = document.getElementById(`editNewsDate-${newsId}`).value;
    const icon = document.getElementById(`editNewsIcon-${newsId}`).value.trim();
    const description = document.getElementById(`editNewsDescription-${newsId}`).value.trim();
    
    if (!title || !date || !icon || !description) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/api/news/${newsId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description,
                date: date,
                icon: icon
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await renderNewsList();
            showNotification('✏️ News updated successfully!');
        } else {
            showNotification(`❌ Failed to update news: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error updating news:', error);
        showNotification('Error updating news in database', 'error');
    }
}

/**
 * Render news list
 */
async function renderNewsList() {
    const news = await getAllNews();
    const newsList = document.getElementById('newsList');
    
    if (!newsList) return;
    
    newsList.innerHTML = '';
    
    if (news.length === 0) {
        newsList.innerHTML = `
            <div class="empty-state">
                <p>No news added yet. Share your first update!</p>
            </div>
        `;
        return;
    }
    
    news.forEach(newsItem => {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `
            <div class="item-header">
                <div class="item-info">
                    <div class="item-title">${newsItem.icon} ${newsItem.title}</div>
                    <div class="item-subtitle">📅 ${newsItem.date}</div>
                    <div class="item-description">${newsItem.description}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="editNews(${newsItem.id})">✏️ Edit</button>
                    <button class="btn-delete" onclick="deleteNews(${newsItem.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
        newsList.appendChild(item);
    });
}

// ============================================
// UTILITIES
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function goToMain() {
    window.location.href = '../main/index.html';
}

// ============================================
// PRICE OPTIONS MANAGEMENT
// ============================================

let priceOptionsCount = 1;

function addPriceOption() {
    priceOptionsCount++;
    const container = document.getElementById('priceOptionsContainer');
    
    const priceOptionDiv = document.createElement('div');
    priceOptionDiv.className = 'price-option-row';
    priceOptionDiv.id = `priceOption-${priceOptionsCount}`;
    priceOptionDiv.innerHTML = `
        <input type="number" class="price-option-input" placeholder="Amount (e.g., 100)" step="1" min="1" required>
        <input type="number" class="price-option-price" placeholder="Price ₱" step="0.01" min="0.01" required>
        <button type="button" class="btn-remove-option" onclick="removePriceOption(${priceOptionsCount})">❌</button>
    `;
    
    container.appendChild(priceOptionDiv);
}

function removePriceOption(optionId) {
    const optionElement = document.getElementById(`priceOption-${optionId}`);
    if (optionElement) {
        optionElement.remove();
    }
}

function getPriceOptionsFromForm() {
    const priceOptions = [];
    const rows = document.querySelectorAll('.price-option-row');
    
    rows.forEach(row => {
        const amountInput = row.querySelector('.price-option-input');
        const priceInput = row.querySelector('.price-option-price');
        
        if (amountInput && priceInput && amountInput.value && priceInput.value) {
            priceOptions.push({
                amount: parseInt(amountInput.value),
                price: parseFloat(priceInput.value)
            });
        }
    });
    
    return priceOptions;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGameIcon(gameName) {
    const iconMap = {
        'mobile': '🎮',
        'pubg': '🔫',
        'genshin': '⭐',
        'league': '👑',
        'honor': '⚔️',
        'candy': '🍬',
        'valorant': '🎯',
        'default': '🎁'
    };
    
    const lowerName = gameName.toLowerCase();
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }
    
    return iconMap.default;
}

function debugGames() {
    getAllGames().then(games => {
        console.log('=== DEBUG GAMES ===');
        console.log('Games:', games);
        console.log('Number of games:', games.length);
        games.forEach((game, index) => {
            console.log(`Game ${index + 1}:`, game);
        });
        console.log('====================');
    });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Admin panel loaded - Starting initialization...');
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Debug current state
    console.log('=== INITIAL STATE ===');
    debugGames();
    
    // Set today's date for news form
    const today = new Date().toISOString().split('T')[0];
    const newsDateInput = document.getElementById('newsDate');
    if (newsDateInput) {
        newsDateInput.value = today;
    }
    
    // Render initial lists - NOW ASYNC
    console.log('🔄 Rendering initial lists...');
    await renderGamesList();
    await renderPromosList();
    await renderNewsList();
    
    console.log('✅ Admin panel initialization complete');
});

// ============================================
// ADMIN BACKEND INTEGRATION
// ============================================

async function syncAdminData() {
    try {
        const response = await ApiService.getAllGames();
        if (response.success) {
            // Transform and save to localStorage for admin panel
            const games = response.items.map(item => ({
                id: item.id,
                name: item.name,
                category: item.game_platform || 'General',
                price: item.price,
                description: item.description,
                currency: item.currency,
                icon: getGameIcon(item.name)
            }));
            
            localStorage.setItem('games', JSON.stringify(games));
            renderGamesList();
            showNotification('✅ Admin data synced with backend');
        }
    } catch (error) {
        console.error('Admin sync failed:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    syncAdminData();
}); 

// ============================================
// ADMIN TRANSACTIONS MANAGEMENT - COMPLETE VERSION
// ============================================

class TransactionManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
    }

    async getAllTransactions() {
        try {
            console.log('📡 [ADMIN] Fetching ALL transactions from /api/transactions/all...');
            const response = await fetch(`${this.apiBaseUrl}/transactions/all`);
            
            console.log('📡 [ADMIN] Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 [ADMIN] Full response from /api/transactions/all:', data);
            
            if (data.success) {
                console.log(`✅ [ADMIN] Success! Loaded ${data.transactions ? data.transactions.length : 0} transactions from ALL users`);
                if (data.transactions && data.transactions.length > 0) {
                    console.log('📊 [ADMIN] Sample transaction:', data.transactions[0]);
                }
                return data.transactions || [];
            } else {
                console.log('❌ [ADMIN] API returned error:', data.error);
                return [];
            }
        } catch (error) {
            console.error('❌ [ADMIN] Error fetching all transactions:', error);
            return [];
        }
    }

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
}

// Global instance
const transactionManager = new TransactionManager();

// ============================================
// TRANSACTION HELPER FUNCTIONS
// ============================================

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

/**
 * Format date for admin view
 */
function formatAdminTransactionDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

/**
 * Update admin transaction statistics
 */
function updateAdminTransactionStats(transactions) {
    const statsContainer = document.getElementById('transactionsStats');
    if (!statsContainer) {
        console.log('❌ Stats container not found');
        return;
    }

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.final_price || 0), 0);
    const completedTransactions = transactions.filter(t => t.status === 'completed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const uniqueUsers = new Set(transactions.map(t => t.user_id)).size;

    console.log('📊 Calculating stats:', {
        totalTransactions: transactions.length,
        totalRevenue,
        completedTransactions,
        uniqueUsers
    });

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${transactions.length}</div>
            <div class="stat-label">Total Transactions</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">₱${totalRevenue.toFixed(2)}</div>
            <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${uniqueUsers}</div>
            <div class="stat-label">Unique Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${completedTransactions}</div>
            <div class="stat-label">Completed</div>
        </div>
    `;
}

/**
 * Render admin transactions list
 */
function renderAdminTransactionsList(transactions, container) {
    console.log('🎨 Rendering transactions list with', transactions.length, 'transactions');
    
    try {
        container.innerHTML = transactions.map(transaction => {
            // Safely handle missing data with fallbacks
            const gameName = transaction.item_name || `Game #${transaction.item_id || 'N/A'}`;
            const platform = transaction.game_platform || 'General';
            const currency = transaction.currency || 'PHP';
            const username = transaction.user_username || `User #${transaction.user_id || 'N/A'}`;
            const email = transaction.user_email || 'No email';
            const finalPrice = transaction.final_price || 0;
            const status = transaction.status || 'completed';
            const userInitial = username.charAt(0).toUpperCase();
            
            return `
            <div class="transaction-card admin-transaction">
                <div class="transaction-header">
                    <div class="transaction-main-info">
                        <div class="transaction-game">${gameName}</div>
                        <div class="transaction-user">
                            <div class="user-avatar">${userInitial}</div>
                            <div class="user-info">
                                <span class="user-name">${username}</span>
                                <span class="user-email">${email}</span>
                                <span class="user-id">User ID: ${transaction.user_id}</span>
                            </div>
                        </div>
                    </div>
                    <div class="transaction-amount">
                        <span class="currency-symbol">${currency}</span>${finalPrice.toFixed(2)}
                    </div>
                </div>
                
                <div class="transaction-details">
                    <div class="transaction-detail-group">
                        <div class="detail-item">
                            <span class="detail-label">Order Number</span>
                            <span class="detail-value order-number">#${(transaction.id || 0).toString().padStart(6, '0')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Item ID</span>
                            <span class="detail-value">${transaction.item_id || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Platform</span>
                            <span class="detail-value platform-badge">🎮 ${platform}</span>
                        </div>
                    </div>
                    
                    <div class="transaction-detail-group">
                        <div class="detail-item">
                            <span class="detail-label">Quantity</span>
                            <span class="detail-value">${transaction.quantity || 1}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date & Time</span>
                            <span class="detail-value">${formatAdminTransactionDate(transaction.created_at)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value">
                                <span class="transaction-status ${getStatusBadgeClass(status)}">
                                    ${status}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        console.log(`✅ Successfully rendered ${transactions.length} transactions in UI`);
        
    } catch (error) {
        console.error('❌ Error rendering transactions list:', error);
        container.innerHTML = `
            <div class="error-transactions">
                <div class="error-icon">❌</div>
                <h3>Error Rendering Transactions</h3>
                <p>There was an error displaying the transactions.</p>
                <button class="btn-retry" onclick="renderAdminTransactions()">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

/**
 * Load and render all transactions for admin view
 */
async function renderAdminTransactions() {
    console.log('🔄 Loading ALL transactions for admin view...');
    
    const session = getCurrentSession();
    if (!session || session.role !== 'admin') {
        showNotification('❌ Access denied. Admin privileges required.', 'error');
        return;
    }

    const adminTransactionsList = document.getElementById('adminTransactionsList');
    const transactionsCount = document.getElementById('transactionsCount');
    
    if (!adminTransactionsList) {
        console.error('❌ Admin transactions list element not found');
        return;
    }

    // Show loading state
    adminTransactionsList.innerHTML = `
        <div class="loading-transactions">
            <div class="loading-spinner"></div>
            <p>Loading all transactions from all users...</p>
        </div>
    `;

    try {
        const transactions = await transactionManager.getAllTransactions();
        
        console.log('📊 ALL transactions loaded for admin:', transactions);
        
        if (!transactions || transactions.length === 0) {
            console.log('ℹ️ No transactions found in system');
            adminTransactionsList.innerHTML = `
                <div class="empty-transactions">
                    <div class="empty-transactions-icon">📊</div>
                    <h3>No Transactions in System</h3>
                    <p>No transactions have been made by any users yet.</p>
                </div>
            `;
            if (transactionsCount) {
                transactionsCount.textContent = '0';
            }
            updateAdminTransactionStats([]);
            return;
        }

        // Update count
        if (transactionsCount) {
            transactionsCount.textContent = transactions.length;
            console.log(`📊 Setting transaction count to: ${transactions.length}`);
        }

        // Update statistics
        updateAdminTransactionStats(transactions);

        // Render transactions
        renderAdminTransactionsList(transactions, adminTransactionsList);
        
        console.log(`✅ Admin view: Successfully rendered ${transactions.length} transactions from all users`);

    } catch (error) {
        console.error('❌ Error loading admin transactions:', error);
        adminTransactionsList.innerHTML = `
            <div class="error-transactions">
                <div class="error-icon">❌</div>
                <h3>Failed to Load Transactions</h3>
                <p>There was an error loading transactions. Please try again later.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <button class="btn-retry" onclick="renderAdminTransactions()">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

/**
 * Load admin transactions (alias for renderAdminTransactions)
 */
function loadAdminTransactions() {
    renderAdminTransactions();
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

window.transactionManager = transactionManager;
window.renderAdminTransactions = renderAdminTransactions;
window.loadAdminTransactions = loadAdminTransactions;
window.getStatusBadgeClass = getStatusBadgeClass;
window.formatAdminTransactionDate = formatAdminTransactionDate;
window.updateAdminTransactionStats = updateAdminTransactionStats;
window.renderAdminTransactionsList = renderAdminTransactionsList;

// ============================================
// YOUR EXISTING ADMIN.JS CODE CONTINUES BELOW
// ============================================

// Add this to your existing showTab function:
function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        console.log('Hiding tab:', tab.id);
    });
    
    // Remove active class from all buttons
    const allBtns = document.querySelectorAll('.tab-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log('Showing tab:', tabName);
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Refresh content - ADD TRANSACTIONS HERE
    if (tabName === 'games') {
        console.log('Rendering games list...');
        renderGamesList();
    } else if (tabName === 'promos') {
        console.log('Rendering promos list...');
        renderPromosList();
    } else if (tabName === 'news') {
        console.log('Rendering news list...');
        renderNewsList();
    } else if (tabName === 'transactions') {
        console.log('Rendering admin transactions...');
        renderAdminTransactions(); // ← ADD THIS LINE
    } else if (tabName === 'localstorage') {
        console.log('Showing localStorage...');
        // Your existing localStorage code
    }
}

// Make sure showTab is available globally if it's not already
window.showTab = showTab;