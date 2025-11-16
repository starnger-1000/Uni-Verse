// OCR Attendance Feature - Automated attendance marking via image processing
// Purpose: Extract roll numbers from attendance sheet images and auto-mark present/absent

let currentOCRImage = null;
let ocrExtractedRolls = [];
let attendanceConfirmationData = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    setupOCRAttendanceHandlers();
});

function setupOCRAttendanceHandlers() {
    const uploadArea = document.getElementById('uploadArea');
    const ocrImageInput = document.getElementById('ocrImageInput');
    
    if (!uploadArea || !ocrImageInput) return;
    
    // Click upload
    uploadArea.addEventListener('click', () => ocrImageInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#6b7280';
        uploadArea.style.backgroundColor = 'rgba(107, 114, 128, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleOCRImageUpload(files[0]);
        }
    });
    
    // File input change
    ocrImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleOCRImageUpload(e.target.files[0]);
        }
    });
}

// ===== IMAGE UPLOAD & PREVIEW =====
function handleOCRImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, etc)');
        return;
    }
    
    currentOCRImage = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewContainer = document.getElementById('previewContainer');
        const previewImage = document.getElementById('previewImage');
        
        previewImage.src = e.target.result;
        previewContainer.classList.remove('hidden');
        document.getElementById('uploadArea').style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    console.log('Image uploaded:', file.name);
}

function clearOCRImagePreview() {
    const previewContainer = document.getElementById('previewContainer');
    const uploadArea = document.getElementById('uploadArea');
    const ocrImageInput = document.getElementById('ocrImageInput');
    
    previewContainer.classList.add('hidden');
    uploadArea.style.display = 'block';
    ocrImageInput.value = '';
    currentOCRImage = null;
    ocrExtractedRolls = [];
    attendanceConfirmationData = [];
    document.getElementById('resultsCard').style.display = 'none';
}

// ===== OCR TEXT EXTRACTION & CLEANING =====

// Clean OCR text: fix common character misreadings
function cleanOCRText(rawText) {
    let cleaned = rawText;
    // Common OCR mistakes
    cleaned = cleaned.replace(/O/g, '0');  // Letter O -> 0
    cleaned = cleaned.replace(/I/g, '1');  // Capital I -> 1
    cleaned = cleaned.replace(/l/g, '1');  // Lowercase L -> 1
    cleaned = cleaned.replace(/S/g, '5');  // S -> 5
    cleaned = cleaned.replace(/B/g, '8');  // B -> 8
    cleaned = cleaned.replace(/Z/g, '2');  // Z -> 2
    // Remove non-numeric characters except spaces and hyphens
    cleaned = cleaned.replace(/[^\d\s\-]/g, '');
    return cleaned;
}

// Extract roll numbers from cleaned OCR text
function extractRollNumbersFromOCR(text) {
    const cleaned = cleanOCRText(text);
    const rolls = new Set();
    
    // Split into lines for better processing
    const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);
    
    // Extract numeric patterns
    lines.forEach(line => {
        // Look for 6-12 digit sequences (typical roll number format)
        const matches = line.match(/\b\d{6,12}\b/g) || [];
        matches.forEach(m => rolls.add(m));
        
        // Also look for hyphenated formats: XX-XXXXXX or XX-XXX-XXX
        const hyphenated = line.match(/\d{2,3}-\d{3,8}(?:-\d{2,4})?/g) || [];
        hyphenated.forEach(m => {
            const normalized = m.replace(/\-/g, ''); // remove hyphens
            if (/^\d{6,12}$/.test(normalized)) {
                rolls.add(normalized);
            }
        });
    });
    
    return Array.from(rolls).sort((a, b) => parseInt(a) - parseInt(b));
}

// ===== ROSTER MANAGEMENT =====

// Get roster from Student Directory table or marks database
function getAttendanceRoster() {
    const roster = [];
    
    // Try directory table first
    const directoryTable = document.querySelector('#t_directory .t-table');
    if (directoryTable) {
        const rows = directoryTable.querySelectorAll('tbody tr');
        rows.forEach(tr => {
            const cells = tr.querySelectorAll('td');
            if (cells.length >= 2) {
                const roll = cells[0].textContent.trim();
                const name = cells[1].textContent.trim();
                if (/\d+/.test(roll)) {
                    roster.push({ roll, name });
                }
            }
        });
    }
    
    // Fallback to marks database if available
    if (roster.length === 0 && window.marksDatabase && window.marksDatabase.classes) {
        const selectedClass = document.getElementById('classSelect')?.value;
        let classData = selectedClass 
            ? window.marksDatabase.classes.find(c => c.id === selectedClass)
            : window.marksDatabase.classes[0];
        
        if (classData && classData.students) {
            classData.students.forEach(s => {
                roster.push({ 
                    roll: s.rollNo ? s.rollNo.toString() : (s.roll || ''),
                    name: s.name || ''
                });
            });
        }
    }
    
    return roster;
}

// ===== ATTENDANCE PROCESSING =====

// Process OCR extraction: match rolls to roster
function processOCRAttendance(extractedRolls, roster) {
    // Build roster lookup map (handle both exact and normalized forms)
    const rosterMap = {};
    roster.forEach(s => {
        rosterMap[s.roll] = s;
        const normalized = s.roll.replace(/^0+/, '') || s.roll;
        rosterMap[normalized] = s;
    });
    
    // Mark students as Present or Absent
    const attendance = [];
    const presentRolls = new Set();
    
    // Mark extracted rolls as Present
    extractedRolls.forEach(roll => {
        const normalized = roll.replace(/^0+/, '') || roll;
        if (rosterMap[roll] || rosterMap[normalized]) {
            const entry = rosterMap[roll] || rosterMap[normalized];
            presentRolls.add(entry.roll);
        }
    });
    
    // Build attendance array for all roster students
    roster.forEach(student => {
        const isPresent = presentRolls.has(student.roll);
        attendance.push({
            roll: student.roll,
            name: student.name,
            status: isPresent ? 'P' : 'A'  // P = Present, A = Absent
        });
    });
    
    // Sort by roll number
    attendance.sort((a, b) => {
        const aNum = parseInt(a.roll.replace(/^0+/, '') || a.roll);
        const bNum = parseInt(b.roll.replace(/^0+/, '') || b.roll);
        return aNum - bNum;
    });
    
    return attendance;
}

// ===== OCR EXTRACTION TRIGGER =====

async function performOCRExtraction() {
    if (!currentOCRImage) {
        alert('Please upload an image first');
        return;
    }
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const extractBtn = document.getElementById('extractBtn');
    
    loadingSpinner.classList.remove('hidden');
    extractBtn.disabled = true;
    
    try {
        // Read image as data URL
        const imageDataUrl = await readFileAsDataURL(currentOCRImage);
        
        // Perform OCR using Tesseract.js
        console.log('Starting OCR extraction...');
        const { data: { text } } = await Tesseract.recognize(
            imageDataUrl,
            'eng',
            {
                logger: m => console.log('OCR Progress:', m.progress?.toFixed(2))
            }
        );
        
        console.log('OCR Text extracted:', text);
        
        // Extract roll numbers from OCR text
        ocrExtractedRolls = extractRollNumbersFromOCR(text);
        console.log('Extracted roll numbers:', ocrExtractedRolls);
        
        // Get roster and process attendance
        const roster = getAttendanceRoster();
        console.log('Roster loaded:', roster.length, 'students');
        
        attendanceConfirmationData = processOCRAttendance(ocrExtractedRolls, roster);
        console.log('Attendance processed:', attendanceConfirmationData);
        
        // Show confirmation UI
        showAttendanceConfirmation();
        
        loadingSpinner.classList.add('hidden');
        extractBtn.disabled = false;
        
    } catch (error) {
        console.error('OCR Error:', error);
        alert('Error during OCR extraction: ' + error.message);
        loadingSpinner.classList.add('hidden');
        extractBtn.disabled = false;
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== ATTENDANCE CONFIRMATION UI =====

function showAttendanceConfirmation() {
    const resultsCard = document.getElementById('resultsCard');
    const extractedTable = document.getElementById('extractedTable');
    
    const present = attendanceConfirmationData.filter(a => a.status === 'P');
    const absent = attendanceConfirmationData.filter(a => a.status === 'A');
    
    let html = '<div class="ocr-confirmation" style="padding: 20px;">';
    
    // Summary stats
    html += `<div style="margin-bottom: 20px; padding: 15px; background: rgba(0,191,165,0.08); border-radius: 8px; border-left: 4px solid #00bfa5;">`;
    html += `<h3 style="margin: 0 0 10px 0; color: #1f2937;">📊 Attendance Summary</h3>`;
    html += `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">`;
    html += `<div><span style="color: #6b7280;">✓ Present</span><br/><strong style="font-size: 24px; color: #00bfa5;">${present.length}</strong></div>`;
    html += `<div><span style="color: #6b7280;">✗ Absent</span><br/><strong style="font-size: 24px; color: #ef4444;">${absent.length}</strong></div>`;
    html += `<div><span style="color: #6b7280;">Total</span><br/><strong style="font-size: 24px; color: #1f2937;">${attendanceConfirmationData.length}</strong></div>`;
    html += `</div></div>`;
    
    // Present students
    html += `<div style="margin-bottom: 20px;">`;
    html += `<h4 style="color: #00bfa5; margin-bottom: 10px;">✓ Present (${present.length})</h4>`;
    html += `<div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 10px; max-height: 200px; overflow-y: auto;">`;
    if (present.length === 0) {
        html += `<p style="color: #9ca3af; margin: 0;">No students marked as present</p>`;
    } else {
        present.forEach(student => {
            html += `<div style="padding: 8px; border-bottom: 1px solid #dcfce7; display: flex; justify-content: space-between; align-items: center;">`;
            html += `<div>`;
            html += `<span style="font-weight: 600; color: #1f2937;">${student.roll}</span>`;
            html += `${student.name ? ' - <span style="color: #6b7280;">' + student.name + '</span>' : ''}`;
            html += `</div>`;
            html += `<select class="attendance-status-select" data-roll="${student.roll}" onchange="updateAttendanceStatus(this, '${student.roll}')">`;
            html += `<option value="P" selected>✓ Present</option>`;
            html += `<option value="A">✗ Absent</option>`;
            html += `</select>`;
            html += `</div>`;
        });
    }
    html += `</div></div>`;
    
    // Absent students
    html += `<div style="margin-bottom: 20px;">`;
    html += `<h4 style="color: #ef4444; margin-bottom: 10px;">✗ Absent (${absent.length})</h4>`;
    html += `<div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 10px; max-height: 200px; overflow-y: auto;">`;
    if (absent.length === 0) {
        html += `<p style="color: #9ca3af; margin: 0;">No students marked as absent</p>`;
    } else {
        absent.forEach(student => {
            html += `<div style="padding: 8px; border-bottom: 1px solid #fee2e2; display: flex; justify-content: space-between; align-items: center;">`;
            html += `<div>`;
            html += `<span style="font-weight: 600; color: #1f2937;">${student.roll}</span>`;
            html += `${student.name ? ' - <span style="color: #6b7280;">' + student.name + '</span>' : ''}`;
            html += `</div>`;
            html += `<select class="attendance-status-select" data-roll="${student.roll}" onchange="updateAttendanceStatus(this, '${student.roll}')">`;
            html += `<option value="P">✓ Present</option>`;
            html += `<option value="A" selected>✗ Absent</option>`;
            html += `</select>`;
            html += `</div>`;
        });
    }
    html += `</div></div>`;
    
    // Action buttons
    html += `<div style="display: flex; gap: 10px; margin-top: 20px;">`;
    html += `<button class="btn btn-primary" id="saveAttendanceBtn" style="flex: 1;" onclick="saveOCRAttendance()">✓ Confirm & Save Attendance</button>`;
    html += `<button class="btn btn-secondary" id="cancelOCRBtn" style="flex: 1;" onclick="cancelOCRAttendance()">Cancel</button>`;
    html += `</div></div>`;
    
    extractedTable.innerHTML = html;
    resultsCard.style.display = 'block';
}

// Update attendance status in confirmation UI
function updateAttendanceStatus(selectElement, roll) {
    const newStatus = selectElement.value;
    const student = attendanceConfirmationData.find(a => a.roll === roll);
    if (student) {
        student.status = newStatus;
    }
    // Refresh the UI to update summary
    showAttendanceConfirmation();
}

// ===== ATTENDANCE SAVING =====

function saveOCRAttendance() {
    const present = attendanceConfirmationData.filter(a => a.status === 'P');
    
    // Save to localStorage
    try {
        const record = {
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            presentRolls: present.map(p => p.roll),
            totalAttendanceData: attendanceConfirmationData,
            extractedFrom: 'OCR'
        };
        
        const key = 'attendance_records';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(record);
        localStorage.setItem(key, JSON.stringify(existing));
        
        console.log('Attendance saved to localStorage:', record);
        
        // Update attendance table in the Attendance tab
        updateAttendanceTableFromOCR(present.map(p => p.roll));
        
        alert('✓ Attendance saved successfully!\n\nPresent: ' + present.length + ' students\nAbsent: ' + (attendanceConfirmationData.length - present.length) + ' students');
        
        // Clear and reset
        clearOCRImagePreview();
        document.getElementById('resultsCard').style.display = 'none';
        
    } catch (error) {
        console.error('Error saving attendance:', error);
        alert('Error saving attendance: ' + error.message);
    }
}

function cancelOCRAttendance() {
    clearOCRImagePreview();
    document.getElementById('resultsCard').style.display = 'none';
}

// Update the Attendance tab table with OCR results
function updateAttendanceTableFromOCR(presentRolls) {
    const table = document.querySelector('#t_attendance .t-table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr, tr');
    rows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length < 3) return;
        
        const roll = cells[0].textContent.trim();
        const btn = cells[2].querySelector('button');
        if (!btn) return;
        
        // Normalize roll number for comparison
        const normalized = roll.replace(/^0+/, '') || roll;
        const isPresent = presentRolls.includes(roll) || presentRolls.includes(normalized);
        
        if (isPresent) {
            btn.classList.remove('absent');
            btn.classList.add('present');
            btn.textContent = 'Present';
        } else {
            btn.classList.remove('present');
            btn.classList.add('absent');
            btn.textContent = 'Absent';
        }
    });
}

// ===== PUBLIC TRIGGER FUNCTIONS =====

// Called when teacher clicks "Extract Data" button
function extractDataFromImage() {
    const dataType = document.querySelector('input[name="dataType"]:checked').value;
    
    if (dataType === 'attendance') {
        performOCRExtraction();
    } else {
        // For marks, show a message
        alert('Marks extraction coming soon. Currently focused on attendance.');
    }
}

// Make functions globally accessible
window.clearOCRImagePreview = clearOCRImagePreview;
window.performOCRExtraction = performOCRExtraction;
window.extractDataFromImage = extractDataFromImage;
window.updateAttendanceStatus = updateAttendanceStatus;
window.saveOCRAttendance = saveOCRAttendance;
window.cancelOCRAttendance = cancelOCRAttendance;
