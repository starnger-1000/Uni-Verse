// Import statements removed - using global functions instead
// getRows, addRow, updateRow, deleteRow are now stub functions
// getLoggedInUser, requireAuth, logoutUser come from auth-helper.js
// getStudentDetails, displayStudentDetails come from auth-helper.js

console.log('Teacher.js loading...');

// Stub implementations for Supabase functions
async function getRows(tableName, filters = {}, select = '*') {
    console.log('getRows stub called:', tableName);
    return { data: [], error: null };
}

async function addRow(tableName, data) {
    console.log('addRow stub called:', tableName);
    return { data: null, error: null };
}

async function updateRow(tableName, filters, data) {
    console.log('updateRow stub called:', tableName);
    return { data: null, error: null };
}

async function deleteRow(tableName, filters) {
    console.log('deleteRow stub called:', tableName);
    return { data: null, error: null };
}

let currentUser;
let selectedClass = '';
let studentsInClass = [];

console.log('Teacher.js setup complete');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Teacher page DOMContentLoaded');
    
    // Check auth
    const user = getLoggedInUser();
    console.log('Current user:', user);
    
    if (!user) {
        console.log('No user logged in, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    
    if (currentUser.role !== 'teacher') {
        console.log('User is not a teacher:', currentUser.role);
        alert('Access Denied: Only teachers can view this page.');
        logoutUser();
        return;
    }
    
    console.log('Teacher authenticated:', currentUser.name);

    // Navbar welcome message
    const welcomeNameElement = document.getElementById('welcomeName');
    if (welcomeNameElement) {
        welcomeNameElement.textContent = currentUser.name || currentUser.username;
    }

    // Logout button functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    await loadClasses();
    setupEventListeners();
    loadTeacherDashboard();
    initializeForms();
    
    // Ensure home tab is shown on load
    showTeacherTab('t_home');
    console.log('Teacher dashboard initialized');
});

function initializeForms() {
    // Events Form
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('eventTitle').value.trim();
            const date = document.getElementById('eventDate').value;
            const club = document.getElementById('eventClub').value.trim();
            const description = document.getElementById('eventDescription').value.trim();
            
            if (!title || !date || !club) {
                alert('Please fill all required fields');
                return;
            }
            
            const newEvent = {
                title,
                date,
                club,
                description,
                approved: false,
                created_by: currentUser.username
            };
            
            const { error } = await addRow('events', newEvent);
            if (error) {
                alert('Error creating event: ' + error);
            } else {
                alert('Event created successfully!');
                eventForm.reset();
                await loadTeacherDashboard();
            }
        });
    }
    
    // Lost & Found Form
    const lfForm = document.getElementById('lfForm');
    if (lfForm) {
        lfForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemName = document.getElementById('lfItemName').value.trim();
            const location = document.getElementById('lfItemLocation').value.trim();
            const type = document.getElementById('lfItemType').value;
            const description = document.getElementById('lfItemDescription').value.trim();
            
            if (!itemName || !location || !type) {
                alert('Please fill all required fields');
                return;
            }
            
            const newItem = {
                item: itemName,
                location,
                type,
                description,
                approved: false,
                reported_by: currentUser.username
            };
            
            const { error } = await addRow('lost_found', newItem);
            if (error) {
                alert('Error reporting item: ' + error);
            } else {
                alert('Item reported successfully!');
                lfForm.reset();
                await loadTeacherDashboard();
            }
        });
    }
}

async function loadClasses() {
    try {
        const { data: students, error } = await getRows('students', { select: 'class' });
        if (error) {
            console.error("Error fetching classes:", error);
            // Use default classes as fallback
            const classes = ['CSE-2A', 'CSE-2B'];
            const classSelect = document.getElementById('classSelect');
            if (classSelect) {
                classSelect.innerHTML = '<option value="">Select Class</option>';
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls;
                    option.textContent = cls;
                    classSelect.appendChild(option);
                });
            }
            return;
        }
        const classes = [...new Set(students.map(s => s.class))].sort();
        const classSelect = document.getElementById('classSelect');
        if (classSelect) {
            classSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls;
                option.textContent = cls;
                classSelect.appendChild(option);
            });
        }
    } catch (e) {
        console.error("Error in loadClasses:", e);
        // Use default classes as fallback
        const classes = ['CSE-2A', 'CSE-2B'];
        const classSelect = document.getElementById('classSelect');
        if (classSelect) {
            classSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls;
                option.textContent = cls;
                classSelect.appendChild(option);
            });
        }
    }
}

async function loadStudentsForClass(cls) {
    if (!cls) {
        studentsInClass = [];
        document.getElementById('studentList').innerHTML = '';
        document.getElementById('marksTableBody').innerHTML = '';
        document.getElementById('attendanceTableBody').innerHTML = '';
        return;
    }
    const { data: students, error } = await getRows('students', { class: `eq.${cls}`, select: 'roll,name' });
    if (error) {
        console.error("Error fetching students:", error);
        studentsInClass = [];
        return;
    }
    studentsInClass = students.sort((a, b) => a.name.localeCompare(b.name));
    renderStudentList();
}

function renderStudentList() {
    const studentListDiv = document.getElementById('studentList');
    studentListDiv.innerHTML = '';
    studentsInClass.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.classList.add('student-card');
        studentCard.dataset.roll = student.roll;
        studentCard.innerHTML = `
            <span>${student.name} (${student.roll})</span>
            <button class="view-details-btn" data-roll="${student.roll}">View Details</button>
        `;
        studentListDiv.appendChild(studentCard);
    });
}

async function loadTeacherDashboard() {
    await loadEventsAndLostFound();
}

async function loadEventsAndLostFound() {
    const { data: events, error: eventsError } = await getRows('events');
    if (eventsError) {
        console.error("Error fetching events:", eventsError);
    } else {
        renderEvents(events);
    }

    const { data: lostFound, error: lostFoundError } = await getRows('lost_found');
    if (lostFoundError) {
        console.error("Error fetching lost and found items:", lostFoundError);
    } else {
        renderLostFound(lostFound);
    }
}

function renderEvents(events) {
    const eventsTableBody = document.getElementById('eventsTableBody');
    if (!eventsTableBody) return;
    eventsTableBody.innerHTML = '';
    events.forEach(event => {
        const row = eventsTableBody.insertRow();
        row.insertCell().textContent = event.title;
        row.insertCell().textContent = new Date(event.date).toLocaleDateString();
        row.insertCell().textContent = event.club;
        row.insertCell().textContent = event.approved ? 'Yes' : 'No';
        const actionsCell = row.insertCell();
        if (!event.approved) {
            const approveBtn = document.createElement('button');
            approveBtn.textContent = 'Approve';
            approveBtn.classList.add('btn', 'btn-success', 'btn-sm');
            approveBtn.onclick = () => approveItem('events', event.id);
            actionsCell.appendChild(approveBtn);
        }
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'ml-2');
        deleteBtn.onclick = () => deleteItem('events', event.id);
        actionsCell.appendChild(deleteBtn);
    });
}

function renderLostFound(items) {
    const lostFoundTableBody = document.getElementById('lostFoundTableBody');
    if (!lostFoundTableBody) return;
    lostFoundTableBody.innerHTML = '';
    items.forEach(item => {
        const row = lostFoundTableBody.insertRow();
        row.insertCell().textContent = item.item;
        row.insertCell().textContent = item.location;
        row.insertCell().textContent = item.approved ? 'Yes' : 'No';
        const actionsCell = row.insertCell();
        if (!item.approved) {
            const approveBtn = document.createElement('button');
            approveBtn.textContent = 'Approve';
            approveBtn.classList.add('btn', 'btn-success', 'btn-sm');
            approveBtn.onclick = () => approveItem('lost_found', item.id);
            actionsCell.appendChild(approveBtn);
        }
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'ml-2');
        deleteBtn.onclick = () => deleteItem('lost_found', item.id);
        actionsCell.appendChild(deleteBtn);
    });
}

async function approveItem(tableName, id) {
    const { error } = await updateRow(tableName, { id: `eq.${id}` }, { approved: true });
    if (error) {
        console.error(`Error approving item in ${tableName}:`, error);
        alert(`Failed to approve item. ${error.message}`);
    } else {
        alert('Item approved successfully!');
        loadEventsAndLostFound(); // Reload data
    }
}

async function deleteItem(tableName, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const { error } = await deleteRow(tableName, { id: `eq.${id}` });
    if (error) {
        console.error(`Error deleting item from ${tableName}:`, error);
        alert(`Failed to delete item. ${error.message}`);
    } else {
        alert('Item deleted successfully!');
        loadEventsAndLostFound(); // Reload data
    }
}

function setupEventListeners() {
    const classSelect = document.getElementById('classSelect');
    if (classSelect) {
        classSelect.addEventListener('change', async (event) => {
            selectedClass = event.target.value;
            await loadStudentsForClass(selectedClass);
        });
    }

    const studentList = document.getElementById('studentList');
    if (studentList) {
        studentList.addEventListener('click', async (event) => {
            if (event.target.classList.contains('view-details-btn')) {
                const roll = event.target.dataset.roll;
                await showStudentDetailsModal(roll);
            }
        });
    }

    const addMarkForm = document.getElementById('addMarkForm');
    if (addMarkForm) {
        addMarkForm.addEventListener('submit', handleAddMark);
    }
    
    const updateMarkForm = document.getElementById('updateMarkForm');
    if (updateMarkForm) {
        updateMarkForm.addEventListener('submit', handleUpdateMark);
    }
    
    const addAttendanceForm = document.getElementById('addAttendanceForm');
    if (addAttendanceForm) {
        addAttendanceForm.addEventListener('submit', handleAddAttendance);
    }
}

async function showStudentDetailsModal(roll) {
    const student = await getStudentDetails(roll);
    if (student) {
        displayStudentDetails(student, 'modalStudent');
        document.getElementById('studentDetailsModalLabel').textContent = `${student.name}'s Details`;
        document.getElementById('studentDetailsModal').style.display = 'block'; // Show modal

        // Load marks and attendance for the selected student
        await loadStudentMarks(roll);
        await loadStudentAttendance(roll);

        // Set hidden input for current student roll in forms
        document.getElementById('currentStudentRollMarks').value = roll;
        document.getElementById('currentStudentRollAttendance').value = roll;
    }
}

const closeBtn = document.querySelector('.close-button');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('studentDetailsModal').style.display = 'none'; // Hide modal
    });
}

window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('studentDetailsModal')) {
        document.getElementById('studentDetailsModal').style.display = 'none'; // Hide modal if clicked outside
    }
});

async function loadStudentAttendance(roll) {
    const { data: attendance, error } = await getRows('attendance', { roll: `eq.${roll}` });
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    attendanceTableBody.innerHTML = ''; // Clear existing attendance

    if (error) {
        console.error("Error fetching student attendance:", error);
        attendanceTableBody.innerHTML = `<tr><td colspan="5">Error loading attendance.</td></tr>`;
        return;
    }
    if (attendance.length === 0) {
        attendanceTableBody.innerHTML = `<tr><td colspan="5">No attendance records found for this student.</td></tr>`;
        return;
    }

    attendance.forEach(att => {
        const row = attendanceTableBody.insertRow();
        row.insertCell().textContent = new Date(att.date).toLocaleDateString();
        row.insertCell().textContent = att.subject;
        row.insertCell().textContent = att.status;
        row.insertCell().textContent = att.teacher_name;
        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('btn', 'btn-info', 'btn-sm');
        editBtn.onclick = () => populateUpdateAttendanceForm(att);
        actionsCell.appendChild(editBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'ml-2');
        deleteBtn.onclick = () => deleteAttendance(att.id);
        actionsCell.appendChild(deleteBtn);
    });
}

async function handleAddMark(event) {
    event.preventDefault();
    const roll = document.getElementById('currentStudentRollMarks').value;
    const subject = document.getElementById('addMarkSubject').value;
    const marks = document.getElementById('addMarkValue').value;

    if (!roll || !subject || !marks) {
        alert('Please fill all fields for adding marks.');
        return;
    }

    const newMark = {
        class: selectedClass, // Assuming selectedClass is available from dropdown
        roll: roll,
        subject: subject,
        marks: parseInt(marks),
        teacher_name: currentUser.name || currentUser.username
    };

    const { data, error } = await addRow('marks', newMark);
    if (error) {
        console.error("Error adding mark:", error);
        alert(`Failed to add mark. ${error.message}`);
    } else {
        alert('Mark added successfully!');
        document.getElementById('addMarkForm').reset();
        loadStudentMarks(roll); // Reload marks for the student
    }
}

function populateUpdateMarkForm(mark) {
    document.getElementById('updateMarkId').value = mark.id;
    document.getElementById('updateMarkSubject').value = mark.subject;
    document.getElementById('updateMarkValue').value = mark.marks;
    document.getElementById('updateMarkSection').style.display = 'block'; // Show update form
}

async function handleUpdateMark(event) {
    event.preventDefault();
    const id = document.getElementById('updateMarkId').value;
    const roll = document.getElementById('currentStudentRollMarks').value;
    const subject = document.getElementById('updateMarkSubject').value;
    const marks = document.getElementById('updateMarkValue').value;

    if (!id || !roll || !subject || !marks) {
        alert('Please fill all fields for updating marks.');
        return;
    }

    const updatedMark = {
        subject: subject,
        marks: parseInt(marks),
        teacher_name: currentUser.name || currentUser.username // Update teacher if needed
    };

    const { error } = await updateRow('marks', { id: `eq.${id}` }, updatedMark);
    if (error) {
        console.error("Error updating mark:", error);
        alert(`Failed to update mark. ${error.message}`);
    } else {
        alert('Mark updated successfully!');
        document.getElementById('updateMarkForm').reset();
        document.getElementById('updateMarkSection').style.display = 'none'; // Hide update form
        loadStudentMarks(roll); // Reload marks for the student
    }
}

async function deleteMark(id) {
    if (!confirm('Are you sure you want to delete this mark?')) return;
    const roll = document.getElementById('currentStudentRollMarks').value;
    const { error } = await deleteRow('marks', { id: `eq.${id}` });
    if (error) {
        console.error("Error deleting mark:", error);
        alert(`Failed to delete mark. ${error.message}`);
    } else {
        alert('Mark deleted successfully!');
        loadStudentMarks(roll); // Reload marks for the student
    }
}

async function handleAddAttendance(event) {
    event.preventDefault();
    const roll = document.getElementById('currentStudentRollAttendance').value;
    const subject = document.getElementById('addAttendanceSubject').value;
    const status = document.getElementById('addAttendanceStatus').value;
    const date = document.getElementById('addAttendanceDate').value;

    if (!roll || !subject || !status || !date) {
        alert('Please fill all fields for adding attendance.');
        return;
    }

    const newAttendance = {
        class: selectedClass, // Assuming selectedClass is available
        roll: roll,
        subject: subject,
        status: status,
        date: date,
        teacher_name: currentUser.name || currentUser.username
    };

    const { data, error } = await addRow('attendance', newAttendance);
    if (error) {
        console.error("Error adding attendance:", error);
        alert(`Failed to add attendance. ${error.message}`);
    } else {
        alert('Attendance added successfully!');
        document.getElementById('addAttendanceForm').reset();
        loadStudentAttendance(roll); // Reload attendance for the student
    }
}

function populateUpdateAttendanceForm(att) {
    document.getElementById('updateAttendanceId').value = att.id;
    document.getElementById('updateAttendanceSubject').value = att.subject;
    document.getElementById('updateAttendanceStatus').value = att.status;
    document.getElementById('updateAttendanceDate').value = att.date; // Assuming date is in YYYY-MM-DD format
    document.getElementById('updateAttendanceSection').style.display = 'block'; // Show update form
}

async function handleUpdateAttendance(event) {
    event.preventDefault();
    const id = document.getElementById('updateAttendanceId').value;
    const roll = document.getElementById('currentStudentRollAttendance').value;
    const subject = document.getElementById('updateAttendanceSubject').value;
    const status = document.getElementById('updateAttendanceStatus').value;
    const date = document.getElementById('updateAttendanceDate').value;

    if (!id || !roll || !subject || !status || !date) {
        alert('Please fill all fields for updating attendance.');
        return;
    }

    const updatedAttendance = {
        subject: subject,
        status: status,
        date: date,
        teacher_name: currentUser.name || currentUser.username
    };

    const { error } = await updateRow('attendance', { id: `eq.${id}` }, updatedAttendance);
    if (error) {
        console.error("Error updating attendance:", error);
        alert(`Failed to update attendance. ${error.message}`);
    } else {
        alert('Attendance updated successfully!');
        document.getElementById('updateAttendanceForm').reset();
        document.getElementById('updateAttendanceSection').style.display = 'none'; // Hide update form
        loadStudentAttendance(roll); // Reload attendance for the student
    }
}

async function deleteAttendance(id) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    const roll = document.getElementById('currentStudentRollAttendance').value;
    const { error } = await deleteRow('attendance', { id: `eq.${id}` });
    if (error) {
        console.error("Error deleting attendance:", error);
        alert(`Failed to delete attendance. ${error.message}`);
    } else {
        alert('Attendance deleted successfully!');
        loadStudentAttendance(roll); // Reload attendance for the student
    }
}

// ===== TAB NAVIGATION =====
function showTeacherTab(tabId) {
    console.log('showTeacherTab called with:', tabId);
    
    // Hide all tabs
    const tabs = document.querySelectorAll('.t-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log('Tab shown:', tabId);
    } else {
        console.warn('Tab not found:', tabId);
    }
    
    // Update active nav button
    const navButtons = document.querySelectorAll('.sidebar-nav-item');
    navButtons.forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`button[onclick="showTeacherTab('${tabId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Make sure function is globally accessible
window.showTeacherTab = showTeacherTab;

// ===== LOGOUT =====
function returnHome() {
    logoutUser();
}

// Make sure function is globally accessible
window.returnHome = returnHome;

// ===== ATTENDANCE TOGGLE =====
function toggleAttendance(btn) {
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

window.toggleAttendance = toggleAttendance;

// ===== SAVE ATTENDANCE =====
function saveAttendance() {
    const table = document.querySelector('#t_attendance .t-table');
    if (!table) {
        alert('No attendance table found');
        return;
    }
    
    const records = [];
    const rows = table.querySelectorAll('tbody tr, tr');
    rows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 3) {
            const roll = cells[0].textContent.trim();
            const name = cells[1].textContent.trim();
            const btn = cells[2].querySelector('button');
            const status = btn ? btn.textContent.trim() : 'Absent';
            
            if (/\d+/.test(roll)) {
                records.push({ roll, name, status });
            }
        }
    });
    
    if (records.length === 0) {
        alert('No attendance records to save');
        return;
    }
    
    alert(`✓ Attendance saved successfully!\n\nRecords: ${records.length} students`);
    console.log('Attendance saved:', records);
}

window.saveAttendance = saveAttendance;

// ===== OCR ATTENDANCE =====
function openOCRForAttendance() {
    showTeacherTab('t_ocr');
}

window.openOCRForAttendance = openOCRForAttendance;

// ===== LOAD MARKS FOR CLASS (wrapper function) =====
async function loadStudentMarks(roll) {
    // If no roll provided, load all marks for selected class
    if (!roll) {
        const classSelect = document.getElementById('classSelect');
        const selectedClass = classSelect?.value;
        
        if (!selectedClass) {
            document.getElementById('noClassSelected').style.display = 'block';
            document.getElementById('marksContent').style.display = 'none';
            return;
        }
        
        const { data: marks, error } = await getRows('marks', { class: `eq.${selectedClass}` });
        const marksTableBody = document.getElementById('marksTableBody');
        
        if (error) {
            console.error("Error fetching marks:", error);
            marksTableBody.innerHTML = `<tr><td colspan="8">Error loading marks.</td></tr>`;
            document.getElementById('marksContent').style.display = 'block';
            document.getElementById('noClassSelected').style.display = 'none';
            return;
        }
        
        if (marks.length === 0) {
            marksTableBody.innerHTML = `<tr><td colspan="8">No marks found for this class.</td></tr>`;
            document.getElementById('marksContent').style.display = 'block';
            document.getElementById('noClassSelected').style.display = 'none';
            return;
        }
        
        // Group marks by student
        const studentMarks = {};
        marks.forEach(m => {
            if (!studentMarks[m.roll]) {
                studentMarks[m.roll] = { roll: m.roll, name: m.student_name || '', subjects: {} };
            }
            studentMarks[m.roll].subjects[m.subject] = m.marks;
        });
        
        marksTableBody.innerHTML = '';
        document.getElementById('classTitle').textContent = `Class: ${selectedClass}`;
        
        Object.values(studentMarks).forEach(student => {
            const row = marksTableBody.insertRow();
            row.insertCell().textContent = student.roll;
            row.insertCell().textContent = student.name;
            const math = student.subjects['Mathematics'] || '-';
            const science = student.subjects['Science'] || '-';
            const english = student.subjects['English'] || '-';
            const history = student.subjects['History'] || '-';
            row.insertCell().textContent = math;
            row.insertCell().textContent = science;
            row.insertCell().textContent = english;
            row.insertCell().textContent = history;
            
            // Calculate total and average
            const marks_array = [
                student.subjects['Mathematics'],
                student.subjects['Science'],
                student.subjects['English'],
                student.subjects['History']
            ].filter(m => m !== undefined);
            const total = marks_array.reduce((a, b) => a + b, 0) || '-';
            const average = marks_array.length > 0 ? (total / marks_array.length).toFixed(2) : '-';
            
            row.insertCell().textContent = total;
            row.insertCell().textContent = average;
        });
        
        document.getElementById('marksContent').style.display = 'block';
        document.getElementById('noClassSelected').style.display = 'none';
        return;
    }
    
    // Original function for loading individual student marks
    const { data: marks, error } = await getRows('marks', { roll: `eq.${roll}` });
    const marksTableBody = document.getElementById('marksTableBody');
    marksTableBody.innerHTML = ''; // Clear existing marks

    if (error) {
        console.error("Error fetching student marks:", error);
        marksTableBody.innerHTML = `<tr><td colspan="5">Error loading marks.</td></tr>`;
        return;
    }
    if (marks.length === 0) {
        marksTableBody.innerHTML = `<tr><td colspan="5">No marks found for this student.</td></tr>`;
        return;
    }

    marks.forEach(mark => {
        const row = marksTableBody.insertRow();
        row.insertCell().textContent = mark.subject;
        row.insertCell().textContent = mark.marks;
        row.insertCell().textContent = mark.teacher_name;
        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('btn', 'btn-info', 'btn-sm');
        editBtn.onclick = () => populateUpdateMarkForm(mark);
        actionsCell.appendChild(editBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'ml-2');
        deleteBtn.onclick = () => deleteMark(mark.id);
        actionsCell.appendChild(deleteBtn);
    });
}
