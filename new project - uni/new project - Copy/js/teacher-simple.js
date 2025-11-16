console.log('========== Teacher simple JS loading ==========');
console.log('Current URL:', window.location.href);
console.log('Current time:', new Date().toLocaleTimeString());

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('========== DOMContentLoaded event fired ==========');
    
    // Check if user is logged in
    const userString = localStorage.getItem('universe_user');
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('universe_user exists:', !!userString);
    
    if (!userString) {
        console.log('❌ No user found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(userString);
    console.log('✓ User found:', user);
    console.log('User role:', user.role);
    
    if (user.role !== 'teacher') {
        console.log('❌ User is not a teacher, redirecting');
        window.location.href = 'index.html';
        return;
    }
    
    // Set welcome message
    const welcomeEl = document.getElementById('welcomeName');
    console.log('welcomeName element:', welcomeEl);
    if (welcomeEl) {
        welcomeEl.textContent = user.name || 'Teacher';
        console.log('✓ Set welcome message');
    }
    
    // Test: log all buttons
    const buttons = document.querySelectorAll('.sidebar-nav-item');
    console.log('Found sidebar buttons:', buttons.length);
    buttons.forEach((btn, idx) => {
        console.log(`  Button ${idx}: onclick="${btn.getAttribute('onclick')}"`);
    });
    
    // Test: log all tabs
    const tabs = document.querySelectorAll('.t-tab');
    console.log('Found .t-tab elements:', tabs.length);
    tabs.forEach((tab, idx) => {
        console.log(`  Tab ${idx}: id="${tab.id}", class="${tab.className}"`);
    });
    
    // ADD EVENT LISTENERS AS BACKUP
    console.log('Adding click event listeners to sidebar buttons...');
    buttons.forEach((btn, idx) => {
        btn.addEventListener('click', function(e) {
            console.log(`Button ${idx} clicked via event listener`);
            e.preventDefault();
            e.stopPropagation();
            // The onclick attribute should still fire, this is just backup
        });
    });
    
    console.log('✓ Teacher dashboard initialized');
});

// Tab navigation
function showTeacherTab(tabId) {
    console.log('========== showTeacherTab called ==========');
    console.log('Requested tab ID:', tabId);
    console.log('Timestamp:', new Date().toLocaleTimeString());
    
    // Hide all tabs
    const tabs = document.querySelectorAll('.t-tab');
    console.log('Total tabs found:', tabs.length);
    
    tabs.forEach(tab => {
        const hadActive = tab.classList.contains('active');
        tab.classList.remove('active');
        tab.style.display = 'none';  // FORCE HIDE
        console.log(`  ${hadActive ? '❌ Removed active from' : '  (was already inactive)'} ${tab.id}`);
    });
    
    // Show selected tab
    const tab = document.getElementById(tabId);
    console.log('Looking for tab with id:', tabId);
    console.log('Tab element found:', !!tab);
    
    if (tab) {
        tab.classList.add('active');
        tab.style.display = 'block';  // FORCE SHOW with !important
        const isNowActive = tab.classList.contains('active');
        console.log('✓ Added active class to', tabId, '- Confirmed active:', isNowActive);
        console.log('✓ Set display style to block');
        
        // Check computed style
        const computedStyle = window.getComputedStyle(tab);
        console.log('  Computed display property:', computedStyle.display);
    } else {
        console.warn('❌ Tab not found:', tabId);
        return;
    }
    
    // Update nav buttons
    const buttons = document.querySelectorAll('.sidebar-nav-item');
    console.log('Updating button styles, total buttons:', buttons.length);
    
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Find and activate the button that triggered this
    const selector = `button[onclick*="showTeacherTab('${tabId}')"]`;
    console.log('Looking for button with selector:', selector);
    const activeBtn = document.querySelector(selector);
    console.log('Button found:', !!activeBtn);
    
    if (activeBtn) {
        activeBtn.classList.add('active');
        console.log('✓ Activated button for tab:', tabId);
    }
    
    console.log('========== showTeacherTab complete ==========\n');
}

// Logout
function returnHome() {
    console.log('returnHome called');
    localStorage.removeItem('universe_user');
    window.location.href = 'index.html';
}

// Attendance functions
function toggleAttendance(btn) {
    console.log('toggleAttendance called');
    if (btn.classList.contains('present')) {
        btn.classList.remove('present');
        btn.classList.add('absent');
        btn.textContent = 'Absent';
    } else {
        btn.classList.remove('absent');
        btn.classList.add('present');
        btn.textContent = 'Present';
    }
}

function saveAttendance() {
    console.log('saveAttendance called');
    alert('Attendance saved successfully!');
}

function openOCRForAttendance() {
    console.log('openOCRForAttendance called');
    // Option 1: Open OCR dashboard in new tab
    // window.open('ocr-dashboard.html', '_blank');
    
    // Option 2: Navigate to OCR dashboard
    window.location.href = 'ocr-dashboard.html';
}

// OCR functions
function clearOCRImagePreview() {
    console.log('clearOCRImagePreview called');
    const previewContainer = document.getElementById('previewContainer');
    const uploadArea = document.getElementById('uploadArea');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (uploadArea) uploadArea.style.display = 'block';
}

function performOCRExtraction() {
    console.log('performOCRExtraction called');
    alert('OCR extraction started. This is a demo version.');
}

// Marks Management
function loadStudentMarks() {
    const classSelect = document.getElementById('classSelect');
    const selectedClass = classSelect ? classSelect.value : '';
    console.log('loadStudentMarks called for class:', selectedClass);
    
    if (!selectedClass) {
        const marksContent = document.getElementById('marksContent');
        const noClassSelected = document.getElementById('noClassSelected');
        if (marksContent) marksContent.style.display = 'none';
        if (noClassSelected) noClassSelected.style.display = 'block';
        return;
    }
    
    // Sample marks data
    const marksData = {
        'CSE-2A': [
            { roll: '01', name: 'Navneet Kumar', math: 85, science: 90, english: 78, history: 82 },
            { roll: '02', name: 'Rahul Singh', math: 92, science: 88, english: 85, history: 87 },
            { roll: '03', name: 'Priya Sharma', math: 78, science: 82, english: 88, history: 80 }
        ],
        'CSE-2B': [
            { roll: '04', name: 'Amit Patel', math: 88, science: 85, english: 80, history: 84 },
            { roll: '05', name: 'Deepika Verma', math: 95, science: 92, english: 90, history: 91 }
        ]
    };
    
    const studentMarks = marksData[selectedClass] || [];
    const marksContent = document.getElementById('marksContent');
    const noClassSelected = document.getElementById('noClassSelected');
    const classTitle = document.getElementById('classTitle');
    const marksTableBody = document.getElementById('marksTableBody');
    
    if (classTitle) classTitle.textContent = `Marks for ${selectedClass}`;
    
    if (marksTableBody) {
        marksTableBody.innerHTML = '';
        studentMarks.forEach(student => {
            const total = student.math + student.science + student.english + student.history;
            const average = (total / 4).toFixed(2);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.roll}</td>
                <td>${student.name}</td>
                <td>${student.math}</td>
                <td>${student.science}</td>
                <td>${student.english}</td>
                <td>${student.history}</td>
                <td>${total}</td>
                <td>${average}</td>
            `;
            marksTableBody.appendChild(row);
        });
    }
    
    if (marksContent) marksContent.style.display = 'block';
    if (noClassSelected) noClassSelected.style.display = 'none';
}

// Analytics - Initialize Performance Graph
function initializePerformanceGraph() {
    console.log('Initializing performance graph');
    const chartCanvas = document.getElementById('t_performanceGraph');
    
    if (!chartCanvas) {
        console.warn('Chart canvas not found');
        return;
    }
    
    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet');
        setTimeout(initializePerformanceGraph, 500);
        return;
    }
    
    // Create chart
    try {
        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Math', 'Science', 'English', 'History', 'Programming'],
                datasets: [
                    {
                        label: 'CSE-2A Average',
                        data: [85, 88, 81, 84, 87],
                        backgroundColor: 'rgba(102, 126, 234, 0.7)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'CSE-2B Average',
                        data: [88, 86, 84, 86, 89],
                        backgroundColor: 'rgba(79, 195, 247, 0.7)',
                        borderColor: 'rgba(79, 195, 247, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#e0e0e0' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
        console.log('✓ Chart initialized successfully');
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

// Make functions globally available
window.showTeacherTab = showTeacherTab;
window.returnHome = returnHome;
window.toggleAttendance = toggleAttendance;
window.saveAttendance = saveAttendance;
window.openOCRForAttendance = openOCRForAttendance;
window.clearOCRImagePreview = clearOCRImagePreview;
window.performOCRExtraction = performOCRExtraction;
window.loadStudentMarks = loadStudentMarks;
window.initializePerformanceGraph = initializePerformanceGraph;

// Initialize chart when performance tab is shown (wrap original function)
const originalShowTeacherTab = window.showTeacherTab;
window.showTeacherTab = function(tabId) {
    originalShowTeacherTab(tabId);
    if (tabId === 't_performance') {
        setTimeout(initializePerformanceGraph, 100);
    }
};

console.log('========== Functions exposed to window object ==========');
console.log('window.showTeacherTab:', typeof window.showTeacherTab);
console.log('window.returnHome:', typeof window.returnHome);
console.log('========== Teacher simple JS loaded successfully ==========\n');
