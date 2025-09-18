// --- PENTING: Ganti dengan URL Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzqEzgJMyHH3FL9T0UrzRg9az6LSlrI3jU-5FVA4oNRGxF_i1Iu60gQ5S21PABUs443KA/exec';

let localSkpData = [];
let loadingDiv, errorDiv, tableContainer;

// --- Fungsi Fetch Data (Sekarang untuk Reload) ---
export async function fetchData() {
    if(loadingDiv) loadingDiv.innerHTML = '<p>Memuat ulang data SKP...</p>';
    if(errorDiv) errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?page=skp`);
        if (!response.ok) throw new Error('Gagal mengambil data SKP dari server.');
        const freshData = await response.json();
        localSkpData = freshData; // Perbarui cache lokal
        return freshData;
    } catch (error) {
        if(errorDiv) {
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = error.message;
        }
        return localSkpData; // Kembalikan data lama jika gagal
    }
}

// --- Fungsi Render ---
function renderSkpData(data) {
    if (!tableContainer) return;
    
    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<p class="text-gray-500 text-center py-10">Belum ada data SKP.</p>';
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
                cellValue = `<a href="${cellValue}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline inline-flex items-center gap-1">Lihat File <i data-lucide="external-link" class="w-4 h-4"></i></a>`;
            }
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cellValue}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    lucide.createIcons();
}

// --- Fungsi Inisialisasi (Diperbarui) ---
export function init(dataFromCache) {
    localSkpData = dataFromCache || [];
    
    // Hubungkan Elemen DOM
    loadingDiv = document.getElementById('skp-loading');
    errorDiv = document.getElementById('skp-error');
    tableContainer = document.getElementById('skp-table-container');

    console.log("Halaman SKP diinisialisasi dengan data cache.");
    renderSkpData(localSkpData);

    if (loadingDiv) loadingDiv.innerHTML = '';
}

