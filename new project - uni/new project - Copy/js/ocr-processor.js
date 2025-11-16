/**
 * Advanced OCR + Student Data Extraction System
 * Processes attendance/marks registers and returns clean JSON
 */

// Initialize Tesseract worker
let worker = null;
let isProcessing = false;

async function initTesseractWorker() {
    if (worker) return worker;
    
    try {
        const { createWorker } = Tesseract;
        worker = await createWorker('eng');
        console.log('✓ Tesseract worker initialized');
        return worker;
    } catch (error) {
        console.error('Error initializing Tesseract:', error);
        return null;
    }
}

/**
 * Main OCR processing function
 * @param {File|Blob|string} imageInput - Image file, blob, or data URL
 * @returns {Promise<Object>} Processed data in JSON format
 */
async function processOCRImage(imageInput) {
    if (isProcessing) {
        console.warn('OCR already processing, please wait...');
        return null;
    }
    
    isProcessing = true;
    console.log('🔍 Starting OCR processing...');
    
    try {
        const w = await initTesseractWorker();
        if (!w) throw new Error('Failed to initialize Tesseract worker');
        
        // Get image data URL if needed
        let imageData = imageInput;
        if (imageInput instanceof File || imageInput instanceof Blob) {
            imageData = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(imageInput);
            });
        }
        
        // Recognize text
        console.log('📸 Recognizing text from image...');
        const result = await w.recognize(imageData);
        const rawText = result.data.text;
        
        console.log('📝 Raw OCR text:\n', rawText);
        
        // Parse the extracted text
        const parsedData = parseRegisterData(rawText);
        
        console.log('✓ OCR Processing complete');
        console.log('Parsed data:', parsedData);
        
        return parsedData;
        
    } catch (error) {
        console.error('OCR Error:', error);
        return {
            error: true,
            message: error.message,
            students: []
        };
    } finally {
        isProcessing = false;
    }
}

/**
 * Parse attendance/marks register data from OCR text
 * @param {string} text - Raw text from OCR
 * @returns {Object} Structured data
 */
function parseRegisterData(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract metadata
    const metadata = extractMetadata(text);
    
    // Extract student data
    const students = extractStudentData(text, metadata.dataType);
    
    return {
        date: metadata.date || '',
        subject: metadata.subject || '',
        dataType: metadata.dataType, // 'attendance' or 'marks'
        totalStudents: students.length,
        students: students
    };
}

/**
 * Extract date, subject, teacher name from OCR text
 */
function extractMetadata(text) {
    const result = {
        date: '',
        subject: '',
        teacher: '',
        dataType: 'attendance' // default
    };
    
    // Try to find date (multiple formats)
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
        /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i
    ];
    
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            result.date = match[1];
            break;
        }
    }
    
    // Try to find subject
    const subjectPatterns = [
        /Subject\s*[:=]\s*([A-Za-z\s]+)/i,
        /Course\s*[:=]\s*([A-Za-z\s]+)/i,
        /(Mathematics|Science|English|History|Computer|Programming|Database|Web|Cloud)/i
    ];
    
    for (const pattern of subjectPatterns) {
        const match = text.match(pattern);
        if (match) {
            result.subject = match[1].trim();
            break;
        }
    }
    
    // Detect if marks or attendance
    const marksKeywords = ['marks', 'score', 'points', 'grade', 'obtained'];
    const attendanceKeywords = ['present', 'absent', 'absence', 'attendance', 'p', 'a'];
    
    const marksCount = marksKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    const attendanceCount = attendanceKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    
    result.dataType = marksCount > attendanceCount ? 'marks' : 'attendance';
    
    return result;
}

/**
 * Extract student roll numbers and their data
 */
function extractStudentData(text, dataType) {
    const students = [];
    const lines = text.split('\n');
    
    // Try to find roll numbers and corresponding data
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Look for roll numbers (typically numeric)
        const rollMatch = line.match(/^(\d{1,3})\s+/);
        if (rollMatch) {
            const rollNo = rollMatch[1];
            
            // Extract attendance or marks
            let data = {};
            
            if (dataType === 'marks') {
                // Look for numbers (marks)
                const markMatch = line.match(/(\d{1,3})(?:\s|$)/g);
                if (markMatch && markMatch.length >= 2) {
                    const marks = parseInt(markMatch[markMatch.length - 1]);
                    data = {
                        rollNo: rollNo,
                        marks: isNaN(marks) ? null : marks
                    };
                }
            } else {
                // Look for P/A or Present/Absent
                const attendance = line.toUpperCase();
                let status = 'Absent';
                
                if (attendance.includes('P') && !attendance.includes('AB')) {
                    status = 'Present';
                } else if (attendance.includes('PRESENT')) {
                    status = 'Present';
                } else if (attendance.includes('A') || attendance.includes('AB') || attendance.includes('ABSENT')) {
                    status = 'Absent';
                }
                
                data = {
                    rollNo: rollNo,
                    attendance: status
                };
            }
            
            if (data.rollNo) {
                students.push(data);
            }
        }
    }
    
    // Remove duplicates
    const uniqueStudents = [];
    const seen = new Set();
    for (const student of students) {
        if (!seen.has(student.rollNo)) {
            uniqueStudents.push(student);
            seen.add(student.rollNo);
        }
    }
    
    return uniqueStudents;
}

/**
 * Auto-fix common OCR mistakes
 */
function fixOCRMistakes(text) {
    let corrected = text;
    
    // Fix 0/O confusion
    corrected = corrected.replace(/\bO(\d)/g, '0$1'); // O1 -> 01
    corrected = corrected.replace(/(\d)O\b/g, '$10'); // 5O -> 50
    
    // Fix 1/l/I confusion in numbers
    corrected = corrected.replace(/\bl(\d)/gi, '1$1');
    
    return corrected;
}

/**
 * Process image file and return JSON
 */
async function processAttendanceImage(file) {
    console.log('Processing file:', file.name);
    const result = await processOCRImage(file);
    return result;
}

/**
 * Terminate Tesseract worker
 */
async function terminateOCRWorker() {
    if (worker) {
        await worker.terminate();
        worker = null;
        console.log('✓ Tesseract worker terminated');
    }
}

// Export functions
window.processOCRImage = processOCRImage;
window.processAttendanceImage = processAttendanceImage;
window.terminateOCRWorker = terminateOCRWorker;
window.initTesseractWorker = initTesseractWorker;

console.log('✓ OCR Processor loaded');
