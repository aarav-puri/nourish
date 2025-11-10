// Authentication UI Logic
let currentUser = null;

// Initialize auth state
async function initAuth() {
    try {
        console.log('Initializing auth...');
        
        // Get current user immediately
        currentUser = await supabaseAuth.getCurrentUser();
        console.log('Current user:', currentUser?.email || 'Not signed in');
        updateAuthUI();
        
        // Listen for auth changes
        supabaseAuth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            currentUser = session?.user || null;
            updateAuthUI();
            
            if (event === 'SIGNED_IN') {
                console.log('User signed in successfully');
                showToast('Welcome back!');
                if (typeof closeAuthModal === 'function') {
                    closeAuthModal();
                }
                
                // Redirect to app page if on home page
                if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                    console.log('Redirecting to app page');
                    window.location.href = '/app.html';
                    return;
                }
                
                // Clean up OAuth hash from URL
                if (window.location.hash.includes('access_token')) {
                    console.log('Cleaning up OAuth hash from URL');
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
    console.log('Updating auth UI, currentUser:', currentUser);
    
    const authBtn = document.getElementById('authBtn');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    
    if (currentUser) {
        // User is logged in
        console.log('User is logged in, showing profile menu');
        if (authBtn) authBtn.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            
            // Get Discord username and avatar from user metadata
            const metadata = currentUser.user_metadata;
            const displayName = metadata?.full_name || metadata?.name || currentUser.email;
            const avatarUrl = metadata?.avatar_url || metadata?.picture;
            
            console.log('User metadata:', metadata);
            console.log('Display name:', displayName);
            console.log('Avatar URL:', avatarUrl);
            
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
        console.log('User is logged out, showing sign in button');
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
    document.getElementById('authModal').classList.remove('hidden');
    showLogin();
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
    clearAuthForms();
}

// Show signup form
function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    clearAuthForms();
}

// Clear form errors
function clearAuthForms() {
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('signupError').classList.add('hidden');
    document.getElementById('signupSuccess').classList.add('hidden');
}

// Handle Discord OAuth login
async function handleDiscordLogin() {
    try {
        console.log('Starting Discord login...');
        
        // Determine redirect URL
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const redirectUrl = isLocal 
            ? 'http://localhost:3000/app.html'
            : 'https://barcodesense.vercel.app/app.html';
            
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: redirectUrl
            }
        });
        
        if (error) throw error;
        console.log('Discord OAuth initiated with redirect:', redirectUrl);
    } catch (error) {
        console.error('Discord login error:', error);
        showToast('Discord login failed. Please try again.');
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
        errorEl.textContent = error.message;
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
    
    // Validate passwords match
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
        
        // Switch to login after 2 seconds
        setTimeout(() => {
            showLogin();
        }, 2000);
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        successEl.classList.add('hidden');
    }
}

// Handle logout
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
        console.log('Product saved successfully:', productName);
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

// Initialize immediately when script loads (not waiting for window.load)
(function() {
    console.log('Auth script loaded, checking for OAuth callback...');
    
    // Handle OAuth callback immediately
    if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('OAuth callback detected in hash');
        
        // Redirect to app.html if on home page
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            console.log('Redirecting to app.html with hash');
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
