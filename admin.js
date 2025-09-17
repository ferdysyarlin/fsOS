// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyuU4KcMdyg89zW2N-0XNbu3RZOM9ADKPVFSQ8T7HmWr-7w2x1CUjH7UdNIJy7LdUSqDg/exec';
const CORRECT_PIN = '1234'; // Ganti dengan PIN 4 digit rahasia Anda

// --- Variabel Global ---
let localData = [];
let fileData = null;
let currentlyEditingId = null;
let activeDetailId = null;
const statusOptions = ['Hadir', 'Lembur', 'Cuti', 'Dinas', 'Sakit', 'ST'];

// --- Elemen DOM ---
const pinModalOverlay = document.getElementById('pin-modal-overlay');
const pinForm = document.getElementById('pin-form');
const pinInput = document.getElementById('pin-input');
const pinError = document.getElementById('pin-error');
const mainContainer = document.getElementById('main-container');
const addDataButton = document.getElementById('add-data-button');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessageP = document.getElementById('error-message');

// Elemen Tampilan
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const tableBody = document.getElementById('kinerja-table-body');
const cardContainer = document.getElementById('card-container');
const detailPlaceholder = document.getElementById('detail-placeholder');
const detailContent = document.getElementById('detail-content');

// --- Inisialisasi Aplikasi ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderStatusButtons();
});

function setupEventListeners() {
    pinForm.addEventListener('submit', handlePinSubmit);
    addDataButton.addEventListener('click', openCreateForm);
    document.body.addEventListener('click', handleBodyClick);
}

function handlePinSubmit(e) {
    e.preventDefault();
    pinError.textContent = '';
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        mainContainer.classList.remove('hidden');
        addDataButton.classList.remove('hidden');
        fetchData();
    } else {
        // Logika error PIN tetap sama
        const pinModalContent = document.getElementById('pin-modal-content');
        pinError.textContent = 'PIN salah, coba lagi.';
        pinModalContent.classList.add('shake');
        pinInput.value = '';
        pinInput.focus();
        setTimeout(() => pinModalContent.classList.remove('shake'), 500);
    }
}

// --- Logika Tampilan (View Management) ---
function showDetailView(id) {
    const itemData = localData.find(item => item['ID Kinerja'] === id);
    if (!itemData) return;

    activeDetailId = id;
    renderDetail(itemData);
    
    detailPlaceholder.classList.add('hidden');
    detailContent.classList.remove('hidden');

    // Untuk Mobile, kita ganti halaman
    if (window.innerWidth < 768) { 
        listView.classList.add('hidden');
        detailView.classList.remove('hidden');
        const backButton = document.createElement('button');
        backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg> Kembali`;
        backButton.className = 'flex items-center gap-2 p-2 mb-4 font-semibold text-gray-700';
        backButton.onclick = hideDetailView;
        detailContent.prepend(backButton);
    }
    
    highlightActiveItem(id);
    window.scrollTo(0, 0);
}

function hideDetailView() {
    activeDetailId = null;
    detailContent.classList.add('hidden');
    detailPlaceholder.classList.remove('hidden');
    
    // Untuk Mobile, kembali ke daftar
    if (window.innerWidth < 768) {
        detailView.classList.add('hidden');
        listView.classList.remove('hidden');
    }
    
    highlightActiveItem(null);
}

function renderDetail(data) {
    detailContent.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">ID Kinerja</label>
                <p class="text-md text-gray-700 font-mono">${data['ID Kinerja'] || '-'}</p>
            </div>
             <button onclick="hideDetailView()" class="hidden md:block p-2 rounded-full hover:bg-gray-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 border-t pt-5 mt-5">
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">Tanggal</label>
                <p class="text-md text-gray-900">${data.Tanggal || '-'}</p>
            </div>
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">Status</label>
                <p>${getStatusBadge(data.Status)}</p>
            </div>
        </div>
        <div class="border-t pt-5 mt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">Deskripsi</label>
            <p class="text-md text-gray-800 whitespace-pre-wrap">${data.Deskripsi || 'Tidak ada deskripsi.'}</p>
        </div>
        <div class="border-t pt-5 mt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">File Terlampir</label>
            <div class="mt-1">${getFileLink(data.File)}</div>
        </div>
    `;
}


function handleBodyClick(e) {
    const target = e.target;
    const itemElement = target.closest('[data-id]');
    
    const formModalOverlay = document.getElementById('form-modal-overlay');
    const formModalContent = formModalOverlay ? formModalOverlay.querySelector('div') : null;
    const deleteModalOverlay = document.getElementById('delete-modal-overlay');
    const deleteModalContent = deleteModalOverlay ? deleteModalOverlay.querySelector('div') : null;

    if (formModalContent && (target === document.getElementById('close-form-modal') || (!formModalContent.contains(target) && target === formModalOverlay))) {
        closeFormModal();
    }
    if (deleteModalContent && (target === document.getElementById('cancel-delete-button') || (!deleteModalContent.contains(target) && target === deleteModalOverlay))) {
       deleteModalOverlay.classList.add('hidden');
    }
    
    if (!itemElement) return;
    const id = itemElement.getAttribute('data-id');

    if (target.closest('.edit-btn')) {
        openEditForm(id);
    } else if (target.closest('.delete-btn')) {
        openDeleteModal(id);
    } else if (target.closest('.data-cell')) {
        showDetailView(id);
    }
}

function highlightActiveItem(id) {
    document.querySelectorAll('[data-id]').forEach(el => {
        el.classList.remove('active-item');
        if (el.getAttribute('data-id') === id) {
            el.classList.add('active-item');
        }
    });
}

// --- Fungsi Data & Render (Diperbarui) ---
async function fetchData() {
    // ... sama seperti sebelumnya
}

function renderData() {
    tableBody.innerHTML = '';
    cardContainer.innerHTML = '';

    if (localData.length === 0) {
        // ... sama seperti sebelumnya
        return;
    }

    localData.forEach(item => {
        createTableRow(item);
        createCardView(item);
    });
    
    // Perbarui highlight setelah render ulang
    if (activeDetailId) {
        highlightActiveItem(activeDetailId);
    }
}

function createTableRow(item) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    row.setAttribute('data-id', item['ID Kinerja']);

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap data-cell cursor-pointer">
            <div class="text-sm font-medium text-gray-900">${item.Tanggal || 'N/A'}</div>
        </td>
        <td class="px-6 py-4 data-cell cursor-pointer">
            <div class="text-sm text-gray-700 truncate" style="max-width: 300px;">${item.Deskripsi || ''}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap data-cell cursor-pointer">
            ${getStatusBadge(item.Status)}
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">
            <div class="flex items-center justify-end gap-1">
                ${getFileIcon(item.File)}
                <button class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition edit-btn">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition delete-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </td>
    `;
    tableBody.appendChild(row);
}

function createCardView(item) {
   // ... sama seperti sebelumnya
}

// --- SEMUA FUNGSI LAINNYA (CRUD, Helper, dll) TETAP SAMA ---
// ... (Salin semua fungsi sisanya dari versi sebelumnya)

