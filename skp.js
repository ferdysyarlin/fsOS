// --- PENTING: Ganti dengan URL Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwfWTBx2Q_3upcAyIul1pP3V0OiffCtgVDdT8xWC2uQOX-Tw-nqcH-26vlGoP1svddtTg/exec';

let localSkpData = [];

// --- Fungsi untuk mengambil data SKP ---
async function fetchSkpData() {
    document.getElementById('skp-loading').innerHTML = '<p>Memuat data SKP...</p>';
    
    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?page=skp`);
        if (!response.ok) throw new Error('Gagal mengambil data SKP.');
        
        localSkpData = await response.json();
        renderSkpData(localSkpData);
        document.getElementById('skp-loading').innerHTML = '';

    } catch (error) {
        document.getElementById('skp-loading').innerHTML = '';
        const errorDiv = document.getElementById('skp-error');
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = error.message;
    }
}

// --- Fungsi untuk merender tabel SKP ---
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
        fetchSkpData();
    }
}
