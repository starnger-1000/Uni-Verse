import { getRows } from './supabase-client.js';

export async function getStudentDetails(roll) {
    const { data: students, error } = await getRows('students', { roll: `eq.${roll}` });
    if (error) {
        console.error("Error fetching student details:", error);
        return null;
    }
    return students.length > 0 ? students[0] : null;
}

export function displayStudentDetails(student, elementIdPrefix) {
    if (!student) {
        console.warn("No student data to display.");
        return;
    }
    document.getElementById(`${elementIdPrefix}Name`).textContent = student.name || 'N/A';
    document.getElementById(`${elementIdPrefix}Email`).textContent = student.email || 'N/A';
    document.getElementById(`${elementIdPrefix}Roll`).textContent = student.roll || 'N/A';
    document.getElementById(`${elementIdPrefix}Class`).textContent = student.class || 'N/A';
}
