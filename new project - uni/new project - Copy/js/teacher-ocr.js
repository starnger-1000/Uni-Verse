// Teacher OCR - Extract Marks and Attendance from Images using Tesseract.js

let extractedData = [];
let currentImageFile = null;
let lastRoster = [];

// Open OCR tab and prepare for attendance extraction
function openOCRForAttendance() {
    // Switch to OCR tab if helper exists
    if (typeof showTeacherTab === 'function') {
        showTeacherTab('t_ocr');
    }
    // Select attendance radio
    const attendanceRadio = document.querySelector('input[name="dataType"][value="attendance"]');
    if (attendanceRadio) attendanceRadio.checked = true;
    // Trigger file input click to prompt user
    const input = document.getElementById('ocrImageInput');
    if (input) input.click();
}

// Initialize upload area
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const ocrImageInput = document.getElementById('ocrImageInput');
    
    if (!uploadArea || !ocrImageInput) return;
    
    // Click to upload
    uploadArea.addEventListener('click', () => ocrImageInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
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
            ocrImageInput.files = files;
            handleImageUpload(files[0]);
        }
    });
    
    // File input change
    ocrImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });
});

function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }
    
    currentImageFile = file;
    
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
}

function clearImagePreview() {
    const previewContainer = document.getElementById('previewContainer');
    const uploadArea = document.getElementById('uploadArea');
    const ocrImageInput = document.getElementById('ocrImageInput');
    
    previewContainer.classList.add('hidden');
    uploadArea.style.display = 'block';
    ocrImageInput.value = '';
    currentImageFile = null;
    extractedData = [];
    document.getElementById('resultsCard').style.display = 'none';
}

async function extractDataFromImage() {
    if (!currentImageFile) {
        alert('Please upload an image first');
        return;
    }
    
    const dataType = document.querySelector('input[name="dataType"]:checked').value;
    const loadingSpinner = document.getElementById('loadingSpinner');
    const extractBtn = document.getElementById('extractBtn');
    
    loadingSpinner.classList.remove('hidden');
    extractBtn.disabled = true;
    
    try {
        // Read image as data URL
        const imageDataUrl = await readFileAsDataURL(currentImageFile);
        
        // Perform OCR using Tesseract.js
        const { data: { text } } = await Tesseract.recognize(
            imageDataUrl,
            'eng',
            {
                logger: m => console.log('OCR Progress:', m)
            }
        );
        
        console.log('OCR Text:', text);
        
        // Parse extracted text
        const parsedData = parseOCRText(text, dataType);
        extractedData = parsedData;
        
        // Display results
        displayExtractedResults(parsedData, dataType);
        
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

// ===== HELPER FUNCTIONS FOR OCR POST-PROCESSING =====

// 1. Clean OCR text: replace common character misreadings and remove noise
function cleanOCRText(rawText) {
    let cleaned = rawText;
    // Replace common character misreadings
    cleaned = cleaned.replace(/O/g, '0');  // Letter O -> zero
    cleaned = cleaned.replace(/I/g, '1');  // Capital I -> one
    cleaned = cleaned.replace(/l/g, '1');  // Lowercase L -> one
    cleaned = cleaned.replace(/S/g, '5');  // Letter S -> five
    cleaned = cleaned.replace(/B/g, '8');  // Letter B -> eight
    cleaned = cleaned.replace(/Z/g, '2');  // Letter Z -> two
    // Remove extra symbols, keep only digits and hyphens/spaces
    cleaned = cleaned.replace(/[^\d\s\-]/g, '');
    return cleaned;
}

// 2. Extract roll numbers with multiple format support (6-12 digits)
function extractRollNumbers(text) {
    const cleaned = cleanOCRText(text);
    const rolls = new Set();
    
    // Regex patterns for roll numbers: 6-12 digits, with optional hyphens
    const patterns = [
        /\b\d{6,12}\b/g,           // Straight 6-12 digits
        /\d{2,3}-\d{5,8}/g,        // Format: 23-190045
        /\d{3,4}-\d{3,4}-\d{2,4}/g // Format: 102-103-040
    ];
    
    let allMatches = [];
    patterns.forEach(pattern => {
        const matches = cleaned.match(pattern) || [];
        allMatches = allMatches.concat(matches);
    });

    // Normalize and validate: remove hyphens, deduplicate, validate length
    allMatches.forEach(match => {
        let normalized = match.replace(/\-/g, ''); // remove hyphens
        // Accept rolls that are 6-12 digits
        if (/^\d{6,12}$/.test(normalized)) {
            rolls.add(normalized);
        }
    });

    return Array.from(rolls).sort((a, b) => parseInt(a) - parseInt(b));
}

// 3. Reconstruct partial roll numbers by combining incomplete adjacent numbers
function reconstructPartialRolls(lines) {
    const partialRolls = [];
    for (let i = 0; i < lines.length; i++) {
        const line = cleanOCRText(lines[i]);
        const numbers = line.match(/\d+/g) || [];
        
        // If line has incomplete roll (less than 6 digits) and next line has continuation
        if (numbers.length > 0) {
            for (const num of numbers) {
                if (num.length < 6 && i + 1 < lines.length) {
                    const nextLine = cleanOCRText(lines[i + 1]);
                    const nextNumbers = nextLine.match(/\d+/g) || [];
                    if (nextNumbers.length > 0) {
                        const combined = num + nextNumbers[0];
                        if (/^\d{6,12}$/.test(combined)) {
                            partialRolls.push(combined);
                        }
                    }
                } else if (/^\d{6,12}$/.test(num)) {
                    partialRolls.push(num);
                }
            }
        }
    }
    return partialRolls;
}

// ===== DEDICATED EXTRACTION FUNCTIONS =====

// Extract attendance from OCR: returns {roll, name, attendance:'P'|'A'} array
function extractAttendanceFromOCR(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const roster = getRosterFromDirectory();
    lastRoster = roster;

    // Build roster lookup map
    const rosterMap = {};
    roster.forEach(s => {
        const roll = (s.roll || '').toString().trim();
        const norm = roll.replace(/^0+/, '') || roll;
        rosterMap[norm] = s;
        rosterMap[roll] = s;
    });

    // Extract and validate roll numbers from OCR
    const extractedRolls = extractRollNumbers(text);
    const partialRolls = reconstructPartialRolls(lines);
    const allRolls = [...new Set([...extractedRolls, ...partialRolls])];

    console.log('Attendance extraction - Extracted rolls:', extractedRolls);
    console.log('Attendance extraction - Reconstructed rolls:', partialRolls);
    console.log('Attendance extraction - All rolls:', allRolls);

    // Mark students as Present or Absent based on extracted rolls
    const presentSet = new Set();
    allRolls.forEach(roll => {
        const norm = roll.replace(/^0+/, '') || roll;
        if (rosterMap[roll] || rosterMap[norm]) {
            const entry = rosterMap[roll] || rosterMap[norm];
            presentSet.add(entry.roll);
        }
    });

    // Build results: all roster students with attendance status
    const results = [];
    roster.forEach(s => {
        const norm = (s.roll || '').toString().replace(/^0+/, '') || s.roll;
        const isPresent = presentSet.has(s.roll) || presentSet.has(norm);
        results.push({ 
            roll: s.roll, 
            name: s.name || '', 
            attendance: isPresent ? 'P' : 'A' 
        });
    });

    // Sort by roll number
    results.sort((a, b) => {
        const aRoll = parseInt((a.roll || '').toString().replace(/^0+/, '') || a.roll);
        const bRoll = parseInt((b.roll || '').toString().replace(/^0+/, '') || b.roll);
        return aRoll - bRoll;
    });

    console.log('Attendance extraction - Final results:', results);
    return results;
}

// Extract marks from OCR: returns {roll, name, marks} array
function extractMarksFromOCR(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const roster = getRosterFromDirectory();
    lastRoster = roster;

    // Build roster lookup map
    const rosterMap = {};
    roster.forEach(s => {
        const roll = (s.roll || '').toString().trim();
        const norm = roll.replace(/^0+/, '') || roll;
        rosterMap[norm] = s;
        rosterMap[roll] = s;
    });

    // Extract and validate roll numbers from OCR
    const extractedRolls = extractRollNumbers(text);
    const partialRolls = reconstructPartialRolls(lines);
    const allRolls = [...new Set([...extractedRolls, ...partialRolls])];

    console.log('Marks extraction - Extracted rolls:', extractedRolls);
    console.log('Marks extraction - Reconstructed rolls:', partialRolls);
    console.log('Marks extraction - All rolls:', allRolls);

    // Extract tokens and find marks near each roll number
    const allTokens = text.match(/\d+/g) || [];
    const marksMap = new Map();

    allRolls.forEach(roll => {
        const rollIdx = allTokens.indexOf(roll);
        if (rollIdx !== -1) {
            // Look for marks (0-100) within next 2 tokens
            for (let j = rollIdx + 1; j <= rollIdx + 2 && j < allTokens.length; j++) {
                const cand = parseInt(allTokens[j]);
                if (!isNaN(cand) && cand >= 0 && cand <= 100) {
                    marksMap.set(roll, cand);
                    break;
                }
            }
        }
    });

    // Build results: all roster entries with matched marks
    const results = [];
    roster.forEach(s => {
        const norm = (s.roll || '').toString().replace(/^0+/, '') || s.roll;
        const marks = marksMap.get(s.roll) || marksMap.get(norm) || '';
        results.push({ 
            roll: s.roll, 
            name: s.name || '', 
            marks 
        });
    });

    // Sort by roll number
    results.sort((a, b) => {
        const aRoll = parseInt((a.roll || '').toString().replace(/^0+/, '') || a.roll);
        const bRoll = parseInt((b.roll || '').toString().replace(/^0+/, '') || b.roll);
        return aRoll - bRoll;
    });

    console.log('Marks extraction - Final results:', results);
    return results;
}

// Main orchestrator: delegates to appropriate extraction function
function parseOCRText(text, dataType) {
    if (dataType === 'marks') {
        return extractMarksFromOCR(text);
    } else {
        return extractAttendanceFromOCR(text);
    }
}

// Read roster from the Student Directory table in the DOM
// Read roster from the Student Directory table in the DOM
function getRosterFromDirectory() {
    const roster = [];
    const table = document.querySelector('#t_directory .t-table');

    if (table) {
        const rows = table.querySelectorAll('tbody tr, tr');
        rows.forEach((tr) => {
            const cells = tr.querySelectorAll('td');
            if (!cells || cells.length < 2) return;
            const roll = cells[0].textContent.trim();
            const name = cells[1].textContent.trim();
            // ignore header rows
            if (!/\d+/.test(roll)) return;
            roster.push({ roll, name });
        });
        if (roster.length > 0) return roster;
    }

    // Fallback: use marksDatabase and selected class (if available)
    try {
        const classSelect = document.getElementById('classSelect');
        const selectedClass = classSelect ? classSelect.value : null;
        if (window.marksDatabase && window.marksDatabase.classes) {
            let classData = null;
            if (selectedClass) {
                classData = window.marksDatabase.classes.find(c => c.id === selectedClass);
            }
            // If not selected, pick the first class
            if (!classData) classData = window.marksDatabase.classes[0];

            if (classData && classData.students) {
                classData.students.forEach(s => {
                    roster.push({ roll: s.rollNo ? s.rollNo.toString() : (s.roll || ''), name: s.name || '' });
                });
            }
        }
    } catch (e) {
        console.warn('Fallback roster retrieval failed', e);
    }

    return roster;
}

// Open an attendance confirmation review with dropdown to change Present/Absent
function finalizeAttendanceReview() {
    const resultsCard = document.getElementById('resultsCard');
    const extractedTable = document.getElementById('extractedTable');
    
    // Separate into Present and Absent
    const present = extractedData.filter(item => (item.attendance || '').toUpperCase() === 'P');
    const absent = extractedData.filter(item => (item.attendance || '').toUpperCase() === 'A');

    // Render review UI with dropdowns for each student
    let html = '<div class="attendance-review" style="padding: 20px;">';
    
    // Summary section
    html += `<div style="margin-bottom: 20px; padding: 15px; background: rgba(0,200,100,0.1); border-radius: 8px; border: 1px solid rgba(0,200,100,0.3);">`;
    html += `<h4 style="margin: 0 0 10px 0;">📊 Attendance Summary</h4>`;
    html += `<p style="margin: 5px 0;"><strong>Present:</strong> ${present.length} students</p>`;
    html += `<p style="margin: 5px 0;"><strong>Absent:</strong> ${absent.length} students</p>`;
    html += `<p style="margin: 5px 0;"><strong>Total:</strong> ${extractedData.length} students</p>`;
    html += `</div>`;

    // Students list with dropdown to change status
    html += `<h4 style="margin-top: 20px; margin-bottom: 10px;">👥 Student Attendance Status (click to change)</h4>`;
    html += `<div class="attendance-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">`;
    
    extractedData.forEach((it, idx) => {
        const status = (it.attendance || '').toUpperCase();
        const statusLabel = status === 'P' ? '✓ Present' : '✗ Absent';
        const statusColor = status === 'P' ? '#00c864' : '#ff3b30';
        
        html += `<div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; gap: 15px;">`;
        html += `<span style="color: ${statusColor}; font-weight: bold; min-width: 60px;">${statusLabel}</span>`;
        html += `<span style="flex: 1;"><strong>${it.roll}</strong> ${it.name ? '- ' + it.name : ''}</span>`;
        html += `<select class="attendance-dropdown" data-index="${idx}" style="padding: 5px 10px; border-radius: 5px; border: 1px solid #ccc; background: white; cursor: pointer;">`;
        html += `<option value="P" ${status === 'P' ? 'selected' : ''}>✓ Present</option>`;
        html += `<option value="A" ${status === 'A' ? 'selected' : ''}>✗ Absent</option>`;
        html += `</select>`;
        html += `</div>`;
    });
    
    html += `</div>`;
    
    // Action buttons
    html += `<div style="margin-top: 20px; display: flex; gap: 10px;">`;
    html += `<button class="btn btn-primary" id="confirmAttendanceBtn" style="flex: 1;">✓ Confirm & Save Attendance</button>`;
    html += `<button class="btn btn-secondary" id="cancelAttendanceReview" style="flex: 1;">Cancel</button>`;
    html += `</div></div>`;

    extractedTable.innerHTML = html;
    resultsCard.style.display = 'block';

    // Attach event listeners
    document.getElementById('confirmAttendanceBtn').addEventListener('click', confirmAndSaveAttendance);
    document.getElementById('cancelAttendanceReview').addEventListener('click', () => displayExtractedResults(extractedData, 'attendance'));

    // Update extractedData when dropdown changes
    extractedTable.querySelectorAll('.attendance-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            const idx = parseInt(this.dataset.index);
            extractedData[idx].attendance = this.value;
        });
    });
}

// Confirm and save attendance: updates t_attendance table and stores record in localStorage
function confirmAndSaveAttendance() {
    const presentRolls = extractedData.filter(i => (i.attendance || '').toUpperCase() === 'P').map(i => i.roll);
    const dateInput = document.querySelector('#t_attendance .filters input[type="date"]');
    const classSelect = document.querySelector('#t_attendance .filters .filter-select');
    const date = dateInput ? dateInput.value || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const classId = classSelect ? classSelect.value || 'Unknown' : 'Unknown';

    // Update attendance table in DOM
    updateAttendanceTable(presentRolls);

    // Save record to localStorage: { key: attendance_records => [{date, classId, presentRolls, rosterSnapshot}] }
    try {
        const key = 'attendance_records';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push({ date, classId, presentRolls, roster: lastRoster, savedAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(existing));
        alert('Attendance saved successfully');
        document.getElementById('resultsCard').style.display = 'none';
    } catch (e) {
        console.error('Save attendance error', e);
        alert('Error saving attendance: ' + e.message);
    }
}

function updateAttendanceTable(presentRolls) {
    const table = document.querySelector('#t_attendance .t-table');
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr, tr');
    rows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (!cells || cells.length < 3) return;
        const roll = cells[0].textContent.trim();
        const btn = cells[2].querySelector('button');
        if (!btn) return;
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

function displayExtractedResults(data, dataType) {
    const resultsCard = document.getElementById('resultsCard');
    const extractedTable = document.getElementById('extractedTable');
    
    let html = '<table class="ocr-table"><thead><tr>';
    
    if (dataType === 'marks') {
        html += '<th>Roll Number</th><th>Marks</th><th>Action</th>';
    } else {
        html += '<th>Roll Number</th><th>Attendance</th><th>Action</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    if (data.length === 0) {
        html += '<tr><td colspan="3" style="text-align: center;">No data extracted. Try a clearer image.</td></tr>';
    } else {
        data.forEach((item, index) => {
            if (dataType === 'marks') {
                html += `
                    <tr>
                        <td><input type="text" class="ocr-input" value="${item.roll}" data-field="roll" data-index="${index}"></td>
                        <td><input type="number" class="ocr-input" value="${item.marks}" min="0" max="100" data-field="marks" data-index="${index}"></td>
                        <td><button class="btn-delete" onclick="deleteRow(${index})">Delete</button></td>
                    </tr>
                `;
            } else {
                const attendance = item.attendance || '';
                html += `
                    <tr>
                        <td><input type="text" class="ocr-input" value="${item.roll}" data-field="roll" data-index="${index}"></td>
                        <td>
                            <select class="ocr-input" data-field="attendance" data-index="${index}">
                                <option value="P" ${attendance === 'P' ? 'selected' : ''}>Present</option>
                                <option value="A" ${attendance === 'A' ? 'selected' : ''}>Absent</option>
                            </select>
                        </td>
                        <td><button class="btn-delete" onclick="deleteRow(${index})">Delete</button></td>
                    </tr>
                `;
            }
        });
    }
    
    html += '</tbody></table>';
    extractedTable.innerHTML = html;
    resultsCard.style.display = 'block';
    
    // Add event listeners to inputs for live updates
    document.querySelectorAll('.ocr-input').forEach(input => {
        input.addEventListener('change', updateExtractedData);
    });

    // If attendance data, show review/confirm button
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'table-actions';
    if (dataType === 'attendance') {
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'btn btn-primary';
        reviewBtn.textContent = 'Review & Confirm Attendance';
        reviewBtn.addEventListener('click', finalizeAttendanceReview);
        actionsContainer.appendChild(reviewBtn);
    }
    // Existing save/download actions
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Save to LocalStorage';
    saveBtn.addEventListener('click', saveExtractedData);
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-secondary';
    dlBtn.textContent = 'Download as CSV';
    dlBtn.addEventListener('click', downloadAsCSV);
    actionsContainer.appendChild(saveBtn);
    actionsContainer.appendChild(dlBtn);
    // Append actions after table
    extractedTable.appendChild(actionsContainer);
}

function updateExtractedData(e) {
    const index = parseInt(e.target.dataset.index);
    const field = e.target.dataset.field;
    const value = e.target.value;
    
    if (extractedData[index]) {
        if (field === 'marks') {
            extractedData[index].marks = parseInt(value);
        } else if (field === 'attendance') {
            extractedData[index].attendance = value;
        } else if (field === 'roll') {
            extractedData[index].roll = value;
        }
    }
}

function deleteRow(index) {
    extractedData.splice(index, 1);
    const dataType = document.querySelector('input[name="dataType"]:checked').value;
    displayExtractedResults(extractedData, dataType);
}

function saveExtractedData() {
    if (extractedData.length === 0) {
        alert('No data to save');
        return;
    }
    
    const dataType = document.querySelector('input[name="dataType"]:checked').value;
    
    // Determine localStorage key based on data type
    const storageKey = dataType === 'marks' ? 'universe_marks_extracted' : 'universe_attendance_extracted';
    
    // Save to localStorage
    try {
        localStorage.setItem(storageKey, JSON.stringify(extractedData));
        alert(`✓ ${dataType === 'marks' ? 'Marks' : 'Attendance'} data saved to LocalStorage!`);
        console.log(`Saved to ${storageKey}:`, extractedData);
    } catch (error) {
        alert('Error saving to LocalStorage: ' + error.message);
    }
}

function downloadAsCSV() {
    if (extractedData.length === 0) {
        alert('No data to download');
        return;
    }
    
    const dataType = document.querySelector('input[name="dataType"]:checked').value;
    
    // Build CSV
    let csv = '';
    if (dataType === 'marks') {
        csv = 'Roll Number,Marks\n';
        extractedData.forEach(item => {
            csv += `${item.roll},${item.marks}\n`;
        });
    } else {
        csv = 'Roll Number,Attendance\n';
        extractedData.forEach(item => {
            csv += `${item.roll},${item.attendance}\n`;
        });
    }
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Export functions to window
window.handleImageUpload = handleImageUpload;
window.clearImagePreview = clearImagePreview;
window.extractDataFromImage = extractDataFromImage;
window.downloadAsCSV = downloadAsCSV;
window.performOCRExtraction = extractDataFromImage;
window.clearOCRImagePreview = clearImagePreview;
