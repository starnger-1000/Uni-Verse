// Test users for demo purposes
const TEST_USERS = [
    // Students
    { username: 'student1', password: 'password123', role: 'student', name: 'Navneet Kumar', id: 's001' },
    { username: 'student2', password: 'password123', role: 'student', name: 'Rahul Singh', id: 's002' },
    { username: 'priya', password: 'password123', role: 'student', name: 'Priya Sharma', id: 's003' },
    { username: 'arjun', password: 'password123', role: 'student', name: 'Arjun Patel', id: 's004' },
    // Teachers
    { username: 'randhir sir', password: 'password123', role: 'teacher', name: 'Randhir Singh', id: 't001' },
    { username: 'teacher1', password: 'password123', role: 'teacher', name: 'Ms. Kaur', id: 't002' },
];

const USER_STORAGE_KEY = "universe_user";

// Login function - no async needed for test users
function performLogin(username, password) {
    console.log('performLogin called with:', username);
    
    try {
        // Find test user
        const testUser = TEST_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (testUser) {
            console.log('Test user found:', testUser.username);
            if (testUser.password !== password) {
                console.log('Password mismatch');
                return { user: null, error: "Wrong password" };
            }
            console.log('Password match, setting localStorage');
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(testUser));
            return { user: testUser, error: null };
        }

        console.log('No test user found');
        return { user: null, error: "User not found" };
    } catch (e) {
        console.error("Login exception:", e);
        return { user: null, error: "An unexpected error occurred during login." };
    }
}

// Expose functions globally for onclick attributes in HTML
window.loginUser = function(mode) {
    if (mode === 'demo') {
        document.getElementById('error-message').textContent = 'Demo login is not available with Supabase integration.';
        window.showStudentLoginForm();
        return;
    }
    if (mode === 'teacher') {
        window.showTeacherLoginForm();
        return;
    }
    window.showStudentLoginForm();
};

window.showStudentLoginForm = function() {
    const overlay = document.getElementById('loginOverlay');
    const studentForm = document.getElementById('studentLoginForm');
    const teacherForm = document.getElementById('teacherLoginForm');
    const errorMessage = document.getElementById('student-error-message');

    overlay.classList.remove('hidden');
    studentForm.classList.remove('hidden');
    teacherForm.classList.add('hidden');
    errorMessage.textContent = '';

    const input = studentForm.querySelector('input[type="text"]');
    if (input) setTimeout(() => input.focus(), 100);
};

window.showTeacherLoginForm = function() {
    const overlay = document.getElementById('loginOverlay');
    const studentForm = document.getElementById('studentLoginForm');
    const teacherForm = document.getElementById('teacherLoginForm');
    const errorMessage = document.getElementById('teacher-error-message');

    overlay.classList.remove('hidden');
    studentForm.classList.add('hidden');
    teacherForm.classList.remove('hidden');
    errorMessage.textContent = '';

    const input = teacherForm.querySelector('input[type="text"]');
    if (input) setTimeout(() => input.focus(), 100);
};

window.closeLoginForm = function() {
    const overlay = document.getElementById('loginOverlay');
    overlay.classList.add('hidden');

    document.getElementById('studentLoginForm').classList.add('hidden');
    document.getElementById('teacherLoginForm').classList.add('hidden');
    document.getElementById('student-error-message').textContent = '';
    document.getElementById('teacher-error-message').textContent = '';
};

window.handleStudentLogin = async function() {
    const form = document.getElementById('studentForm');
    const usernameInput = form.querySelector('input[type="text"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const errorMessage = document.getElementById('student-error-message');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    console.log('Student login attempt:', username);

    if (!username || !password) {
        errorMessage.textContent = 'Please enter both Student ID and Password.';
        return;
    }

    try {
        console.log('Calling performLogin...');
        const result = performLogin(username, password);
        console.log('Login result:', result);
        
        const { user, error } = result;

        if (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error || 'An error occurred during login.';
            return;
        } 
        
        if (user) {
            console.log('User logged in:', user);
            if (user.role === 'student') {
                window.location.href = 'dashboard.html';
            } else {
                errorMessage.textContent = 'Access denied: Not a student account.';
            }
        } else {
            errorMessage.textContent = 'Login failed: No user found.';
        }
    } catch (e) {
        console.error('Login failed with exception:', e);
        errorMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
};

window.handleTeacherLogin = async function() {
    const form = document.getElementById('teacherForm');
    const usernameInput = form.querySelector('input[type="text"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const errorMessage = document.getElementById('teacher-error-message');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    console.log('Teacher login attempt:', username);

    if (!username || !password) {
        errorMessage.textContent = 'Please enter both Teacher ID and Password.';
        return;
    }

    try {
        console.log('Calling performLogin...');
        const result = performLogin(username, password);
        console.log('Login result:', result);
        
        const { user, error } = result;

        if (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error || 'An error occurred during login.';
            return;
        }
        
        if (user) {
            console.log('User logged in:', user);
            if (user.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                errorMessage.textContent = 'Access denied: Not a teacher account.';
            }
        } else {
            errorMessage.textContent = 'Login failed: No user found.';
        }
    } catch (e) {
        console.error('Login failed with exception:', e);
        errorMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
};

window.handleStudentDemo = function() {
    document.getElementById('student-error-message').textContent = 'Demo login is not available with Supabase integration.';
    window.showStudentLoginForm();
};

window.handleTeacherDemo = function() {
    document.getElementById('teacher-error-message').textContent = 'Demo login is not available with Supabase integration.';
    window.showTeacherLoginForm();
};

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) window.closeLoginForm();
        });
    }

    const formContainer = document.querySelector('.login-form-container');
    if (formContainer) {
        formContainer.addEventListener('click', (event) => event.stopPropagation());
    }

    const cards = document.querySelectorAll('.portal-card');
    const createRipple = (event) => {
        const card = event?.target.closest('.portal-card');
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        const x = event?.clientX - rect.left - size / 2;
        const y = event?.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        card.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    };

    const createParticles = (event) => {
        const card = event.currentTarget;
        if (Math.random() > 0.8) return;

        const rect = card.getBoundingClientRect();
        const particle = document.createElement('div');
        particle.classList.add('hover-particle');
        particle.style.left = (event.clientX - rect.left) + 'px';
        particle.style.top = (event.clientY - rect.top) + 'px';

        card.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    };

    cards.forEach(card => {
        card.addEventListener('click', createRipple);
        card.addEventListener('mousemove', createParticles);
    });

    // Add event listeners for portal buttons
    const studentPortalBtn = document.getElementById('studentPortalBtn');
    if (studentPortalBtn) {
        studentPortalBtn.addEventListener('click', window.showStudentLoginForm);
    }

    const teacherPortalBtn = document.getElementById('teacherPortalBtn');
    if (teacherPortalBtn) {
        teacherPortalBtn.addEventListener('click', window.showTeacherLoginForm);
    }
});
