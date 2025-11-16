const SUPABASE_URL = "https://ubruufgjtehqcykjmrce.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicnV1ZmdqdGVocWN5a2ptcmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NjE3MjksImV4cCI6MjA0NjQzNzcyOX0.vBUqKmN7JfJ1QW9X8qKlZ2fX1rJ7X9Y1aK5mL2pQ3zI"; // Supabase anon key

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation" // Ensures that POST/PATCH/DELETE return the modified row
};

async function supabaseFetch(method, tableName, queryParams = {}, body = null) {
    let url = `${SUPABASE_URL}/rest/v1/${tableName}`;
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.message || response.statusText;
            console.error(`Supabase error: ${response.status} - ${errorMsg}`);
            return { data: null, error: errorMsg };
        }
        // For DELETE operations, response might be empty or just status
        if (response.status === 204 || method === 'DELETE') {
            return { data: null, error: null };
        }
        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error("Supabase fetch error:", error);
        return { data: null, error: error.message };
    }
}

export async function getRows(tableName, filters = {}, select = '*') {
    const queryParams = { ...filters, select };
    return supabaseFetch('GET', tableName, queryParams);
}

export async function addRow(tableName, data) {
    return supabaseFetch('POST', tableName, {}, data);
}

export async function updateRow(tableName, filters, data) {
    const queryParams = { ...filters };
    return supabaseFetch('PATCH', tableName, queryParams, data);
}

export async function deleteRow(tableName, filters) {
    const queryParams = { ...filters };
    return supabaseFetch('DELETE', tableName, queryParams);
}
