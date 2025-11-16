import { getLoggedInUser, requireAuth, logoutUser } from './supabase-auth.js';
import { getRows, addRow, updateRow, deleteRow } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth(); // Ensure user is logged in

    const user = getLoggedInUser();
    if (!user) {
        alert('Access Denied: Please log in.');
        logoutUser();
        return;
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

    await loadEvents();
    setupEventListeners();
});

async function loadEvents() {
    const { data: events, error } = await getRows('events');
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;
    eventsList.innerHTML = ''; // Clear existing items

    if (error) {
        console.error("Error fetching events:", error);
        eventsList.innerHTML = '<p>Error loading events.</p>';
        return;
    }

    if (events.length === 0) {
        eventsList.innerHTML = '<p>No events found.</p>';
        return;
    }

    events.forEach(event => {
        const li = document.createElement('li');
        li.classList.add('event-item');
        li.innerHTML = `
            <strong>${event.title}</strong> (${new Date(event.date).toLocaleDateString()}) - ${event.club}
            <span class="status ${event.approved ? 'approved' : 'pending'}">${event.approved ? 'Approved' : 'Pending'}</span>
            <div class="actions">
                <button class="approve-btn" data-id="${event.id}" ${event.approved ? 'disabled' : ''}>Approve</button>
                <button class="delete-btn" data-id="${event.id}">Delete</button>
            </div>
        `;
        eventsList.appendChild(li);
    });
}

function setupEventListeners() {
    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }

    const eventsList = document.getElementById('eventsList');
    if (eventsList) {
        eventsList.addEventListener('click', async (event) => {
            if (event.target.classList.contains('approve-btn')) {
                const id = event.target.dataset.id;
                await approveEvent(id);
            } else if (event.target.classList.contains('delete-btn')) {
                const id = event.target.dataset.id;
                await deleteEvent(id);
            }
        });
    }
}

async function handleAddEvent(event) {
    event.preventDefault();
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const club = document.getElementById('eventClub').value;

    if (!title || !date || !club) {
        alert('Please fill all fields.');
        return;
    }

    const newEvent = {
        title: title,
        date: date,
        club: club,
        approved: false // New events are pending by default
    };

    const { data, error } = await addRow('events', newEvent);
    if (error) {
        console.error("Error adding event:", error);
        alert(`Failed to add event. ${error.message}`);
    } else {
        alert('Event added successfully!');
        document.getElementById('addEventForm').reset();
        loadEvents(); // Reload events list
    }
}

async function approveEvent(id) {
    if (!confirm('Are you sure you want to approve this event?')) return;
    const { error } = await updateRow('events', { id: `eq.${id}` }, { approved: true });
    if (error) {
        console.error("Error approving event:", error);
        alert(`Failed to approve event. ${error.message}`);
    } else {
        alert('Event approved successfully!');
        loadEvents(); // Reload events list
    }
}

async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error } = await deleteRow('events', { id: `eq.${id}` });
    if (error) {
        console.error("Error deleting event:", error);
        alert(`Failed to delete event. ${error.message}`);
    } else {
        alert('Event deleted successfully!');
        loadEvents(); // Reload events list
    }
}
