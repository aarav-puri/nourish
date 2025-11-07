// Authentication UI Logic
let currentUser = null;

// Initialize auth state
async function initAuth() {
    try {
        currentUser = await supabaseAuth.getCurrentUser();
        updateAuthUI();
        
        // Listen for auth changes
        supabaseAuth.onAuthStateChange((event, session) => {
            currentUser = session?.user || null;
            updateAuthUI();
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
            if (userEmail) userEmail.textContent = currentUser.email;
        }
    } else {
        // User is logged out
        if (authBtn) authBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }
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
    dropdown.classList.toggle('hidden');
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
        
        if (products.length === 0) {
            historyContent.innerHTML = '<p class="no-history">No scanned products yet</p>';
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
        historyContent.innerHTML = '<p class="error">Failed to load history</p>';
        console.error('History error:', error);
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
    if (!currentUser) return; // Don't save if not logged in
    
    try {
        await supabaseDB.saveScannedProduct(barcode, productName, productData);
    } catch (error) {
        console.error('Save product error:', error);
    }
}

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

// Initialize on page load
if (typeof supabaseAuth !== 'undefined') {
    initAuth();
}
