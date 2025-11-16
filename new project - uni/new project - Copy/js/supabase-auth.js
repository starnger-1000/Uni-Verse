import { getRows } from './supabase-client.js';

const USER_STORAGE_KEY = "universe_user";

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

export async function loginUser(username, password) {
    console.log('loginUser called with:', username);
    
    try {
        // First try to find in test users (for demo)
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

        console.log('No test user found, trying Supabase');
        // Fallback to Supabase if not a test user
        const response = await getRows('users', { username: `eq.${username}` });
        const { data: users, error } = response;

        if (error) {
            console.error("Login error from Supabase:", error);
            return { user: null, error: "User not found" };
        }

        if (!users || users.length === 0) {
            console.log('No user found in Supabase');
            return { user: null, error: "User not found" };
        }

        const user = users[0];

        if (user.password !== password) {
            return { user: null, error: "Wrong password" };
        }

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return { user, error: null };
    } catch (e) {
        console.error("Login exception:", e);
        return { user: null, error: "An unexpected error occurred during login. Please check the console." };
    }
}

export function logoutUser() {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = 'index.html';
}

export function getLoggedInUser() {
    const userString = localStorage.getItem(USER_STORAGE_KEY);
    return userString ? JSON.parse(userString) : null;
}

export function requireAuth(redirectPath = 'index.html') {
    if (!getLoggedInUser()) {
        window.location.href = redirectPath;
    }
}
