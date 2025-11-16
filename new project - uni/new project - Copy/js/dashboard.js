import { getLoggedInUser, requireAuth, logoutUser } from './supabase-auth.js';
import { getRows } from './supabase-client.js';
import { getStudentDetails, displayStudentDetails } from './student-data.js';

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth(); // Ensure user is logged in

    const user = getLoggedInUser();
    if (!user || user.role !== 'student') {
        alert('Access Denied: Only students can view this dashboard.');
        logoutUser(); // Redirect to login
        return;
    }

    // Display student details
    const student = await getStudentDetails(user.username); // Assuming username is student_id or roll
    if (student) {
        displayStudentDetails(student, 'student');
        await loadDashboardData(student.roll);
    } else {
        console.error("Could not load student details for user:", user.username);
        document.getElementById('studentName').textContent = 'Error loading student data.';
    }

    // Navbar welcome message
    const welcomeNameElement = document.getElementById('welcomeName');
    if (welcomeNameElement) {
        welcomeNameElement.textContent = user.name || user.username;
    }

    // Logout button functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }
});

async function loadDashboardData(studentRoll) {
    // Fetch Marks
    const { data: marks, error: marksError } = await getRows('marks', { roll: `eq.${studentRoll}` });
    if (marksError) {
        console.error("Error fetching marks:", marksError);
    } else {
        updateMarksChart(marks);
        updateMarksTable(marks);
    }

    // Fetch Attendance
    const { data: attendance, error: attendanceError } = await getRows('attendance', { roll: `eq.${studentRoll}` });
    if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
    } else {
        updateAttendanceChart(attendance);
        updateAttendanceTable(attendance);
    }

    // Fetch Approved Events
    const { data: events, error: eventsError } = await getRows('events', { approved: `eq.TRUE` });
    if (eventsError) {
        console.error("Error fetching events:", eventsError);
    } else {
        updateEventsList(events);
    }

    // Fetch Approved Lost & Found
    const { data: lostFound, error: lostFoundError } = await getRows('lost_found', { approved: `eq.TRUE` });
    if (lostFoundError) {
        console.error("Error fetching lost and found items:", lostFoundError);
    } else {
        updateLostFoundList(lostFound);
    }
}

function updateMarksChart(marks) {
    const ctx = document.getElementById('marksChart').getContext('2d');
    const subjects = [...new Set(marks.map(m => m.subject))];
    const data = subjects.map(subject => {
        const subjectMarks = marks.filter(m => m.subject === subject);
        return subjectMarks.reduce((sum, m) => sum + m.marks, 0) / subjectMarks.length; // Average marks
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [{
                label: 'Average Marks',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateMarksTable(marks) {
    const marksTableBody = document.getElementById('marksTableBody');
    if (!marksTableBody) return;
    marksTableBody.innerHTML = ''; // Clear existing rows

    marks.forEach(mark => {
        const row = marksTableBody.insertRow();
        row.insertCell().textContent = mark.subject;
        row.insertCell().textContent = mark.marks;
        row.insertCell().textContent = mark.teacher_name;
    });
}

function updateAttendanceChart(attendance) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    const subjects = [...new Set(attendance.map(a => a.subject))];
    const data = subjects.map(subject => {
        const subjectAttendance = attendance.filter(a => a.subject === subject);
        const presentCount = subjectAttendance.filter(a => a.status === 'Present').length;
        return (presentCount / subjectAttendance.length) * 100; // Percentage present
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: subjects,
            datasets: [{
                label: 'Attendance Percentage',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
        }
    });
}

function updateAttendanceTable(attendance) {
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    if (!attendanceTableBody) return;
    attendanceTableBody.innerHTML = ''; // Clear existing rows

    attendance.forEach(att => {
        const row = attendanceTableBody.insertRow();
        row.insertCell().textContent = att.date;
        row.insertCell().textContent = att.subject;
        row.insertCell().textContent = att.status;
        row.insertCell().textContent = att.teacher_name;
    });
}

function updateEventsList(events) {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;
    eventsList.innerHTML = ''; // Clear existing items

    if (events.length === 0) {
        eventsList.innerHTML = '<p>No upcoming events.</p>';
        return;
    }

    events.forEach(event => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${event.title}</strong> (${new Date(event.date).toLocaleDateString()}) - ${event.club}`;
        eventsList.appendChild(li);
    });
}

function updateLostFoundList(lostFound) {
    const lostFoundList = document.getElementById('lostFoundList');
    if (!lostFoundList) return;
    lostFoundList.innerHTML = ''; // Clear existing items

    if (lostFound.length === 0) {
        lostFoundList.innerHTML = '<p>No lost or found items.</p>';
        return;
    }

    lostFound.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.item}</strong> found at ${item.location}`;
        lostFoundList.appendChild(li);
    });
}
