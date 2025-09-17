// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyuU4KcMdyg89zW2N-0XNbu3RZOM9ADKPVFSQ8T7HmWr-7w2x1CUjH7UdNIJy7LdUSqDg/exec';
const CORRECT_PIN = '1234'; // Ganti dengan PIN 4 digit rahasia Anda

// --- Variabel Global ---
let localData = [];
let fileData = null;
let currentlyEditingId = null;
const statusOptions = ['Hadir', 'Lembur', 'Cuti', 'Dinas', 'Sakit', 'ST'];

// --- Elemen DOM ---
const pinModalOverlay = document.getElementById('pin-modal-overlay');
const pinForm = document.getElementById('pin-form');
const pinInput = document.getElementById('pin-input');
const pinError = document.getElementById('pin-error');
const addDataButton = document.getElementById('add-data-button');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessageP = document.getElementById('error-message');

// Elemen Tampilan
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const tableBody = document.getElementById('kinerja-table-body');
const cardContainer = document.getElementById('card-container');
const detailContent = document.getElementById('detail-content');
const backToListButton = document.getElementById('back-to-list-button');

// Elemen Form Modal & Delete Modal (tetap sama)
// ... (semua elemen form dan delete modal)

// --- Inisialisasi Aplikasi ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (setupEventListeners dan renderStatusButtons tetap sama)
    setupEventListeners();
    renderStatusButtons();
});

function setupEventListeners() {
    pinForm.addEventListener('submit', handlePinSubmit);
    addDataButton.addEventListener('click', openCreateForm);
    // ... (event listener lain tetap sama)
    
    // Event listener baru untuk tombol kembali
    backToListButton.addEventListener('click', hideDetailView);

    // Modifikasi event listener utama
    document.body.addEventListener('click', handleBodyClick);
}


function handlePinSubmit(e) {
    e.preventDefault();
    pinError.textContent = '';
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        listView.classList.remove('hidden'); // Tampilkan list view
        addDataButton.classList.remove('hidden');
        fetchData();
    } else {
        // ... (logika error PIN tetap sama)
    }
}

// --- Logika Tampilan (View Management) ---
function showDetailView(id) {
    const itemData = localData.find(item => item['ID Kinerja'] === id);
    if (!itemData) return;

    renderDetail(itemData);
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    window.scrollTo(0, 0); // Scroll ke atas halaman
}

function hideDetailView() {
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
}

function renderDetail(data) {
    detailContent.innerHTML = `
        <div>
            <label class="text-xs text-gray-500 uppercase font-semibold">ID Kinerja</label>
            <p class="text-md text-gray-700 font-mono">${data['ID Kinerja'] || '-'}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 border-t pt-5">
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">Tanggal</label>
                <p class="text-md text-gray-900">${data.Tanggal || '-'}</p>
            </div>
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">Status</label>
                <p>${getStatusBadge(data.Status)}</p>
            </div>
        </div>
        <div class="border-t pt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">Deskripsi</label>
            <p class="text-md text-gray-800 whitespace-pre-wrap">${data.Deskripsi || 'Tidak ada deskripsi.'}</p>
        </div>
        <div class="border-t pt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">File Terlampir</label>
            <div class="mt-1">${getFileLink(data.File)}</div>
        </div>
    `;
}

// --- Pengganti `handleMainContentClick` ---
function handleBodyClick(e) {
    const target = e.target;
    const itemElement = target.closest('[data-id]');
    
    // Logika untuk form & modal (dipindahkan ke sini)
    const formModalContent = document.getElementById('form-modal-content');
    const deleteModalContent = document.querySelector('#delete-modal-overlay > div');

    if (target === document.getElementById('close-form-modal') || (!formModalContent.contains(target) && target === formModalOverlay)) {
        closeFormModal();
    }
    if (target === document.getElementById('cancel-delete-button') || (!deleteModalContent.contains(target) && target === deleteModalOverlay)) {
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


// --- Sisanya, fungsi-fungsi lain sebagian besar tetap sama ---
// (fetchData, renderData, createTableRow, createCardView, openCreateForm, 
// openEditForm, closeFormModal, handleFormSubmit, openDeleteModal, executeDelete,
// dan semua fungsi helper lainnya tidak berubah secara signifikan)

// Di bawah ini adalah salinan lengkap dari fungsi-fungsi tersebut untuk kejelasan

async function fetchData() {
    showLoading();
    try {
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        localData = data;
        renderData();
        hideLoading();
    } catch (error) {
        showError(error.message);
    }
}

function renderData() {
    tableBody.innerHTML = '';
    cardContainer.innerHTML = '';

    if (localData.length === 0) {
        const emptyMessage = '<p class="col-span-full text-center py-10 text-gray-500">Belum ada data kinerja.</p>';
        tableBody.innerHTML = `<tr><td colspan="4">${emptyMessage}</td></tr>`;
        cardContainer.innerHTML = emptyMessage;
        return;
    }

    localData.forEach(item => {
        createTableRow(item);
        createCardView(item);
    });
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
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
            <div class="flex items-center justify-end gap-2">
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
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-md p-4 space-y-3';
    card.setAttribute('data-id', item['ID Kinerja']);

    card.innerHTML = `
        <div class="data-cell cursor-pointer">
            <div class="flex justify-between items-start">
                <p class="text-sm font-semibold text-gray-800">${item.Deskripsi || 'Tanpa Deskripsi'}</p>
                ${getStatusBadge(item.Status)}
            </div>
            <p class="text-xs text-gray-500 mt-1">${item.Tanggal || 'N/A'}</p>
        </div>
        <div class="border-t border-gray-100 pt-3 flex items-center justify-end gap-2">
            ${getFileIcon(item.File)}
            <button class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition edit-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition delete-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
    `;
    cardContainer.appendChild(card);
}

const formModalOverlay = document.getElementById('form-modal-overlay');
const closeFormModalButton = document.getElementById('close-form-modal');
const form = document.getElementById('kinerja-form');
const submitButton = document.getElementById('submit-button');
const idKinerjaInput = document.getElementById('id-kinerja');
const tanggalInput = document.getElementById('tanggal');
const deskripsiInput = document.getElementById('deskripsi');
const statusContainer = document.getElementById('status-container');
const statusInput = document.getElementById('status-input');
const fileInput = document.getElementById('file-input');
const fileNameSpan = document.getElementById('file-name');
const fileLamaP = document.getElementById('file-lama');

const deleteModalOverlay = document.getElementById('delete-modal-overlay');
const cancelDeleteButton = document.getElementById('cancel-delete-button');
const confirmDeleteButton = document.getElementById('confirm-delete-button');

function openCreateForm() {
    currentlyEditingId = null;
    form.reset();
    idKinerjaInput.value = generateId();
    tanggalInput.valueAsDate = new Date();
    fileData = null;
    fileNameSpan.textContent = 'Pilih file (opsional)';
    fileLamaP.textContent = '';
    setActiveStatus('Hadir');
    formModalOverlay.classList.remove('hidden');
    formModalOverlay.querySelector('div').classList.add('scale-100');
}

function openEditForm(id) {
    const item = localData.find(d => d['ID Kinerja'] === id);
    if (!item) return;
    currentlyEditingId = id;
    form.reset();
    idKinerjaInput.value = item['ID Kinerja'];
    tanggalInput.value = item.Tanggal ? item.Tanggal.split('/').reverse().join('-') : '';
    deskripsiInput.value = item.Deskripsi || '';
    fileData = null;
    fileNameSpan.textContent = 'Pilih file baru (opsional)';
    fileLamaP.textContent = item.File ? `File saat ini: ${item.File.split('/').pop()}` : 'Tidak ada file terunggah.';
    setActiveStatus(item.Status || 'Hadir');
    formModalOverlay.classList.remove('hidden');
    formModalOverlay.querySelector('div').classList.add('scale-100');
}

function closeFormModal() {
    const modalContent = formModalOverlay.querySelector('div');
    modalContent.classList.remove('scale-100');
    setTimeout(() => formModalOverlay.classList.add('hidden'), 200);
}

form.addEventListener('submit', handleFormSubmit);
async function handleFormSubmit(e) {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.file = fileData;
    const action = currentlyEditingId ? 'update' : 'create';
    data.action = action;
    if (action === 'create') {
        const optimisticData = { ...data };
        optimisticData.Tanggal = data.Tanggal.split('-').reverse().join('/');
        optimisticData.File = 'Mengunggah...';
        localData.unshift(optimisticData);
        renderData();
    }
    closeFormModal();
    try {
        const response = await sendDataToServer(data);
        if (response.status === 'success') {
            updateLocalData(response.savedData);
        } else {
            throw new Error(response.message || 'Gagal menyimpan data.');
        }
    } catch (error) {
        showError(error.message);
        fetchData();
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan Kinerja';
    }
}

function openDeleteModal(id) {
    confirmDeleteButton.setAttribute('data-id', id);
    deleteModalOverlay.classList.remove('hidden');
}
confirmDeleteButton.addEventListener('click', executeDelete);
function executeDelete() {
    const id = confirmDeleteButton.getAttribute('data-id');
    if (!id) return;
    const originalData = [...localData];
    localData = localData.filter(item => item['ID Kinerja'] !== id);
    renderData();
    deleteModalOverlay.classList.add('hidden');
    sendDataToServer({ 'ID Kinerja': id, action: 'delete' })
        .catch(error => {
            showError(`Gagal menghapus: ${error.message}`);
            localData = originalData;
            renderData();
        });
}

function getStatusBadge(status) {
    const color = getStatusColor(status);
    return `<span class="px-2.5 py-0.5 inline-flex text-sm leading-5 font-semibold rounded-full ${color}">${status || ''}</span>`;
}

function getFileLink(fileUrl) {
    if (fileUrl && fileUrl !== 'Gagal mengunggah file' && fileUrl !== 'Mengunggah...') {
        return `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline font-semibold transition">
            <span>Lihat File</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>`;
    } else {
        return `<p class="text-gray-500">Tidak ada file yang terlampir.</p>`;
    }
}

function getFileIcon(fileUrl) {
    if (fileUrl && fileUrl !== 'Gagal mengunggah file' && fileUrl !== 'Mengunggah...') {
        return `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-full hover:bg-gray-200 text-indigo-600 hover:text-indigo-800 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        </a>`;
    } else {
        return `<span class="p-2 text-gray-400 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        </span>`;
    }
}
fileInput.addEventListener('change', handleFileSelect);
function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) {
        fileData = null;
        fileNameSpan.textContent = 'Pilih file (opsional)';
        return;
    }
    fileNameSpan.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];
        fileData = { base64Data, fileName: file.name, mimeType: file.type };
    };
    reader.readAsDataURL(file);
}

function generateId() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7);
    return `${yyyy}${mm}${dd}-${random}`;
}

async function sendDataToServer(data) {
    const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        redirect: "follow",
        body: JSON.stringify(data),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    if (!response.ok) throw new Error('Network response was not ok.');
    return response.json();
}

function updateLocalData(savedData) {
    const index = localData.findIndex(item => item['ID Kinerja'] === savedData['ID Kinerja']);
    if (index !== -1) {
        localData[index] = savedData;
    } else {
        localData.unshift(savedData);
    }
    renderData();
}

function renderStatusButtons() {
    statusContainer.innerHTML = '';
    statusOptions.forEach(status => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = status;
        button.className = 'px-3 py-1 text-sm border rounded-full transition';
        button.setAttribute('data-status', status);
        button.addEventListener('click', () => setActiveStatus(status));
        statusContainer.appendChild(button);
    });
}

function setActiveStatus(activeStatus) {
    statusInput.value = activeStatus;
    statusContainer.querySelectorAll('button').forEach(btn => {
        if (btn.getAttribute('data-status') === activeStatus) {
            btn.className = `px-3 py-1 text-sm border rounded-full transition text-white border-indigo-600 bg-indigo-600`;
        } else {
            btn.className = `px-3 py-1 text-sm border rounded-full transition text-gray-600 border-gray-300 bg-white hover:bg-gray-100`;
        }
    });
}

function showLoading() {
    loadingDiv.innerHTML = '<p class="text-gray-500">Memuat data...</p>';
    loadingDiv.style.display = 'block';
    tableBody.parentElement.classList.add('hidden');
    cardContainer.classList.add('hidden');
    errorDiv.classList.add('hidden');
}

function hideLoading() {
    loadingDiv.style.display = 'none';
    tableBody.parentElement.classList.remove('hidden');
    cardContainer.classList.remove('hidden');
}

function showError(message) {
    hideLoading();
    errorDiv.classList.remove('hidden');
    errorMessageP.textContent = message;
}

function getStatusColor(status) {
    switch (status) {
        case 'Hadir': return 'bg-blue-100 text-blue-800';
        case 'Lembur': return 'bg-purple-100 text-purple-800';
        case 'Cuti': return 'bg-gray-100 text-gray-800';
        case 'Dinas': return 'bg-yellow-100 text-yellow-800';
        case 'Sakit': return 'bg-orange-100 text-orange-800';
        case 'ST': return 'bg-green-100 text-green-800';
        default: return 'bg-pink-100 text-pink-800';
    }
}

