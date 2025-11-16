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

    await loadLostFoundItems();
    setupEventListeners();
});

async function loadLostFoundItems() {
    const { data: items, error } = await getRows('lost_found');
    const lostFoundList = document.getElementById('lostFoundList');
    if (!lostFoundList) return;
    lostFoundList.innerHTML = ''; // Clear existing items

    if (error) {
        console.error("Error fetching lost and found items:", error);
        lostFoundList.innerHTML = '<p>Error loading lost and found items.</p>';
        return;
    }

    if (items.length === 0) {
        lostFoundList.innerHTML = '<p>No lost or found items.</p>';
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('lost-found-item');
        li.innerHTML = `
            <strong>${item.item}</strong> found at ${item.location}
            <span class="status ${item.approved ? 'approved' : 'pending'}">${item.approved ? 'Approved' : 'Pending'}</span>
            <div class="actions">
                <button class="approve-btn" data-id="${item.id}" ${item.approved ? 'disabled' : ''}>Approve</button>
                <button class="delete-btn" data-id="${item.id}">Delete</button>
            </div>
        `;
        lostFoundList.appendChild(li);
    });
}

function setupEventListeners() {
    const addLostFoundForm = document.getElementById('addLostFoundForm');
    if (addLostFoundForm) {
        addLostFoundForm.addEventListener('submit', handleAddLostFoundItem);
    }

    const lostFoundList = document.getElementById('lostFoundList');
    if (lostFoundList) {
        lostFoundList.addEventListener('click', async (event) => {
            if (event.target.classList.contains('approve-btn')) {
                const id = event.target.dataset.id;
                await approveLostFoundItem(id);
            } else if (event.target.classList.contains('delete-btn')) {
                const id = event.target.dataset.id;
                await deleteLostFoundItem(id);
            }
        });
    }
}

async function handleAddLostFoundItem(event) {
    event.preventDefault();
    const item = document.getElementById('lostFoundItem').value;
    const location = document.getElementById('lostFoundLocation').value;

    if (!item || !location) {
        alert('Please fill all fields.');
        return;
    }

    const newItem = {
        item: item,
        location: location,
        approved: false // New items are pending by default
    };

    const { data, error } = await addRow('lost_found', newItem);
    if (error) {
        console.error("Error adding lost and found item:", error);
        alert(`Failed to add item. ${error.message}`);
    } else {
        alert('Item added successfully!');
        document.getElementById('addLostFoundForm').reset();
        loadLostFoundItems(); // Reload list
    }
}

async function approveLostFoundItem(id) {
    if (!confirm('Are you sure you want to approve this item?')) return;
    const { error } = await updateRow('lost_found', { id: `eq.${id}` }, { approved: true });
    if (error) {
        console.error("Error approving lost and found item:", error);
        alert(`Failed to approve item. ${error.message}`);
    } else {
        alert('Item approved successfully!');
        loadLostFoundItems(); // Reload list
    }
}

async function deleteLostFoundItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const { error } = await deleteRow('lost_found', { id: `eq.${id}` });
    if (error) {
        console.error("Error deleting lost and found item:", error);
        alert(`Failed to delete item. ${error.message}`);
    } else {
        alert('Item deleted successfully!');
        loadLostFoundItems(); // Reload list
    }
}
