// Auth.js - Handle authentication and page protection

function checkAuth() {
    const username = localStorage.getItem('universe_user');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // If on login page, allow access
    if (currentPage === 'index.html' || currentPage === '' || currentPage.endsWith('/')) {
        return;
    }
    
    // For student pages, redirect to login if no student username
    if (currentPage === 'dashboard.html' || currentPage === 'events.html' || currentPage === 'lostfound.html') {
        if (!username) {
            window.location.href = 'index.html';
            return;
        }
        displayUsername();
    }
}

function displayUsername() {
    const username = localStorage.getItem('universe_user');
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = `Welcome, ${username}`;
    }
}

// Run auth check when page loads (but not on login page)
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Only check auth on protected pages, not on login page
    if (currentPage !== 'index.html' && currentPage !== '') {
        checkAuth();
    } else {
        // Still display username if on login page and already logged in
        displayUsername();
    }
    
    // Handle logout button if present
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('universe_user');
            window.location.href = 'index.html';
        });
    }
});

// Handle login page logic
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
if (currentPage === 'index.html' || currentPage === '' || currentPage.endsWith('/')) {
    document.addEventListener('DOMContentLoaded', function() {
        const usernameInput = document.getElementById('usernameInput');
        const enterBtn = document.getElementById('enterBtn');
        const demoBtn = document.getElementById('demoBtn');
        
        function login(username) {
            if (username.trim()) {
                localStorage.setItem('universe_user', username.trim());
                window.location.href = 'dashboard.html';
            } else {
                alert('Please enter a username');
            }
        }
        
        if (enterBtn) {
            enterBtn.addEventListener('click', function() {
                login(usernameInput.value);
            });
        }
        
        if (demoBtn) {
            demoBtn.addEventListener('click', function() {
                login('Demo User');
            });
        }
        
        // Allow Enter key to submit
        if (usernameInput) {
            usernameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    login(usernameInput.value);
                }
            });
            
            // Auto-focus input on load
            usernameInput.focus();
        }
    });
}
