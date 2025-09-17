// --- PENTING: Ganti dengan URL Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyJX8CyFC12t9fHQxCrsr8tjxMcoPVelJX8HkkPGmyGyIgNjdHnYUrMUhlUU7SzEenR/exec';

let localSkpData = [];

// --- Fungsi Fetch Data (Sekarang di-export) ---
export async function fetchData() {
    const loadingDiv = document.getElementById('skp-loading');
    const errorDiv = document.getElementById('skp-error');
    loadingDiv.innerHTML = '<p>Memuat data SKP...</p>';
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?page=skp`);
        if (!response.ok) throw new Error('Gagal mengambil data SKP.');
        
        localSkpData = await response.json();
        renderSkpData(localSkpData);
        loadingDiv.innerHTML = '';

    } catch (error) {
        loadingDiv.innerHTML = '';
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = error.message;
    }
}

// --- Fungsi Render ---
function renderSkpData(data) {
    const container = document.getElementById('skp-table-container');
    if (!data.length) {
        container.innerHTML = '<p class="text-gray-500">Belum ada data SKP.</p>';
        return;
    }

    const headers = Object.keys(data[0]);
    
    let tableHTML = `<table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>`;
    headers.forEach(header => {
        tableHTML += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`;
    });
    tableHTML += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

    data.forEach(row => {
        tableHTML += `<tr>`;
        headers.forEach(header => {
            let cellValue = row[header] || '';
            if(header.toLowerCase() === 'file' && cellValue) {
                cellValue = `<a href="${cellValue}" target="_blank" class="text-indigo-600 hover:underline">Lihat File</a>`;
            }
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm">${cellValue}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

// --- Fungsi Inisialisasi ---
export function init() {
    console.log("Halaman SKP diinisialisasi.");
    if (localSkpData.length > 0) {
        renderSkpData(localSkpData);
    } else {
        fetchData();
    }
}

