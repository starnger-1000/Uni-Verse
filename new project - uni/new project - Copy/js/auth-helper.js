// Auth Helper - Non-module version for inline use
const USER_STORAGE_KEY = "universe_user";

function getLoggedInUser() {
    const userString = localStorage.getItem(USER_STORAGE_KEY);
    return userString ? JSON.parse(userString) : null;
}

function requireAuth(redirectPath = 'index.html') {
    if (!getLoggedInUser()) {
        window.location.href = redirectPath;
    }
}

function logoutUser() {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = 'index.html';
}

// Student data functions - stub implementations
async function getStudentDetails(roll) {
    console.log('getStudentDetails called for roll:', roll);
    // Return mock data or empty object
    return {
        roll: roll,
        name: 'Student Name',
        email: 'student@university.edu',
        class: 'CSE-2A'
    };
}

function displayStudentDetails(student, elementIdPrefix) {
    if (!student) {
        console.warn("No student data to display.");
        return;
    }
    const nameEl = document.getElementById(`${elementIdPrefix}Name`);
    const emailEl = document.getElementById(`${elementIdPrefix}Email`);
    const rollEl = document.getElementById(`${elementIdPrefix}Roll`);
    const classEl = document.getElementById(`${elementIdPrefix}Class`);
    
    if (nameEl) nameEl.textContent = student.name || 'N/A';
    if (emailEl) emailEl.textContent = student.email || 'N/A';
    if (rollEl) rollEl.textContent = student.roll || 'N/A';
    if (classEl) classEl.textContent = student.class || 'N/A';
}

// Make all functions globally accessible
window.getLoggedInUser = getLoggedInUser;
window.requireAuth = requireAuth;
window.logoutUser = logoutUser;
window.getStudentDetails = getStudentDetails;
window.displayStudentDetails = displayStudentDetails;

console.log('Auth helper loaded successfully');

