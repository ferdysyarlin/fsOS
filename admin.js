// --- Konfigurasi ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwEiDsc6nttKld_RyZtSs8r9kRVKN3LKV2ukEgV1c87ZnQWtcvUrK7Lg481zKVYLgFi1Q/exec';
const CORRECT_PIN = '1234';

// --- Variabel Global ---
let localData = [];
const statusOptions = ['Hadir', 'Lembur', 'Cuti', 'Dinas', 'Sakit', 'ST'];

// --- Elemen DOM ---
const pinModalOverlay = document.getElementById('pin-modal-overlay');
const mainContent = document.getElementById('main-content');
const addDataButton = document.getElementById('add-data-button');
const formModalOverlay = document.getElementById('form-modal-overlay');
const form = document.getElementById('kinerja-form');
const submitButton = document.getElementById('submit-button');
const tableBody = document.getElementById('kinerja-table-body');
const cardContainer = document.getElementById('kinerja-card-container');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const statusContainer = document.getElementById('status-container');
const idKinerjaInput = document.getElementById('id-kinerja');
const formActionInput = document.getElementById('form-action');

// --- Inisialisasi ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeStatusButtons();
});

function setupEventListeners() {
    // Verifikasi PIN
    document.getElementById('pin-form').addEventListener('submit', handlePinSubmit);

    // Buka form tambah
    addDataButton.addEventListener('click', handleAddClick);

    // Tutup form
    document.getElementById('close-form-modal').addEventListener('click', () => formModalOverlay.classList.add('hidden'));

    // Submit form (Create/Update)
    form.addEventListener('submit', handleFormSubmit);

    // Klik tombol status
    statusContainer.addEventListener('click', handleStatusClick);

    // Klik tombol aksi (Edit/Delete)
    mainContent.addEventListener('click', handleActionClick);
}

// --- Handler Event ---

function handlePinSubmit(e) {
    e.preventDefault();
    const pinInput = document.getElementById('pin-input');
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        mainContent.classList.remove('hidden');
        addDataButton.classList.remove('hidden');
        fetchData();
    } else {
        const pinError = document.getElementById('pin-error');
        const pinModalContent = document.getElementById('pin-modal-content');
        pinError.textContent = 'PIN salah, coba lagi.';
        pinModalContent.classList.add('shake');
        pinInput.value = '';
        setTimeout(() => pinModalContent.classList.remove('shake'), 500);
    }
}

function handleAddClick() {
    form.reset();
    submitButton.textContent = 'Simpan Kinerja';
    document.getElementById('current-file').textContent = '';
    formActionInput.value = 'create';
    idKinerjaInput.value = createKinerjaId();
    document.getElementById('tanggal').valueAsDate = new Date();
    updateStatusSelection('Hadir');
    formModalOverlay.classList.remove('hidden');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const action = data.action;

    // Optimistic UI
    if (action === 'create') {
        const newRow = createTableRow(data);
        const newCard = createCard(data);
        tableBody.insertAdjacentHTML('afterbegin', newRow);
        cardContainer.insertAdjacentHTML('afterbegin', newCard);
        document.getElementById(`row-${data['ID Kinerja']}`).classList.add('new-row-highlight');
        document.getElementById(`card-${data['ID Kinerja']}`).classList.add('new-row-highlight');
    } else { // update
        updateUI(data, true); // Update UI locally first
    }
    
    formModalOverlay.classList.add('hidden');
    submitButton.disabled = true;

    try {
        const file = document.getElementById('file-upload').files[0];
        let fileData = null;
        if (file) {
            fileData = await readFileAsBase64(file);
        }
        const response = await sendDataToServer({ ...data, file: fileData });
        
        if (response.status === 'success') {
            updateUI(response.savedData); // Sync with final server data
            localData = localData.map(item => item['ID Kinerja'] === response.savedData['ID Kinerja'] ? response.savedData : item);
            if(action === 'create') localData.unshift(response.savedData);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Gagal menyimpan data:', error);
        alert('Gagal menyimpan data. Memuat ulang data untuk konsistensi.');
        fetchData(); // Revert on failure by refetching
    } finally {
        submitButton.disabled = false;
        form.reset();
    }
}

function handleStatusClick(e) {
    if (e.target.matches('.status-btn')) {
        updateStatusSelection(e.target.dataset.value);
    }
}

function handleActionClick(e) {
    const target = e.target.closest('button[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === 'edit') {
        handleEditClick(id);
    } else if (action === 'delete') {
        handleDeleteClick(id);
    }
}

function handleEditClick(id) {
    const itemData = localData.find(item => item['ID Kinerja'] === id);
    if (!itemData) return;

    form.reset();
    submitButton.textContent = 'Update Kinerja';
    formActionInput.value = 'update';
    idKinerjaInput.value = itemData['ID Kinerja'];
    
    // Konversi dd/mm/yyyy ke yyyy-mm-dd untuk input date
    const dateParts = itemData.Tanggal.split('/');
    document.getElementById('tanggal').value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    document.getElementById('deskripsi').value = itemData.Deskripsi;
    updateStatusSelection(itemData.Status);
    
    const currentFileP = document.getElementById('current-file');
    currentFileP.textContent = itemData.File ? `File saat ini: ${itemData.File.substring(itemData.File.lastIndexOf('/') + 1)}` : 'Tidak ada file.';

    formModalOverlay.classList.remove('hidden');
}

async function handleDeleteClick(id) {
    if (!confirm('Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.')) {
        return;
    }

    // Optimistic UI
    const row = document.getElementById(`row-${id}`);
    const card = document.getElementById(`card-${id}`);
    if(row) row.classList.add('row-deleted');
    if(card) card.classList.add('row-deleted');
    
    setTimeout(() => {
        row?.remove();
        card?.remove();
    }, 500);


    try {
        const response = await sendDataToServer({ action: 'delete', 'ID Kinerja': id });
        if (response.status !== 'success') {
            throw new Error(response.message);
        }
        localData = localData.filter(item => item['ID Kinerja'] !== id);
    } catch (error) {
        console.error('Gagal menghapus data:', error);
        alert('Gagal menghapus data. Memuat ulang data untuk konsistensi.');
        fetchData(); // Revert
    }
}

// --- Logika Inti ---

async function fetchData() {
    loadingDiv.style.display = 'block';
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        localData = await response.json();
        renderData(localData);
    } catch (error) {
        errorDiv.classList.remove('hidden');
        document.getElementById('error-message').textContent = error.message;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function sendDataToServer(data) {
    const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    if (!response.ok) throw new Error('Network response was not ok.');
    return response.json();
}

// --- Fungsi Render & Update UI ---

function renderData(data) {
    tableBody.innerHTML = '';
    cardContainer.innerHTML = '';
    if (data.length === 0) {
        const emptyMessage = '<p class="px-6 py-10 text-center text-gray-500">Belum ada data kinerja.</p>';
        tableBody.innerHTML = `<tr><td colspan="5">${emptyMessage}</td></tr>`;
        cardContainer.innerHTML = emptyMessage;
    } else {
        data.forEach(item => {
            tableBody.innerHTML += createTableRow(item);
            cardContainer.innerHTML += createCard(item);
        });
    }
}

function updateUI(data, isOptimistic = false) {
    const id = data['ID Kinerja'];
    const row = document.getElementById(`row-${id}`);
    const card = document.getElementById(`card-${id}`);

    if (row && card) {
        const newRowContent = createTableRow(data);
        const newCardContent = createCard(data);
        row.outerHTML = newRowContent;
        card.outerHTML = newCardContent;
        if(!isOptimistic){
            document.getElementById(`row-${id}`).classList.add('new-row-highlight');
            document.getElementById(`card-${id}`).classList.add('new-row-highlight');
        }
    }
}

// --- Fungsi Helper ---

function initializeStatusButtons() {
    statusContainer.innerHTML = '';
    statusOptions.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = option;
        button.dataset.value = option;
        button.className = `status-btn p-2 text-sm font-medium border rounded-md ${getStatusColor(option, true)}`;
        statusContainer.appendChild(button);
    });
}

function updateStatusSelection(selectedValue) {
    document.getElementById('status-input').value = selectedValue;
    statusContainer.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('selected', ...getStatusColor(btn.dataset.value).split(' '));
        if (btn.dataset.value === selectedValue) {
            btn.classList.add('selected', ...getStatusColor(selectedValue).split(' '));
        }
    });
}

function createTableRow(item) {
    const id = item['ID Kinerja'];
    return `
        <tr id="row-${id}" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.Tanggal || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${item.Deskripsi || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.Status)}">${item.Status || ''}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-center">${createFileIcon(item.File)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                <div class="flex justify-center items-center gap-x-2">
                    <button data-action="edit" data-id="${id}" class="text-indigo-600 hover:text-indigo-900 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                    </button>
                    <button data-action="delete" data-id="${id}" class="text-red-600 hover:text-red-900 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </td>
        </tr>`;
}

function createCard(item) {
    const id = item['ID Kinerja'];
    return `
        <div id="card-${id}" class="bg-white rounded-lg shadow p-4 space-y-3">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm font-medium text-gray-900">${item.Tanggal || 'N/A'}</p>
                    <p class="text-sm text-gray-500">${item.Deskripsi || ''}</p>
                </div>
                <span class="flex-shrink-0 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.Status)}">${item.Status || ''}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                <div>${createFileIcon(item.File)}</div>
                <div class="flex items-center gap-x-2">
                    <button data-action="edit" data-id="${id}" class="text-gray-500 hover:text-indigo-600 p-1">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                    </button>
                    <button data-action="delete" data-id="${id}" class="text-gray-500 hover:text-red-600 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        </div>`;
}

function createFileIcon(fileUrl) {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`;
    if (fileUrl && fileUrl.startsWith('http')) {
        return `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="inline-block text-indigo-600 hover:text-indigo-800">${svgIcon}</a>`;
    } else {
        return `<span class="inline-block text-gray-300 cursor-not-allowed">${svgIcon}</span>`;
    }
}

function createKinerjaId() {
    const date = new Date();
    const random = Math.random().toString(36).substring(2, 7);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${random}`;
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            base64Data: reader.result.split(',')[1],
            fileName: file.name,
            mimeType: file.type
        });
        reader.onerror = error => reject(error);
    });
}

function getStatusColor(status, forButton = false) {
    const colors = { Hadir: 'bg-blue-100 text-blue-800', Lembur: 'bg-purple-100 text-purple-800', Cuti: 'bg-gray-100 text-gray-800', Dinas: 'bg-yellow-100 text-yellow-800', Sakit: 'bg-orange-100 text-orange-800', ST: 'bg-green-100 text-green-800' };
    const buttonColors = { Hadir: 'border-blue-300 hover:bg-blue-50 text-blue-700', Lembur: 'border-purple-300 hover:bg-purple-50 text-purple-700', Cuti: 'border-gray-300 hover:bg-gray-50 text-gray-700', Dinas: 'border-yellow-300 hover:bg-yellow-50 text-yellow-700', Sakit: 'border-orange-300 hover:bg-orange-50 text-orange-700', ST: 'border-green-300 hover:bg-green-50 text-green-700' };
    return forButton ? (buttonColors[status] || 'border-gray-300 text-gray-700') : (colors[status] || 'bg-pink-100 text-pink-800');
}

