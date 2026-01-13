// Authentication UI Logic
let currentUser = null;

// Initialize auth state
async function initAuth() {
    try {
        // Get current user immediately
        currentUser = await supabaseAuth.getCurrentUser();
        updateAuthUI();
        
        // Listen for auth changes
        supabaseAuth.onAuthStateChange((event, session) => {
            currentUser = session?.user || null;
            updateAuthUI();
            
            if (event === 'SIGNED_IN') {
                showToast('Welcome back.');
                if (typeof closeAuthModal === 'function') {
                    closeAuthModal();
                }
                
                // Clean up OAuth hash from URL
                if (window.location.hash.includes('access_token')) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }
        });
        
    } catch (error) {
        console.error('Auth init error:', error);
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    
    if (currentUser) {
        // User is logged in
        if (authBtn) authBtn.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            
            // Get Discord username and avatar from user metadata
            const metadata = currentUser.user_metadata;
            const displayName = metadata?.full_name || metadata?.name || currentUser.email;
            const avatarUrl = metadata?.avatar_url || metadata?.picture;
            
            if (userEmail) {
                userEmail.textContent = displayName;
            }
            
            // Update profile icons with Discord avatar if available
            if (avatarUrl) {
                updateProfileIcons(avatarUrl);
            }
        }
    } else {
        // User is logged out
        if (authBtn) authBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }
}

// Update profile icons with user avatar
function updateProfileIcons(avatarUrl) {
    const profileIcons = document.querySelectorAll('.profile-icon, .profile-icon-large');
    profileIcons.forEach(icon => {
        // Replace SVG with image
        icon.innerHTML = `<img src="${avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    });
}

// Show auth modal
function showAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('hidden');
    
    // Check if user is already logged in
    if (currentUser) {
        showLoggedInView();
    } else {
        showLogin();
    }
}

// Show logged-in view in auth modal
function showLoggedInView() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    
    // Create or show logged-in view
    let loggedInView = document.getElementById('loggedInView');
    if (!loggedInView) {
        loggedInView = document.createElement('div');
        loggedInView.id = 'loggedInView';
        loggedInView.className = 'auth-form';
        loggedInView.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: var(--primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 style="margin-bottom: 10px;">You're Already Signed In!</h2>
                <p id="loggedInEmail" style="color: var(--text-secondary); margin-bottom: 30px;"></p>
                <button onclick="window.location.href='app.html'" class="auth-btn" style="width: 100%; margin-bottom: 10px;">
                    Go to App
                </button>
                <button onclick="closeAuthModal()" class="auth-btn" style="width: 100%; background: var(--glass-light);">
                    Close
                </button>
            </div>
        `;
        document.getElementById('loginForm').parentElement.appendChild(loggedInView);
    }
    
    loggedInView.classList.remove('hidden');
    
    // Update email display
    const metadata = currentUser.user_metadata;
    const displayName = metadata?.full_name || metadata?.name || currentUser.email;
    const loggedInEmail = document.getElementById('loggedInEmail');
    if (loggedInEmail) {
        loggedInEmail.textContent = displayName;
    }
}

// Close auth modal
function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    clearAuthForms();
}

// Show login form
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    const loggedInView = document.getElementById('loggedInView');
    if (loggedInView) loggedInView.classList.add('hidden');
    clearAuthForms();
}

// Show signup form
function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    const loggedInView = document.getElementById('loggedInView');
    if (loggedInView) loggedInView.classList.add('hidden');
    clearAuthForms();
}



// Clear form errors
function clearAuthForms() {
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('signupError').classList.add('hidden');
    document.getElementById('signupSuccess').classList.add('hidden');
}

// Handle Google OAuth login
async function handleGoogleLogin() {
    try {
        // Determine redirect URL
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const redirectUrl = isLocal 
            ? 'http://localhost:3000/app.html'
            : 'https://barcodesense.vercel.app/app.html';
            
        const { data, error} = await supabaseAuth.signInWithOAuth('google', {
            redirectTo: redirectUrl
        });
        
        if (error) throw error;
    } catch (error) {
        console.error('Google login error:', error);
        showToast('Google login failed. Please try again.');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    try {
        await supabaseAuth.signIn(email, password);
        closeAuthModal();
        showToast('Welcome back!');
    } catch (error) {
        // Provide user-friendly error messages
        let errorMessage = 'An error occurred. Please try again.';
        
        if (error.message.toLowerCase().includes('invalid') || 
            error.message.toLowerCase().includes('credentials') ||
            error.message.toLowerCase().includes('password') ||
            error.message.toLowerCase().includes('email')) {
            errorMessage = 'Incorrect email or password. Please try again.';
        } else if (error.message.toLowerCase().includes('network') || 
                   error.message.toLowerCase().includes('fetch')) {
            errorMessage = 'Connection error. Please check your internet and try again.';
        } else if (error.message.toLowerCase().includes('too many')) {
            errorMessage = 'Too many attempts. Please try again later.';
        }
        
        errorEl.textContent = errorMessage;
        errorEl.classList.remove('hidden');
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupPasswordConfirm').value;
    const errorEl = document.getElementById('signupError');
    const successEl = document.getElementById('signupSuccess');

    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
        return;
    }

    try {
        await supabaseAuth.signUp(email, password);
        successEl.textContent = 'Account created successfully. You can now sign in.';
        successEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        setTimeout(() => showLogin(), 2000);
    } catch (error) {
        // Provide user-friendly error messages
        let errorMessage = 'An error occurred. Please try again.';
        
        if (error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already exists')) {
            errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (error.message.toLowerCase().includes('password') && 
                   error.message.toLowerCase().includes('short')) {
            errorMessage = 'Password is too short. Please use at least 6 characters.';
        } else if (error.message.toLowerCase().includes('invalid email')) {
            errorMessage = 'Invalid email address. Please check and try again.';
        } else if (error.message.toLowerCase().includes('network') || 
                   error.message.toLowerCase().includes('fetch')) {
            errorMessage = 'Connection error. Please check your internet and try again.';
        }
        
        errorEl.textContent = errorMessage;
        errorEl.classList.remove('hidden');
        successEl.classList.add('hidden');
    }
}

async function handleLogout() {
    try {
        await supabaseAuth.signOut();
        closeUserDropdown();
        showToast('Signed out successfully');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Toggle user dropdown
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close user dropdown
function closeUserDropdown() {
    document.getElementById('userDropdown').classList.add('hidden');
}

// Show scan history
async function showHistory() {
    closeUserDropdown();
    document.getElementById('historyModal').classList.remove('hidden');
    
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const products = await supabaseDB.getScannedProducts();
        
        if (!products || products.length === 0) {
            historyContent.innerHTML = '<p class="no-history">No scanned products yet. Start scanning to build your history!</p>';
            return;
        }
        
        let html = '<div class="history-list">';
        products.forEach(product => {
            const date = new Date(product.scanned_at).toLocaleDateString();
            html += `
                <div class="history-item">
                    <div class="history-info">
                        <h4>${product.product_name || 'Unknown Product'}</h4>
                        <p>Barcode: ${product.barcode}</p>
                        <small>${date}</small>
                    </div>
                    <button onclick="deleteHistoryItem('${product.id}')" class="delete-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        historyContent.innerHTML = html;
    } catch (error) {
        console.error('History error:', error);
        let errorMsg = 'Failed to load history. ';
        if (error.message.includes('not authenticated')) {
            errorMsg += 'Please sign in first.';
        } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
            errorMsg += 'Database tables not set up. Please run the SQL setup script.';
        } else {
            errorMsg += error.message;
        }
        historyContent.innerHTML = `<p class="error" style="color: var(--white); padding: 20px;">${errorMsg}</p>`;
    }
}

// Close history modal
function closeHistoryModal() {
    document.getElementById('historyModal').classList.add('hidden');
}

// Delete history item
async function deleteHistoryItem(id) {
    if (!confirm('Delete this item from history?')) return;
    
    try {
        await supabaseDB.deleteScannedProduct(id);
        showHistory(); // Refresh
        showToast('Item deleted');
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete item');
    }
}

// Save scanned product (call this after successful scan)
async function saveScannedProduct(barcode, productName, productData) {
    if (!currentUser) {
        // Show sign-in prompt if not logged in
        showSignInPrompt();
        return;
    }
    
    try {
        await supabaseDB.saveScannedProduct(barcode, productName, productData);
    } catch (error) {
        console.error('Save product error:', error);
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            showToast('Database not set up. Please run the SQL setup script.');
        } else {
            showToast('Failed to save product');
        }
    }
}

// Show sign-in prompt popup
let scanCount = 0;
function showSignInPrompt() {
    scanCount++;
    
    // Show popup on 1st, 3rd, and every 2 scans after that
    if (scanCount === 1 || scanCount === 3 || (scanCount > 3 && scanCount % 2 === 0)) {
        const popup = document.createElement('div');
        popup.className = 'signin-prompt-overlay';
        popup.innerHTML = `
            <div class="signin-prompt">
                <button class="signin-prompt-close" onclick="closeSignInPrompt()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="signin-prompt-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <h3>Save Your Scan History</h3>
                <p>Sign in to automatically save all your scanned products and access them anytime, anywhere!</p>
                <div class="signin-prompt-benefits">
                    <div class="benefit-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Never lose your scan history</span>
                    </div>
                    <div class="benefit-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Access from any device</span>
                    </div>
                    <div class="benefit-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Track your product insights</span>
                    </div>
                </div>
                <button class="signin-prompt-btn" onclick="closeSignInPrompt(); showAuthModal();">
                    Sign In Now
                </button>
                <button class="signin-prompt-later" onclick="closeSignInPrompt()">
                    Maybe Later
                </button>
            </div>
        `;
        document.body.appendChild(popup);
        
        // Fade in animation
        setTimeout(() => popup.classList.add('show'), 10);
    }
}

// Close sign-in prompt
window.closeSignInPrompt = function() {
    const popup = document.querySelector('.signin-prompt-overlay');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }
};

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    if (userMenu && !userMenu.contains(e.target)) {
        closeUserDropdown();
    }
});

// Handle mobile profile button
function handleMobileProfile() {
    // Check if user is logged in using the auth wrapper
    supabaseAuth.getCurrentUser().then(user => {
        if (user) {
            // User is logged in, show mobile menu
            showMobileProfileMenu(user);
        } else {
            // User not logged in, show auth modal
            showAuthModal();
        }
    }).catch(() => {
        showAuthModal();
    });
}

// Show mobile profile menu
function showMobileProfileMenu(user) {
    const mobileUserEmail = document.getElementById('mobileUserEmail');
    if (mobileUserEmail && user) {
        mobileUserEmail.textContent = user.email;
    }
    document.getElementById('mobileProfileMenu').classList.remove('hidden');
}

// Close mobile profile menu
function closeMobileProfileMenu() {
    document.getElementById('mobileProfileMenu').classList.add('hidden');
}

// Show history from mobile menu
function showHistoryFromMobile() {
    closeMobileProfileMenu();
    showHistory();
}

// Initialize immediately when script loads (not waiting for window.load)
(function() {
    // Handle OAuth callback immediately
    if (window.location.hash && window.location.hash.includes('access_token')) {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            window.location.href = '/app.html' + window.location.hash;
            return;
        }
    }
    
    // Initialize auth when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        // DOM already loaded
        initAuth();
    }
})();
