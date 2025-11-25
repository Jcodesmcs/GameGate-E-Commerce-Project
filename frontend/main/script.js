// ============================================
// AUTHENTICATION SYSTEM
// ============================================

/**
 * Simple hash function for passwords (basic frontend security)
 * NOTE: Your Python backend should handle real security
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return btoa(hash.toString());
}

/**
 * Checks if email already exists
 */
function emailExists(email) {
    const users = getAllUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Checks if username already exists
 */
function usernameExists(username) {
    const users = getAllUsers();
    return users.some(user => user.username.toLowerCase() === username.toLowerCase());
}

// Add these functions to script.js if missing
async function createUser(username, email, password) {
    console.log('🎯 CREATE USER CALLED - Using DATABASE');
    
    // Frontend validation
    if (!username || username.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
    }
    if (!email || !email.includes('@')) {
        return { success: false, message: 'Please enter a valid email' };
    }
    if (!password || password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }

    const result = await createUserBackend(username, email, password);
    
    if (result.success) {
        return {
            success: true,
            message: result.message || 'Account created successfully!',
            user: result.user
        };
    } else {
        return {
            success: false,
            message: result.error || 'Registration failed'
        };
    }
}

// In the loginUser function, ensure role is included
async function loginUser(email, password) {
    console.log('🎯 LOGIN USER CALLED - Using DATABASE');
    
    if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
    }

    const result = await loginUserBackend(email, password);
    
    console.log('🔍 Login backend response:', result);
    
    if (result.success) {
        // Ensure role is included in the user object
        const userWithRole = {
            ...result.user,
            role: result.user.role || 'user' // Default to 'user' if role not provided
        };
        
        return { 
            success: true, 
            message: result.message || 'Login successful!', 
            user: userWithRole
        };
    } else {
        return {
            success: false, 
            message: result.error || 'Invalid credentials'
        };
    }
}

/**
 * Creates user session with role
 */
function createSession(user, rememberMe = false) {
    console.log('💾 Creating session with user:', user);
    
    const session = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user', // CRITICAL: Include role with default fallback
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };
    
    localStorage.setItem('currencyhub_session', JSON.stringify(session));
    
    // Verify session was created correctly
    const verifySession = getCurrentSession();
    console.log('✅ Session created with role:', verifySession?.role);
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
 * Logs out current user
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currencyhub_session');
        showNotification('Logged out successfully!', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

/**
 * Opens the authentication modal
 */
function openAuthModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}
/**
 * 
/*
 * Closes the authentication modal
 */
function closeAuthModal() {
    const authModal = document.getElementById('loginModal');
    if (authModal) {
        authModal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    
    // Only clear forms if they exist
    const loginFormModal = document.getElementById('loginFormModal');
    const signupFormModal = document.getElementById('signupFormModal');
    
    if (loginFormModal) {
        loginFormModal.reset();
    }
    if (signupFormModal) {
        signupFormModal.reset();
    }
    
    // Clear error messages if they exist
    const loginErrorModal = document.getElementById('loginErrorModal');
    const signupErrorModal = document.getElementById('signupErrorModal');
    const signupSuccessModal = document.getElementById('signupSuccessModal');
    
    if (loginErrorModal) {
        loginErrorModal.classList.remove('show');
    }
    if (signupErrorModal) {
        signupErrorModal.classList.remove('show');
    }
    if (signupSuccessModal) {
        signupSuccessModal.classList.remove('show');
    }
    
    console.log('✅ Auth modal closed');
}

/**
 * Switches between login and signup tabs
 */
function switchAuthTab(tab) {
    const loginContainer = document.getElementById('loginFormContainer');
    const signupContainer = document.getElementById('signupFormContainer');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginContainer.classList.add('active');
        signupContainer.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        signupContainer.classList.add('active');
        loginContainer.classList.remove('active');
        tabs[1].classList.add('active');
    }
}

/**
 * Toggles password visibility
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function updateHeaderAuth() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) {
        console.error('❌ Header right element not found');
        return;
    }

    headerRight.innerHTML = '';

    const session = getCurrentSession();
    
    if (session) {
        const isAdmin = session.role === 'admin';
        const userInitial = session.username.charAt(0).toUpperCase();
        
        const userInfoHTML = `
            <div class="user-info">
                <span class="user-welcome">👋 Hi, ${session.username}!</span>
                ${isAdmin ? '<button class="admin-btn" onclick="goToAdmin()">⚙️ Admin Panel</button>' : ''}
                <div class="profile-icon-wrapper">
                    <button class="profile-icon-btn" onclick="toggleProfileDropdown(event)" title="Profile Menu">
                        ${userInitial}
                    </button>
                    <div id="profileDropdown" class="profile-dropdown">
                        <div class="dropdown-header">
                            <div class="dropdown-avatar">${userInitial}</div>
                            <div class="dropdown-user-info">
                                <div class="dropdown-username">${session.username}</div>
                                <div class="dropdown-email">${session.email}</div>
                            </div>
                        </div>
                        
                        <div class="dropdown-divider"></div>
                        
                        <div class="dropdown-menu-items">
                            <a href="profile.html" class="dropdown-item">
                                <span class="dropdown-icon">👤</span>
                                <span class="dropdown-text">See All Information</span>
                            </a>
                            
                            <a href="profile.html#transactions" class="dropdown-item">
                                <span class="dropdown-icon">🛒</span>
                                <span class="dropdown-text">Transaction History</span>
                            </a>
                            
                            <a href="#settings" class="dropdown-item" onclick="showComingSoon(event)">
                                <span class="dropdown-icon">⚙️</span>
                                <span class="dropdown-text">Account Settings</span>
                            </a>
                            
                            <a href="#help" class="dropdown-item" onclick="showComingSoon(event)">
                                <span class="dropdown-icon">❓</span>
                                <span class="dropdown-text">Help & Support</span>
                            </a>
                        </div>
                        
                        <div class="dropdown-divider"></div>
                        
                        <button class="dropdown-item dropdown-logout" onclick="logoutFromDropdown()">
                            <span class="dropdown-icon">🚪</span>
                            <span class="dropdown-text">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        headerRight.innerHTML = userInfoHTML;
        
        if (!window.dropdownInitialized) {
            initializeProfileDropdown();
            window.dropdownInitialized = true;
        }
    } else {
        const loginBtnHTML = `
            <button class="login-btn" onclick="openAuthModal()">🔐 Login / Sign Up</button>
        `;
        headerRight.innerHTML = loginBtnHTML;
    }
}

/**
 * Navigate to profile page (updated)
 */
function goToProfile() {
    const session = getCurrentSession();
    
    if (!session) {
        showNotification('⚠️ Please login to view your profile', 'error');
        openAuthModal();
        return;
    }
    
    // Close dropdown if open
    closeProfileDropdown();
    
    // Redirect to profile page
    window.location.href = 'profile.html';
}

// ============================================
// PROFILE NAVIGATION FUNCTION
// Add this new function to your script.js
// ============================================

function goToProfile() {
    const session = getCurrentSession();
    
    if (!session) {
        showNotification('⚠️ Please login to view your profile', 'error');
        openAuthModal();
        return;
    }
    
    // Redirect to profile page
    window.location.href = 'profile.html';
}

// ============================================
// MAKE SURE THIS IS AVAILABLE GLOBALLY
// Add this at the end of script.js if not already present
// ============================================

window.goToProfile = goToProfile;

// ============================================
// DATA MANAGEMENT - LOCAL STORAGE
// ============================================

function initializeData() {

    if (!localStorage.getItem('promos')) {
        const defaultPromos = [
            // Remove all text-based default promos - start with empty array
            // Users will need to upload their own promo images
        ];
        localStorage.setItem('promos', JSON.stringify(defaultPromos));
    }

    if (!localStorage.getItem('news')) {
        const defaultNews = [
            {
                id: 1,
                title: 'New Games Added!',
                description: 'We\'ve added 5 new games to our store. Check them out now!',
                date: '2024-01-15',
                icon: '🎉'
            },
            {
                id: 2,
                title: 'Payment Methods Update',
                description: 'We now accept more payment methods including Apple Pay and Google Pay',
                date: '2024-01-14',
                icon: '💳'
            },
            {
                id: 3,
                title: 'System Maintenance',
                description: 'Scheduled maintenance completed successfully. All systems operational!',
                date: '2024-01-13',
                icon: '✅'
            }
        ];
        localStorage.setItem('news', JSON.stringify(defaultNews));
    }
}

async function getAllGames() {
    try {
        console.log('📡 Fetching games from database...');
        const response = await ApiService.getAllGames();
        
        console.log('📦 Raw API Response:', {
            success: response.success,
            itemsCount: response.items ? response.items.length : 0
        });
        
        if (response.success && response.items) {
            console.log(`✅ Loaded ${response.items.length} games from database`);
            
            // Debug first game's image
            if (response.items.length > 0) {
                const firstGame = response.items[0];
                console.log('🔍 First game analysis:', {
                    name: firstGame.name,
                    hasImage: !!firstGame.image,
                    imageType: firstGame.image ? typeof firstGame.image : 'N/A',
                    imageStartsWith: firstGame.image ? firstGame.image.substring(0, 50) : 'N/A',
                    imageLength: firstGame.image ? firstGame.image.length : 0,
                    isValidBase64: firstGame.image ? firstGame.image.startsWith('data:image') : false,
                    allKeys: Object.keys(firstGame)
                });
            }
            
            return response.items;
        } else {
            console.error('❌ Failed to load games:', response);
            return [];
        }
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return [];
    }
}

async function getAllPromos() {
    try {
        const response = await ApiService.getAllPromos();
        if (response.success) {
            return response.promos || [];
        }
        return [];
    } catch (error) {
        console.log('Failed to load promos from database:', error);
        return [];
    }
}

/**
 * Gets all news from database
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
        console.log('Failed to load news from database:', error);
        return [];
    }
}

// ============================================
// ENHANCED CAROUSEL WITH SMOOTH CONTROLS
// ============================================

let currentHeroSlide = 0;
let carouselInterval;
let heroPromos = []; // Store promos globally

async function initCarousel() {
    heroPromos = await getAllPromos(); // Wait for promos to load
    
    if (heroPromos.length <= 1) {
        // Hide arrows if only one or no slides
        const arrows = document.querySelectorAll('.carousel-btn');
        arrows.forEach(arrow => arrow.style.display = 'none');
        return;
    }
    
    // Start auto-advance
    startAutoCarousel();
}


function changeHeroSlide(n) {
    if (heroPromos.length === 0) return;
    
    // Reset auto-advance timer
    resetAutoCarousel();
    
    // Calculate new slide with looping
    currentHeroSlide = (currentHeroSlide + n + heroPromos.length) % heroPromos.length;
    
    console.log(`🔄 Carousel: ${n > 0 ? 'Next' : 'Previous'} → Slide ${currentHeroSlide} of ${heroPromos.length - 1}`);
    updateHeroCarousel();
}

function goToHeroSlide(n) {
    if (heroPromos.length === 0 || n < 0 || n >= heroPromos.length) return;
    
    // Reset auto-advance timer
    resetAutoCarousel();
    
    currentHeroSlide = n;
    updateHeroCarousel();
}

function updateHeroCarousel() {
    const carouselTrack = document.getElementById('promoCarouselTrack');
    const indicators = document.querySelectorAll('.carousel-indicators .indicator');
    
    if (!carouselTrack) return;
    
    // Smooth transition
    carouselTrack.style.transition = 'transform 0.5s ease-in-out';
    const offset = -currentHeroSlide * 100;
    carouselTrack.style.transform = `translateX(${offset}%)`;
    
    // Update indicators
    indicators.forEach((ind, index) => {
        ind.classList.toggle('active', index === currentHeroSlide);
    });
}

// Auto-advance functionality
function startAutoCarousel() {
    if (heroPromos.length <= 1) return;
    
    carouselInterval = setInterval(() => {
        changeHeroSlide(1); // Move to next slide
    }, 8000); // Change slide every 8 seconds
}

function resetAutoCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        startAutoCarousel();
    }
}

// Pause auto-advance on hover
function setupCarouselHover() {
    const carousel = document.querySelector('.carousel-container');
    if (!carousel) return;
    
    carousel.addEventListener('mouseenter', () => {
        if (carouselInterval) {
            clearInterval(carouselInterval);
        }
    });
    
    carousel.addEventListener('mouseleave', () => {
        startAutoCarousel();
    });
}

function updateHeroCarousel() {
    const carouselTrack = document.getElementById('promoCarouselTrack');
    const indicators = document.querySelectorAll('.carousel-indicators .indicator');
    
    if (!carouselTrack) return;
    
    const offset = -currentHeroSlide * 100;
    carouselTrack.style.transform = `translateX(${offset}%)`;
    
    // Update indicators
    indicators.forEach((ind, index) => {
        ind.classList.toggle('active', index === currentHeroSlide);
    });
    
    console.log(`🎯 Carousel: Now showing slide ${currentHeroSlide}`);
}

// ============================================
// CATEGORY FILTERING & SEARCH
// ============================================

let currentCategory = 'all';

function filterByCategory(category) {
    console.log(`🎯 Filtering by category: "${category}"`);
    currentCategory = category;
    
    // Debug: Log the category being filtered
    getAllGames().then(games => {
        const gamesInCategory = games.filter(game => 
            (game.game_platform || game.category) === category
        );
        console.log(`📊 Found ${gamesInCategory.length} games in category "${category}"`);
        gamesInCategory.forEach(game => {
            console.log(`- ${game.name} (${game.game_platform || game.category})`);
        });
    });
    
    renderGames();
}

function searchGames() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    renderGames(searchInput);
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

async function renderGames(searchTerm = '') {
    console.log('🔄 Rendering games on main page...');
    
    const games = await getAllGames();
    const gamesList = document.getElementById('gamesList');
    const noGamesMessage = document.getElementById('noGamesMessage');
    
    if (!gamesList) {
        console.error('❌ gamesList element not found');
        return;
    }
    
    console.log(`📦 Total games from database: ${games.length}`);
    
    let filteredGames = games;
    
    // Filter by category - handle both game_platform and category properties
    if (currentCategory !== 'all') {
        filteredGames = filteredGames.filter(game => 
            (game.game_platform || game.category) === currentCategory
        );
        console.log(`🔍 Filtered by category '${currentCategory}': ${filteredGames.length} games`);
    }
    
    // Filter by search term
    if (searchTerm) {
        filteredGames = filteredGames.filter(game =>
            game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        console.log(`🔍 Filtered by search '${searchTerm}': ${filteredGames.length} games`);
    }
    
    // Clear and render
    gamesList.innerHTML = '';
    
    if (!filteredGames || !Array.isArray(filteredGames) || filteredGames.length === 0) {
        if (noGamesMessage) noGamesMessage.style.display = 'block';
        return;
    }
    
    if (noGamesMessage) noGamesMessage.style.display = 'none';
    
    filteredGames.forEach((game, index) => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        
        // FIX: Rename 'category' variable to avoid conflict
        const gameCategory = game.game_platform || game.category || 'General';
        
        const imageData = game.image || game.game_image || game.gameImage || null;
        
        console.log(`🎮 Rendering game ${index + 1}: ${game.name}`, {
            hasImage: !!imageData,
            imageValid: imageData ? imageData.startsWith('data:image') : false,
            imageLength: imageData ? imageData.length : 0,
            imageType: imageData ? typeof imageData : 'none',
            category: gameCategory
        });
        
        let imageContent = '';
        
        if (imageData && imageData.startsWith('data:image')) {
            // Valid base64 image - use img tag
            imageContent = `
                <img src="${imageData}" 
                     alt="${game.name}" 
                     class="game-image" 
                     onerror="console.error('❌ Image load error for ${game.name}'); this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     onload="console.log('✅ Image loaded successfully: ${game.name}')">
                <div class="game-icon-placeholder" style="display: none;">
                    ${getGameIcon(game.name)}
                </div>
            `;
        } else {
            // No image or invalid image - use icon placeholder
            console.log(`⚠️ Using icon placeholder for ${game.name} - no valid image data`);
            const gameIcon = getGameIcon(game.name);
            imageContent = `<div class="game-icon-placeholder">${gameIcon}</div>`;
        }
        
        // Calculate price display
        let priceDisplay = '₱0.00';
        if (game.priceOptions && Array.isArray(game.priceOptions) && game.priceOptions.length > 0) {
            const prices = game.priceOptions.map(opt => opt.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            priceDisplay = minPrice === maxPrice 
                ? `₱${minPrice.toFixed(2)}` 
                : `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
        } else if (game.price) {
            priceDisplay = `₱${game.price.toFixed(2)}`;
        }
        
        gameCard.innerHTML = `
            <div class="game-card-image">
                ${imageContent}
            </div>
            <div class="game-card-body">
                <h3 class="game-card-title">${game.name}</h3>
                <span class="game-card-category">${gameCategory}</span>
                <p class="game-card-description">${game.description || 'No description available'}</p>
                <div class="game-card-price">${priceDisplay}</div>
                <div class="game-card-footer">
                    <button class="btn-buy" onclick="buyGame(${game.id}, '${game.name.replace("'", "\\'")}', ${game.price || 0})">
                        💳 Buy Now
                    </button>
                </div>
            </div>
        `;
        gamesList.appendChild(gameCard);
    });
    
    console.log(`✅ Successfully rendered ${filteredGames.length} games`);
}

async function renderPromos() {
    heroPromos = await getAllPromos(); // Load promos and store globally
    const carouselTrack = document.getElementById('promoCarouselTrack');
    const indicatorsContainer = document.getElementById('heroIndicators');
    
    if (!carouselTrack || !indicatorsContainer) {
        console.log('⚠️ Promo carousel elements not found - skipping promo rendering');
        return;
    }
    
    carouselTrack.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    if (heroPromos.length === 0) {
        // Add a default placeholder if no promos exist
        const defaultSlide = document.createElement('div');
        defaultSlide.className = 'carousel-slide';
        defaultSlide.style.background = getPromoGradient(0);
        defaultSlide.innerHTML = `
            <div class="carousel-content">
                <h2>Welcome to GameGate!</h2>
                <p>Check out our amazing deals on in-game currency</p>
            </div>
        `;
        carouselTrack.appendChild(defaultSlide);
        
        // Hide navigation for single slide
        document.querySelectorAll('.carousel-btn').forEach(btn => btn.style.display = 'none');
        return;
    }
    
    // Create carousel slides for each promo
    heroPromos.forEach((promo, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        
        if (promo.image) {
            slide.innerHTML = `
                <div class="carousel-slide-image">
                    <img src="${promo.image}" alt="Promo ${index + 1}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;\\'>🎮</div>';">
                </div>
            `;
            
            carouselTrack.appendChild(slide);
            
            // Create indicator
            const indicator = document.createElement('span');
            indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
            indicator.onclick = () => goToHeroSlide(index);
            indicatorsContainer.appendChild(indicator);
        }
    });
    
    // Initialize carousel with proper async handling
    currentHeroSlide = 0;
    updateHeroCarousel();
    
    // Initialize carousel after a short delay to ensure DOM is ready
    setTimeout(() => {
        initCarousel();
        setupCarouselHover();
    }, 100);
    
    console.log(`✅ Carousel: Loaded ${heroPromos.length} promo slides`);
}

function getPromoGradient(index) {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    return gradients[index % gradients.length];
}

/**
 * Render news on main page
 */
async function renderNews() {
    const news = await getAllNews();
    const newsList = document.getElementById('newsList');
    
    if (!newsList) return;
    
    newsList.innerHTML = '';
    
    if (news.length === 0) {
        // Show default placeholder if no news
        newsList.innerHTML = `
            <div class="news-card">
                <div class="news-card-image">📰</div>
                <div class="news-card-content">
                    <div class="news-card-date">${new Date().toISOString().split('T')[0]}</div>
                    <h3>Welcome to GameGate!</h3>
                    <p>Stay tuned for the latest updates and news about our platform.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Display only the latest 3 news items
    const latestNews = news.slice(0, 3);
    
    latestNews.forEach(newsItem => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        newsCard.innerHTML = `
            <div class="news-card-image">
                ${newsItem.icon}
            </div>
            <div class="news-card-content">
                <div class="news-card-date">${newsItem.date}</div>
                <h3>${newsItem.title}</h3>
                <p>${newsItem.description}</p>
            </div>
        `;
        newsList.appendChild(newsCard);
    });
}

// ============================================
// PURCHASE FUNCTIONALITY (WITH AUTH CHECK)
// ============================================

let selectedGameId = null;
let selectedGameName = '';
let selectedGamePrice = 0;

/**
 * CRITICAL: Buy function now requires login
 */
function buyGame(gameId, gameName, price) {
    // CHECK IF USER IS LOGGED IN
    if (!isLoggedIn()) {
        showNotification('⚠️ Please login to make a purchase!', 'error');
        setTimeout(() => {
            openAuthModal();
        }, 1000);
        return;
    }

    selectedGameId = gameId;
    selectedGameName = gameName;
    selectedGamePrice = price;
    
    const modalGameInfo = document.getElementById('modalGameInfo');
    modalGameInfo.innerHTML = `
        <h3>${gameName}</h3>
        <p><strong>Price:</strong> $${price}</p>
        <p>Are you sure you want to proceed with this purchase?</p>
    `;
    
    document.getElementById('purchaseModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('purchaseModal').style.display = 'none';
}

function completePurchase() {
    const session = getCurrentSession();
    showNotification(`✅ Purchase Complete! ${selectedGameName} ($${selectedGamePrice}) added to ${session.username}'s account.`);
    closeModal();
    
    selectedGameId = null;
    selectedGameName = '';
    selectedGamePrice = 0;
}

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
// NAVIGATION
// ============================================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Navigate to admin panel
 */
function goToAdmin() {
    const session = getCurrentSession();
    
    if (!session) {
        showNotification('⚠️ Please login to access admin panel', 'error');
        openAuthModal();
        return;
    }
    
    if (session.role !== 'admin') {
        showNotification('❌ Access denied. Admin privileges required.', 'error');
        return;
    }
    
    window.location.href = '../admin/admin.html';
}

window.addEventListener('scroll', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';
    
    document.querySelectorAll('section[id]').forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === current) {
            link.classList.add('active');
        }
    });
});

// ============================================
// FORM HANDLERS
// ============================================

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            const errorDiv = document.getElementById('loginError');
            errorDiv.classList.remove('show');
            
            const result = loginUser(email, password);
            
            if (result.success) {
                console.log('✅ Login successful, creating session...');
                console.log('👤 User data with role:', result.user);
                
                // Create session with ALL user data including role
                const userData = {
                    id: result.user.id,
                    username: result.user.username,
                    email: result.user.email,
                    role: result.user.role || 'user' // Ensure role is included
                };
                
                console.log('💾 Creating session with:', userData);
                createSession(userData);
                
                // Verify session was created with role
                const session = getCurrentSession();
                console.log('🔍 Session after creation:', session);
                console.log('👤 Role in session:', session?.role);
                
                showNotification('✅ Login successful! Welcome back!', 'success');
                closeAuthModal();
                
                // Update header
                updateHeaderAuth();
            }
        });
    }

    // Sign Up Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('signupUsername').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;
            
            const errorDiv = document.getElementById('signupError');
            const successDiv = document.getElementById('signupSuccess');
            errorDiv.classList.remove('show');
            successDiv.classList.remove('show');
            
            if (password !== confirmPassword) {
                errorDiv.textContent = '❌ Passwords do not match!';
                errorDiv.classList.add('show');
                return;
            }
            
            if (!agreeTerms) {
                errorDiv.textContent = '❌ You must agree to Terms & Conditions';
                errorDiv.classList.add('show');
                return;
            }
            
            const result = createUser(username, email, password);
            
            if (result.success) {
                successDiv.textContent = '✅ ' + result.message;
                successDiv.classList.add('show');
                showNotification('Account created! Logging you in...', 'success');
                
                // Auto-login after signup
                setTimeout(() => {
                    const loginResult = loginUser(email, password);
                    if (loginResult.success) {
                        createSession(loginResult.user, true);
                        closeAuthModal();
                        window.location.reload();
                    }
                }, 1500);
            } else {
                errorDiv.textContent = '❌ ' + result.message;
                errorDiv.classList.add('show');
            }
        });
    }
});

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Main page initialization...');

    await testBackendConnection();

    // Add animations
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
    
    // Initialize data
    initializeData();
    
    // Update header with auth status
    updateHeaderAuth();
    
    // Render all sections - make sure promos are rendered first
    await renderPromos(); // Use await here
    await renderGames();
    await renderNews();

    setupModalAuthForms();
    
    console.log('✅ Main page initialization complete');
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    const purchaseModal = document.getElementById('purchaseModal');
    const authModal = document.getElementById('loginModal');
    
    if (event.target === purchaseModal) {
        closeModal();
    }
    if (event.target === authModal) {
        closeAuthModal();
    }
});

// ============================================
// TRANSACTION MANAGER - UPDATED
// ============================================

class TransactionManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
    }

    /**
     * Get user's transactions from database - UPDATED
     */
    async getUserTransactions(userId) {
        try {
            console.log(`📡 Fetching transactions for user ${userId}...`);
            const response = await fetch(`${this.apiBaseUrl}/transactions/user/${userId}`);
            const data = await response.json();
            
            console.log('📦 Transactions API response:', data);
            
            if (data.success && data.transactions) {
                console.log(`✅ Loaded ${data.transactions.length} transactions from database`);
                return data.transactions;
            } else {
                console.log('❌ No transactions found or API error:', data.error);
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching user transactions:', error);
            return [];
        }
    }

    /**
     * Get all transactions (admin only) - DEBUG VERSION
     */
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
}

// Global instance
const transactionManager = new TransactionManager();


// ============================================
// PURCHASE FLOW SYSTEM
// ============================================

// Purchase Flow State
let purchaseFlowState = {
    currentStep: 1,
    selectedGame: null,
    selectedPackage: null,
    selectedPayment: null,
    userDetails: {}
};

/**
 * Open purchase flow for a specific game
 */
async function buyGame(gameId, gameName, basePrice) {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showNotification('⚠️ Please login to make a purchase!', 'error');
        setTimeout(() => {
            openAuthModal();
        }, 1000);
        return;
    }

    const games = await getAllGames();
    const game = games.find(g => g.id === gameId);
    
    if (!game) {
        showNotification('Game not found!', 'error');
        return;
    }

    // Set selected game
    purchaseFlowState.selectedGame = game;
    purchaseFlowState.currentStep = 1;
    purchaseFlowState.selectedPackage = null;
    purchaseFlowState.selectedPayment = null;

    // Display game info
    displaySelectedGame();
    
    // Load packages for this game FROM DATABASE
    await loadGamePackages(gameName);

    // Show modal
    document.getElementById('purchaseFlowModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset to step 1
    goToStep(1);
}

/**
 * Display selected game banner - FIXED VERSION
 */
function displaySelectedGame() {
    const game = purchaseFlowState.selectedGame;
    if (!game) return;

    // FIX: Rename 'category' variable here too
    const imageData = game.image || game.game_image || game.gameImage;
    const gameCategory = game.game_platform || game.category || 'General';
    
    const imageContent = imageData 
        ? `<img src="${imageData}" alt="${game.name}">`
        : game.icon || '🎮';

    const bannerHTML = `
        <div class="selected-game-image">${imageContent}</div>
        <div class="selected-game-info">
            <h3>${game.name}</h3>
            <p>${game.description}</p>
            <span class="item-badge">${gameCategory}</span>
        </div>
    `;

    // Update both banner locations
    const banner1 = document.getElementById('selectedGameBanner');
    const banner2 = document.getElementById('selectedGameBanner2');
    
    if (banner1) banner1.innerHTML = bannerHTML;
    if (banner2) banner2.innerHTML = bannerHTML;
}

/**
 * Load game packages from database with currency icon
 */
async function loadGamePackages(gameName) {
    console.log('📄 Loading packages for:', gameName);
    
    const packagesGrid = document.getElementById('packagesGrid');
    if (!packagesGrid) {
        console.error('❌ Packages grid not found');
        return;
    }
    
    packagesGrid.innerHTML = '<div class="loading-message">📄 Loading packages...</div>';
    
    try {
        // Get all games from database
        const games = await getAllGames();
        console.log('📦 All games from database:', games);
        
        const game = games.find(g => g.name === gameName);
        
        if (!game) {
            console.error('❌ Game not found in database:', gameName);
            packagesGrid.innerHTML = '<div class="error-message">❌ Game not found</div>';
            return;
        }
        
        console.log('✅ Found game in database:', game);
        console.log('🎯 Game priceOptions:', game.priceOptions);
        console.log('🎯 Game currency icon:', game.currency_icon);
        
        // Clear loading message
        packagesGrid.innerHTML = '';
        
        // Check if game has priceOptions from admin panel
        if (game.priceOptions && Array.isArray(game.priceOptions) && game.priceOptions.length > 0) {
            console.log('✅ Using admin-defined price options');
            
            const sortedOptions = [...game.priceOptions].sort((a, b) => a.price - b.price);
            console.log('📊 Sorted price options:', sortedOptions);
            
            sortedOptions.forEach((option, index) => {
                const packageCard = document.createElement('div');
                packageCard.className = 'package-card';
                
                const pkg = {
                    id: option.id || index + 1,
                    amount: `${option.amount} ${game.currency}`,
                    price: option.price,
                    icon: game.currencyIcon ? '' : '💎',
                    currencyIcon: game.currencyIcon || game.currency_icon,
                    popular: index === Math.floor(sortedOptions.length / 2)
                };
                
                packageCard.onclick = () => selectPackage(pkg);
                
                const popularBadge = pkg.popular ? '<div class="package-badge">🔥 Popular</div>' : '';
                
                // UPDATED: Show currency icon in the package amount
                const iconDisplay = pkg.currencyIcon 
                    ? `<img src="${pkg.currencyIcon}" alt="${game.currency}" style="width: 40px; height: 40px; margin-right: 8px; vertical-align: middle;">`
                    : '💎';
                
                packageCard.innerHTML = `
                    ${popularBadge}
                    <div class="package-amount">${iconDisplay} ${option.amount} ${game.currency}</div>
                    <div class="package-price">₱${option.price.toFixed(2)}</div>
                    <div class="package-description">Get ${option.amount} ${game.currency}</div>
                `;
                
                packagesGrid.appendChild(packageCard);
                console.log(`✅ Added package: ${option.amount} for ₱${option.price}`);
            });
        } else {
            // If no priceOptions, use the game's base price as a single package
            console.log('❌ No priceOptions found, using base price as fallback');
            const packageCard = document.createElement('div');
            packageCard.className = 'package-card';
            
            const pkg = {
                id: 1,
                amount: `Standard ${game.currency} Package`,
                price: game.price,
                icon: '🎁',
                popular: true
            };
            
            packageCard.onclick = () => selectPackage(pkg);
            
            const iconDisplay = game.currencyIcon || game.currency_icon
                ? `<img src="${game.currencyIcon || game.currency_icon}" alt="${game.currency}" style="width: 40px; height: 40px; margin-right: 8px; vertical-align: middle;">`
                : '🎁';
            
            packageCard.innerHTML = `
                <div class="package-badge">🔥 Standard</div>
                <div class="package-amount">${iconDisplay} ${game.currency} Package</div>
                <div class="package-price">₱${game.price.toFixed(2)}</div>
                <div class="package-description">Get ${game.currency} for ${game.name}</div>
            `;
            
            packagesGrid.appendChild(packageCard);
        }
        
        console.log('✅ Packages loaded successfully from database');
        
    } catch (error) {
        console.error('❌ Error loading packages:', error);
        packagesGrid.innerHTML = '<div class="error-message">❌ Failed to load packages</div>';
    }
}
/**
 * Select package in purchase flow
 */
function selectPackage(pkg) {
    // Remove previous selection
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    event.currentTarget.classList.add('selected');
    
    // Store selected package
    purchaseFlowState.selectedPackage = pkg;
    
    // Enable next button
    document.getElementById('step1Next').disabled = false;
}

/**
 * Select payment method
 */
function selectPayment(method) {
    // Remove previous selection
    document.querySelectorAll('.payment-method').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection
    event.currentTarget.classList.add('selected');
    
    // Store selected payment
    const methodNames = {
        'gcash': 'GCash',
        'paypal': 'PayPal',
        'card': 'Credit Card',
        'bank': 'Bank Transfer'
    };
    
    purchaseFlowState.selectedPayment = methodNames[method];
}

/**
 * Navigate to specific step
 */
function goToStep(stepNumber) {
    console.log(`🔄 Navigating to step ${stepNumber}`);
    
    // Validation before moving forward
    if (stepNumber === 2 && !purchaseFlowState.selectedPackage) {
        showNotification('Please select a package first!', 'error');
        return;
    }

    if (stepNumber === 3) {
        // Validate form
        const userId = document.getElementById('userId');
        const email = document.getElementById('contactEmail');
        
        if (!userId || !userId.value.trim()) {
            showNotification('Please enter your User ID!', 'error');
            return;
        }
        
        if (!email || !email.value.trim()) {
            showNotification('Please enter your email address!', 'error');
            return;
        }
        
        if (!purchaseFlowState.selectedPayment) {
            showNotification('Please select a payment method!', 'error');
            return;
        }

        // Store user details
        purchaseFlowState.userDetails = {
            userId: userId.value.trim(),
            server: document.getElementById('serverRegion')?.value || 'Not specified',
            email: email.value.trim()
        };

        // Update summary
        updateOrderSummary();
    }

    // Hide all sections
    document.querySelectorAll('.flow-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`step${stepNumber}`);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error(`❌ Step ${stepNumber} section not found`);
        showNotification('Error: Could not load order form', 'error');
        return;
    }

    // Update step indicator
    updateStepIndicator(stepNumber);
    
    // Update current step
    purchaseFlowState.currentStep = stepNumber;

    // Scroll to top
    const modal = document.querySelector('.purchase-flow-modal');
    if (modal) {
        modal.scrollTop = 0;
    }

    console.log(`✅ Successfully navigated to step ${stepNumber}`);
}

/**
 * Update step indicator
 */
function updateStepIndicator(currentStep) {
    const steps = document.querySelectorAll('.step');
    const progress = document.getElementById('stepProgress');
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });

    // Update progress bar
    const progressWidth = ((currentStep - 1) / 3) * 100;
    progress.style.width = `${progressWidth}%`;
}

/**
 * Update order summary
 */
function updateOrderSummary() {
    const game = purchaseFlowState.selectedGame;
    const pkg = purchaseFlowState.selectedPackage;
    const details = purchaseFlowState.userDetails;
    const payment = purchaseFlowState.selectedPayment;

    document.getElementById('summaryGame').textContent = game.name;
    document.getElementById('summaryPackage').textContent = pkg.amount;
    document.getElementById('summaryUserId').textContent = details.userId;
    document.getElementById('summaryServer').textContent = details.server;
    document.getElementById('summaryPayment').textContent = payment;
    document.getElementById('summaryEmail').textContent = details.email;
    document.getElementById('summaryTotal').textContent = `₱${pkg.price.toFixed(2)}`;
}

/**
 * Place order and show success - UPDATED TO REFRESH UI
 */
async function placeOrder() {
    console.log('🔄 Placing order...');
    
    const session = getCurrentSession();
    if (!session) {
        showNotification('Please login to complete purchase', 'error');
        return;
    }

    // Show loading state
    const placeOrderBtn = event.target;
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = '🔄 Processing...';
    placeOrderBtn.disabled = true;

    try {
        const game = purchaseFlowState.selectedGame;
        const pkg = purchaseFlowState.selectedPackage;
        const details = purchaseFlowState.userDetails;
        const payment = purchaseFlowState.selectedPayment;

        if (!game || !pkg) {
            throw new Error('Missing order information');
        }

        console.log('📦 Recording transaction in database...', {
            user_id: session.userId,
            item_id: game.id,
            final_price: pkg.price
        });

        // Record transaction in database with the actual package price
        const transactionResult = await ApiService.purchaseItem({
            user_id: session.userId,
            item_id: game.id,
            quantity: 1,
            final_price: pkg.price  // Use the actual package price
        });

        if (!transactionResult.success) {
            throw new Error(transactionResult.error || 'Failed to record transaction');
        }

        console.log('✅ Transaction recorded in database:', transactionResult);

        // Generate order number for display
        const orderNumber = generateOrderNumber();

        // Update success modal
        updateSuccessModal(orderNumber, game, pkg, details, payment);

        // Refresh transaction data in the background
        setTimeout(() => {
            if (window.refreshProfileData) {
                window.refreshProfileData();
            }
        }, 1000);

        // Go to success page
        goToStep(4);

        // Show success notification
        showNotification('🎉 Order placed successfully! Transaction recorded in database.', 'success');

        console.log('✅ Order completed and saved to database');

    } catch (error) {
        console.error('❌ Error placing order:', error);
        showNotification(`❌ Order failed: ${error.message}`, 'error');
        
        // Reset button state
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
    }
}

/**
 * Place order and show success - FINAL VERSION
 */
async function placeOrder() {
    console.log('🔄 Placing order...');
    
    const session = getCurrentSession();
    if (!session) {
        showNotification('Please login to complete purchase', 'error');
        return;
    }

    // Show loading state
    const placeOrderBtn = event.target;
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = '🔄 Processing...';
    placeOrderBtn.disabled = true;

    try {
        const game = purchaseFlowState.selectedGame;
        const pkg = purchaseFlowState.selectedPackage;
        const details = purchaseFlowState.userDetails;
        const payment = purchaseFlowState.selectedPayment;

        if (!game || !pkg) {
            throw new Error('Missing order information');
        }

        console.log('📦 Recording transaction in database...', {
            user_id: session.userId,
            item_id: game.id,
            final_price: pkg.price
        });

        // Record transaction in database with the actual package price
        const transactionResult = await ApiService.purchaseItem({
            user_id: session.userId,
            item_id: game.id,
            quantity: 1,
            final_price: pkg.price  // Use the actual package price
        });

        if (!transactionResult.success) {
            throw new Error(transactionResult.error || 'Failed to record transaction');
        }

        console.log('✅ Transaction recorded in database:', transactionResult);

        // Generate order number for display
        const orderNumber = generateOrderNumber();

        // Update success modal
        updateSuccessModal(orderNumber, game, pkg, details, payment);

        // Optional: Save to localStorage for immediate UI update
        saveTransactionToLocalStorage({
            orderNumber: orderNumber,
            game: game.name,
            package: pkg.amount,
            price: pkg.price,
            userId: details.userId,
            payment: payment,
            date: new Date().toISOString(),
            status: 'completed'
        });

        // Go to success page
        goToStep(4);

        // Show success notification
        showNotification('🎉 Order placed successfully! Transaction recorded in database.', 'success');

        console.log('✅ Order completed and saved to database');

    } catch (error) {
        console.error('❌ Error placing order:', error);
        showNotification(`❌ Order failed: ${error.message}`, 'error');
        
        // Reset button state
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
    }
}

/**
 * Update success modal with order details
 */
function updateSuccessModal(orderNumber, game, pkg, details, payment) {
    const orderNumberElement = document.getElementById('orderNumber');
    const finalGameElement = document.getElementById('finalGame');
    const finalPackageElement = document.getElementById('finalPackage');
    const finalUserIdElement = document.getElementById('finalUserId');
    const finalPaymentElement = document.getElementById('finalPayment');
    const finalTotalElement = document.getElementById('finalTotal');

    if (orderNumberElement) orderNumberElement.textContent = orderNumber;
    if (finalGameElement) finalGameElement.textContent = game.name;
    if (finalPackageElement) finalPackageElement.textContent = pkg.amount;
    if (finalUserIdElement) finalUserIdElement.textContent = details.userId;
    if (finalPaymentElement) finalPaymentElement.textContent = payment || 'Not selected';
    if (finalTotalElement) finalTotalElement.textContent = `₱${pkg.price.toFixed(2)}`;
}

/**
 * Generate unique order number
 */
function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `GG${timestamp}${random}`;
}

/**
 * Save order to history (optional feature)
 */
function saveOrderToHistory(orderNumber) {
    const order = {
        orderNumber: orderNumber,
        game: purchaseFlowState.selectedGame.name,
        package: purchaseFlowState.selectedPackage.amount,
        price: purchaseFlowState.selectedPackage.price,
        userId: purchaseFlowState.userDetails.userId,
        payment: purchaseFlowState.selectedPayment,
        date: new Date().toISOString(),
        status: 'Completed'
    };

    // Get existing orders
    let orders = localStorage.getItem('user_orders');
    orders = orders ? JSON.parse(orders) : [];
    
    // Add new order
    orders.unshift(order);
    
    // Save back
    localStorage.setItem('user_orders', JSON.stringify(orders));
}

/**
 * Save transaction to localStorage for immediate UI update (optional)
 */
function saveTransactionToLocalStorage(transaction) {
    try {
        let transactions = JSON.parse(localStorage.getItem('user_orders') || '[]');
        transactions.unshift(transaction);
        localStorage.setItem('user_orders', JSON.stringify(transactions));
        console.log('✅ Transaction also saved to localStorage for immediate display');
        return true;
    } catch (error) {
        console.error('❌ Error saving transaction to localStorage:', error);
        return false;
    }
}

/**
 * Close purchase flow
 */
function closePurchaseFlow() {
    document.getElementById('purchaseFlowModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset state
    purchaseFlowState = {
        currentStep: 1,
        selectedGame: null,
        selectedPackage: null,
        selectedPayment: null,
        userDetails: {}
    };

    // Reset form
    document.getElementById('checkoutForm').reset();
    
    // Clear selections
    document.querySelectorAll('.package-card, .payment-method').forEach(el => {
        el.classList.remove('selected');
    });

    // Disable step 1 next button
    document.getElementById('step1Next').disabled = true;

    // Reset to step 1
    setTimeout(() => {
        goToStep(1);
    }, 300);
}

// Close modal when clicking outside
document.addEventListener('click', (event) => {
    const modal = document.getElementById('purchaseFlowModal');
    if (event.target === modal) {
        closePurchaseFlow();
    }
});

// ============================================
// MODAL FORM HANDLERS 
// ============================================

function setupModalAuthForms() {
    console.log('🔐 Setting up modal auth forms...');
    
    // Login Form Handler for Modal - FIXED VERSION
    const loginFormModal = document.getElementById('loginFormModal');
    if (loginFormModal) {
        loginFormModal.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('🔄 Modal login form submitted');
            
            const email = document.getElementById('loginEmailModal').value.trim();
            const password = document.getElementById('loginPasswordModal').value;
            
            const errorDiv = document.getElementById('loginErrorModal');
            errorDiv.classList.remove('show');
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '🔄 Logging in...';
            submitBtn.disabled = true;
            
            try {
                const result = await loginUser(email, password);
                
                console.log('🔍 Login result:', result);
                
                if (result.success) {
                    console.log('✅ Login successful, creating session...');
                    console.log('👤 User data:', result.user);
                    
                    // Create session with ALL user data including role
                    const userData = {
                        id: result.user.id,
                        username: result.user.username,
                        email: result.user.email,
                        role: result.user.role // Make sure this is included!
                    };
                    
                    console.log('💾 Creating session with:', userData);
                    createSession(userData);
                    
                    // Verify session was created with role
                    const session = getCurrentSession();
                    console.log('🔍 Session after creation:', session);
                    console.log('👤 Role in session:', session?.role);
                    console.log('👤 Is admin?', session?.role === 'admin');
                    
                    showNotification('✅ Login successful! Welcome back!', 'success');
                    closeAuthModal();
                    
                    // Force update header
                    if (typeof updateHeaderAuth === 'function') {
                        await updateHeaderAuth();
                    } else {
                        console.error('❌ updateHeaderAuth function not found!');
                        location.reload(); // Fallback: reload the page
                    }
                    
                } else {
                    errorDiv.textContent = `❌ ${result.message}`;
                    errorDiv.classList.add('show');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Modal login error:', error);
                errorDiv.textContent = '❌ Login failed. Please try again.';
                errorDiv.classList.add('show');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Sign Up Form Handler for Modal
    const signupFormModal = document.getElementById('signupFormModal');
    if (signupFormModal) {
        signupFormModal.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('🔄 Modal signup form submitted');
            
            const username = document.getElementById('signupUsernameModal').value.trim();
            const email = document.getElementById('signupEmailModal').value.trim();
            const password = document.getElementById('signupPasswordModal').value;
            const confirmPassword = document.getElementById('signupConfirmPasswordModal').value;
            const agreeTerms = document.getElementById('agreeTermsModal').checked;
            
            const errorDiv = document.getElementById('signupErrorModal');
            const successDiv = document.getElementById('signupSuccessModal');
            errorDiv.classList.remove('show');
            successDiv.classList.remove('show');
            
            // Validation
            if (password !== confirmPassword) {
                errorDiv.textContent = '❌ Passwords do not match!';
                errorDiv.classList.add('show');
                return;
            }
            
            if (!agreeTerms) {
                errorDiv.textContent = '❌ You must agree to Terms & Conditions';
                errorDiv.classList.add('show');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '🔄 Creating account...';
            submitBtn.disabled = true;
            
            try {
                const result = await createUser(username, email, password);
                
                if (result.success) {
                    successDiv.textContent = `✅ ${result.message}`;
                    successDiv.classList.add('show');
                    
                    showNotification('🎉 Account created! Logging you in...', 'success');
                    
                    // Auto-login after successful signup
                    setTimeout(async () => {
                        const loginResult = await loginUser(email, password);
                        if (loginResult.success) {
                            createSession(loginResult.user);
                            closeAuthModal();
                            updateHeaderAuth();
                            showNotification('🎉 Welcome to GameGate!', 'success');
                            
                            // Update UI without full page reload
                            setTimeout(() => {
                                renderGames();
                            }, 500);
                        }
                    }, 1500);
                } else {
                    errorDiv.textContent = `❌ ${result.message}`;
                    errorDiv.classList.add('show');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Modal signup error:', error);
                errorDiv.textContent = '❌ Registration failed. Please try again.';
                errorDiv.classList.add('show');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

/**
 * Debug session and role information
 */
function debugSession() {
    const session = getCurrentSession();
    console.log('🔍 DEBUG SESSION:');
    console.log('Session exists:', !!session);
    if (session) {
        console.log('User:', session.username);
        console.log('Role:', session.role);
        console.log('Is admin:', session.role === 'admin');
        console.log('Full session:', session);
    }
    
    // Test the header update
    updateHeaderAuth();
}

// You can call this in browser console to debug: debugSession()
window.debugSession = debugSession;

// ============================================
// UTILITIES
// ============================================

// Update the getGameIcon function to handle all categories
function getGameIcon(gameName) {
    if (!gameName) return '🎮';
    
    const lowerName = gameName.toLowerCase();
    
    // Map game names to icons - expanded for all categories
    const iconMap = {
        'mobile': '📱',
        'legends': '⚔️',
        'league': '👑', 
        'valorant': '🎯',
        'genshin': '⭐',
        'impact': '🌟',
        'pubg': '🔫',
        'battlegrounds': '🎯',
        'call of duty': '🔫',
        'cod': '🔫',
        'duty': '🔫',
        'clash': '👑',
        'clans': '🏰',
        'royale': '👑',
        'minecraft': '⛏️',
        'fortnite': '🌈',
        'roblox': '🔺',
        'overwatch': '🎯',
        'dota': '⚔️',
        'csgo': '🔫',
        'counter-strike': '🔫',
        'apex': '🔫',
        'rainbow': '🔫',
        'siege': '🏰',
        'fifa': '⚽',
        'nba': '🏀',
        '2k': '🏀',
        'rocket': '🚗',
        'league': '🏎️',
        'world': '🌍',
        'warcraft': '⚔️',
        'final': '⭐',
        'fantasy': '🗡️',
        'elden': '⚔️',
        'ring': '💍',
        'cyberpunk': '🔫',
        'assassin': '🗡️',
        'creed': '🏛️',
        'grand': '🚗',
        'theft': '💰',
        'auto': '🚗',
        'red': '🔴',
        'dead': '💀',
        'redemption': '🤠',
        'zelda': '🛡️',
        'mario': '🍄',
        'pokemon': '⚡',
        'animal': '🐾',
        'crossing': '🏝️',
        'battle': '💥',
        'royale': '👑',
        'mmo': '👥',
        'rpg': '🗡️',
        'strategy': '♟️',
        'strategies': '♟️'
    };
    
    // Check for exact matches first
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }
    
    // Check by category keywords
    const categoryMap = {
        'moba': '⚔️',
        'battle': '💥',
        'arena': '⚔️',
        'fps': '🔫',
        'shooter': '🔫',
        'shoot': '🔫',
        'rpg': '🗡️',
        'role': '🗡️',
        'story': '🗡️',
        'sports': '⚽',
        'sport': '⚽',
        'ball': '⚽',
        'racing': '🏎️',
        'race': '🏎️',
        'drive': '🏎️',
        'strategy': '♟️',
        'strategies': '♟️',
        'tactical': '♟️',
        'planning': '♟️',
        'casual': '🎨',
        'puzzle': '🎨',
        'match': '🎨',
        'mmorpg': '👥',
        'mmo': '👥',
        'multiplayer': '👥'
    };
    
    for (const [key, icon] of Object.entries(categoryMap)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }
    
    // Default icon
    return '🎮';
}

/**
 * Debug session and role information
 */
function debugSession() {
    const session = getCurrentSession();
    console.log('🔍 DEBUG SESSION:');
    console.log('Session exists:', !!session);
    if (session) {
        console.log('User:', session.username);
        console.log('Role:', session.role);
        console.log('Is admin:', session.role === 'admin');
        console.log('Full session:', session);
    }
    
    // Test the header update
    updateHeaderAuth();
}

// Make it available globally
window.getGameIcon = getGameIcon;
window.debugSession = debugSession;

/**
 * Comprehensive debug function to check authentication state
 */
function debugAuth() {
    console.log('🔍 === AUTH DEBUG ===');
    
    // Check localStorage
    const rawSession = localStorage.getItem('currencyhub_session');
    console.log('📦 Raw session from localStorage:', rawSession);
    
    // Check if logged in
    const isLoggedInResult = isLoggedIn();
    console.log('🔐 isLoggedIn() result:', isLoggedInResult);
    
    // Get current session
    const session = getCurrentSession();
    console.log('👤 Current session:', session);
    
    if (session) {
        console.log('👤 User:', session.username);
        console.log('🎭 Role:', session.role);
        console.log('⚙️ Is admin:', session.role === 'admin');
        console.log('📧 Email:', session.email);
    }
    
    // Check header elements
    const headerRight = document.querySelector('.header-right');
    console.log('📍 Header right element:', headerRight);
    
    if (headerRight) {
        const adminBtn = headerRight.querySelector('.admin-btn');
        const userInfo = headerRight.querySelector('.user-info');
        const loginBtn = headerRight.querySelector('.login-btn');
        
        console.log('🔘 Admin button in DOM:', adminBtn);
        console.log('👤 User info in DOM:', userInfo);
        console.log('🔑 Login button in DOM:', loginBtn);
    }
    
    console.log('🔍 === END DEBUG ===');
}

// Make it globally available
window.debugAuth = debugAuth;

/**
 * Debug game data from backend
 */
async function debugGameData() {
    console.log('🔍 DEBUGGING GAME DATA FROM BACKEND');
    
    try {
        const response = await ApiService.getAllGames();
        console.log('📦 Full API Response:', response);
        
        if (response.success && response.items) {
            console.log(`🎮 Found ${response.items.length} games`);
            
            response.items.forEach((game, index) => {
                console.log(`--- Game ${index + 1}: ${game.name} ---`);
                console.log('Full game object:', game);
                console.log('Image exists:', !!game.image);
                console.log('Image type:', typeof game.image);
                
                if (game.image) {
                    console.log('Image data sample:', game.image.substring(0, 100));
                    console.log('Image length:', game.image.length);
                    console.log('Is base64 data URL:', game.image.startsWith('data:image'));
                    console.log('Is HTTP URL:', game.image.startsWith('http'));
                    
                    // Test if image can be displayed
                    const testImg = new Image();
                    testImg.onload = () => console.log('✅ Image loads successfully');
                    testImg.onerror = (e) => {
                        console.log('❌ Image failed to load:', e);
                        console.log('Image src that failed:', game.image);
                    };
                    testImg.src = game.image;
                } else {
                    console.log('❌ No image data in game object');
                }
                
                // Check all game properties
                console.log('All game properties:', Object.keys(game));
            });
        } else {
            console.log('❌ API response not successful:', response);
        }
    } catch (error) {
        console.log('❌ Error fetching games:', error);
    }
}

/**
 * Debug game images to check why they're not displaying
 */
async function debugGameImages() {
    console.log('🔍 === GAME IMAGES DEBUG ===');
    
    const games = await getAllGames();
    
    games.forEach((game, index) => {
        console.log(`\n--- Game ${index + 1}: ${game.name} ---`);
        console.log('ID:', game.id);
        console.log('Has image property:', !!game.image);
        
        if (game.image) {
            console.log('Image type:', typeof game.image);
            console.log('Image length:', game.image.length);
            console.log('Starts with "data:image":', game.image.startsWith('data:image'));
            console.log('First 100 chars:', game.image.substring(0, 100));
            
            // Test if image can be loaded
            const testImg = new Image();
            testImg.onload = () => console.log('✅ Image loads successfully');
            testImg.onerror = (e) => {
                console.error('❌ Image failed to load:', e);
                console.error('Image src that failed:', game.image.substring(0, 200) + '...');
            };
            testImg.src = game.image;
        } else {
            console.log('❌ No image property found');
            console.log('All properties:', Object.keys(game));
        }
    });
    
    console.log('\n=== END DEBUG ===');
}

function toggleProfileDropdown(event) {
    event.stopPropagation();
    
    const dropdown = document.getElementById('profileDropdown');
    const profileBtn = event.currentTarget;
    
    if (!dropdown) {
        console.error('❌ Profile dropdown not found');
        return;
    }
    
    const isShown = dropdown.classList.contains('show');
    
    if (isShown) {
        dropdown.classList.remove('show');
        profileBtn.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        profileBtn.classList.add('active');
    }
}


/**
 * Open profile dropdown
 */
function openProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (!dropdown) return;
    
    // Update dropdown content with current session data
    updateDropdownContent();
    
    // Show dropdown
    dropdown.classList.add('show');
    
    console.log('✅ Profile dropdown opened');
}

/**
 * Close profile dropdown
 */
function closeProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const profileBtn = document.querySelector('.profile-icon-btn');
    
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    if (profileBtn) {
        profileBtn.classList.remove('active');
    }
}

/**
 * Update dropdown content with user data
 */
function updateDropdownContent() {
    const session = getCurrentSession();
    
    if (!session) {
        console.error('❌ No session found for dropdown');
        return;
    }
    
    // Update avatar
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    if (dropdownAvatar) {
        const userInitial = session.username.charAt(0).toUpperCase();
        dropdownAvatar.textContent = userInitial;
    }
    
    // Update username
    const dropdownUsername = document.getElementById('dropdownUsername');
    if (dropdownUsername) {
        dropdownUsername.textContent = session.username;
    }
    
    // Update email
    const dropdownEmail = document.getElementById('dropdownEmail');
    if (dropdownEmail) {
        dropdownEmail.textContent = session.email;
    }
    
    console.log('✅ Dropdown content updated for:', session.username);
}

/**
 * Logout from dropdown
 */
function logoutFromDropdown() {
    if (confirm('Are you sure you want to logout?')) {
        closeProfileDropdown();
        localStorage.removeItem('currencyhub_session');
        showNotification('✅ Logged out successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

function showComingSoon(event) {
    event.preventDefault();
    showNotification('🚧 This feature is coming soon!', 'info');
    closeProfileDropdown();
}

/**
 * Show coming soon notification
 */
function showComingSoon(event) {
    event.preventDefault();
    showNotification('🚧 This feature is coming soon!', 'info');
    closeProfileDropdown();
}

/**
 * Initialize dropdown event listeners
 */
function initializeProfileDropdown() {
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('profileDropdown');
        const profileWrapper = document.querySelector('.profile-icon-wrapper');
        
        if (!dropdown || !profileWrapper) return;
        
        if (!profileWrapper.contains(event.target)) {
            closeProfileDropdown();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeProfileDropdown();
        }
    });
    
    console.log('✅ Profile dropdown initialized');
}
    
    // Close dropdown on ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeProfileDropdown();
        }
    });
    
    console.log('✅ Profile dropdown initialized');


/**
 * Show coming soon notification
 */
function showComingSoon(event) {
    event.preventDefault();
    showNotification('🚧 This feature is coming soon!', 'info');
    closeProfileDropdown();
}

/**
 * Initialize dropdown event listeners
 */
function initializeProfileDropdown() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('profileDropdown');
        const profileBtn = document.querySelector('.profile-icon-btn');
        
        if (!dropdown || !profileBtn) return;
        
        // Check if click is outside dropdown and profile button
        if (!dropdown.contains(event.target) && !profileBtn.contains(event.target)) {
            closeProfileDropdown();
        }
    });
    
    // Close dropdown on ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeProfileDropdown();
        }
    });
    
    console.log('✅ Profile dropdown initialized');
}

// Make it available globally
window.debugGameImages = debugGameImages;

// Make it available globally
window.debugGameData = debugGameData;

// Debug function to check categories
function debugCategories() {
    console.log('🔍 DEBUGGING CATEGORIES:');
    console.log('Current selected category:', currentCategory);
    
    getAllGames().then(games => {
        console.log('All games and their categories:');
        games.forEach(game => {
            const gameCategory = game.game_platform || game.category || 'General';
            console.log(`- ${game.name}: "${gameCategory}"`);
        });
        
        // Check if any games have "Strategies" category
        const strategiesGames = games.filter(game => 
            (game.game_platform || game.category) === 'Strategies'
        );
        console.log(`Games with "Strategies" category: ${strategiesGames.length}`);
        strategiesGames.forEach(game => {
            console.log(`- ${game.name}`);
        });
    });
}

// Make it available globally
window.debugCategories = debugCategories;                       