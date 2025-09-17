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
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const tableBody = document.getElementById('kinerja-table-body');
const cardContainer = document.getElementById('card-container');
const detailContent = document.getElementById('detail-content');
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


// --- DEKLARASI FUNGSI ---

function handlePinSubmit(e) {
    e.preventDefault();
    pinError.textContent = '';
    const pinModalContent = document.getElementById('pin-modal-content');
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        mainContainer.classList.remove('hidden');
        addDataButton.classList.remove('hidden');
        fetchData();
    } else {
        pinError.textContent = 'PIN salah, coba lagi.';
        pinModalContent.classList.add('shake');
        pinInput.value = '';
        pinInput.focus();
        setTimeout(() => pinModalContent.classList.remove('shake'), 500);
    }
}

function showDetailView(id) {
    const itemData = localData.find(item => item['ID Kinerja'] === id);
    if (!itemData) return;
    activeDetailId = id;
    renderDetail(itemData);
    listView.classList.remove('md:w-full');
    listView.classList.add('md:w-1/2');
    detailView.classList.remove('hidden');
    highlightActiveItem(id);
    if (window.innerWidth < 768) {
        listView.classList.add('hidden');
    }
    lucide.createIcons();
}

function hideDetailView() {
    activeDetailId = null;
    detailView.classList.add('hidden');
    listView.classList.remove('md:w-1/2');
    listView.classList.add('md:w-full');
    if (window.innerWidth < 768) {
        listView.classList.remove('hidden');
    }
    highlightActiveItem(null);
}

function renderDetail(data) {
    detailContent.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">ID Kinerja</label>
                <p class="text-md text-gray-700 font-mono break-all">${data['ID Kinerja'] || '-'}</p>
            </div>
            <div class="text-right">
                <label class="text-xs text-gray-500 uppercase font-semibold">Tanggal</label>
                <p class="text-md text-gray-900">${data.Tanggal || '-'}</p>
            </div>
        </div>

        <div class="border-t pt-5 mt-5">
            <div class="flex justify-between items-center mb-2">
                <label class="text-xs text-gray-500 uppercase font-semibold">Deskripsi</label>
                ${getStatusBadge(data.Status)}
            </div>
            <p class="text-md text-gray-800 whitespace-pre-wrap">${data.Deskripsi || 'Tidak ada deskripsi.'}</p>
        </div>

        <div class="border-t pt-5 mt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">Pratinjau File</label>
            <div class="mt-2">${getFilePreview(data.File)}</div>
        </div>
    `;
    lucide.createIcons(); // Re-render icons inside detail view
}


function handleBodyClick(e) {
    const target = e.target;
    const itemElement = target.closest('[data-id]');
    const formModalContent = formModalOverlay.querySelector('div');
    const deleteModalContent = deleteModalOverlay.querySelector('div');

    if (target === closeFormModalButton || (!formModalContent.contains(target) && target === formModalOverlay)) {
        closeFormModal();
    }
    if (target === cancelDeleteButton || (!deleteModalContent.contains(target) && target === deleteModalOverlay)) {
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
    if (activeDetailId) {
        highlightActiveItem(activeDetailId);
    }
    lucide.createIcons();
}

function createTableRow(item) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    row.setAttribute('data-id', item['ID Kinerja']);
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap data-cell cursor-pointer"><div class="text-sm font-medium text-gray-900">${item.Tanggal || 'N/A'}</div></td>
        <td class="px-6 py-4 data-cell cursor-pointer"><div class="text-sm text-gray-700 truncate" style="max-width: 300px;">${item.Deskripsi || ''}</div></td>
        <td class="px-6 py-4 whitespace-nowrap data-cell cursor-pointer">${getStatusBadge(item.Status)}</td>
        <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">
            <div class="flex items-center justify-end gap-1">
                ${getFileIcon(item.File)}
                <button class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition edit-btn"><i data-lucide="pencil" class="w-5 h-5"></i></button>
                <button class="p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition delete-btn"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
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
            <div class="flex justify-between items-start"><p class="text-sm font-semibold text-gray-800">${item.Deskripsi || 'Tanpa Deskripsi'}</p>${getStatusBadge(item.Status)}</div>
            <p class="text-xs text-gray-500 mt-1">${item.Tanggal || 'N/A'}</p>
        </div>
        <div class="border-t border-gray-100 pt-3 flex items-center justify-end gap-2">
            ${getFileIcon(item.File)}
            <button class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition edit-btn"><i data-lucide="pencil" class="w-5 h-5"></i></button>
            <button class="p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition delete-btn"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
        </div>
    `;
    cardContainer.appendChild(card);
}

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
        const optimisticData = { ...data, Tanggal: data.Tanggal.split('-').reverse().join('/'), File: 'Mengunggah...' };
        localData.unshift(optimisticData);
        renderData();
    }
    closeFormModal();
    try {
        const response = await sendDataToServer(data);
        if (response.status === 'success') {
            updateLocalData(response.savedData);
        } else { throw new Error(response.message || 'Gagal menyimpan data.'); }
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

async function sendDataToServer(data) {
    const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST', redirect: "follow", body: JSON.stringify(data),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    if (!response.ok) throw new Error('Network response was not ok.');
    return response.json();
}

function updateLocalData(savedData) {
    const index = localData.findIndex(item => item['ID Kinerja'] === savedData['ID Kinerja']);
    if (index !== -1) { localData[index] = savedData; } 
    else { localData.unshift(savedData); }
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
        const isActive = btn.getAttribute('data-status') === activeStatus;
        btn.className = `px-3 py-1 text-sm border rounded-full transition ${isActive ? 'text-white border-indigo-600 bg-indigo-600' : 'text-gray-600 border-gray-300 bg-white hover:bg-gray-100'}`;
    });
}

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

function getStatusBadge(status) {
    const color = getStatusColor(status);
    return `<span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${color}">${status || ''}</span>`;
}

function getFileIcon(fileUrl) {
    const iconName = (fileUrl && fileUrl !== 'Gagal mengunggah file' && fileUrl !== 'Mengunggah...') ? 'file-text' : 'file-x';
    const classes = (iconName === 'file-text') ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-400 cursor-not-allowed';
    const wrapper = (iconName === 'file-text') ? `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-full hover:bg-gray-200 transition ${classes}">` : `<span class="p-2 ${classes}">`;
    return `${wrapper}<i data-lucide="${iconName}" class="w-5 h-5"></i>${(iconName === 'file-text') ? '</a>' : '</span>'}`;
}

function createEmbedUrl(originalUrl) {
    if (!originalUrl || typeof originalUrl !== 'string') return null;
    const match = originalUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return null;
}

function getFilePreview(fileUrl) {
    const embedUrl = createEmbedUrl(fileUrl);
    if (embedUrl) {
        return `<iframe src="${embedUrl}" class="w-full h-96 border rounded-lg bg-gray-100" frameborder="0"></iframe>`;
    } else {
        return `<div class="w-full h-96 border rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center p-4">
                    <i data-lucide="file-x" class="w-12 h-12 text-gray-400 mb-2"></i>
                    <p class="text-sm text-gray-500">Tidak ada file yang terlampir atau pratinjau tidak tersedia.</p>
                </div>`;
    }
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

function showLoading() {
    loadingDiv.innerHTML = '<p class="text-gray-500">Memuat data...</p>';
    loadingDiv.style.display = 'block';
    const tableElement = tableBody.parentElement;
    if (tableElement) tableElement.classList.add('hidden');
    cardContainer.classList.add('hidden');
    errorDiv.classList.add('hidden');
}

function hideLoading() {
    loadingDiv.style.display = 'none';
    const tableElement = tableBody.parentElement;
    if (tableElement) tableElement.classList.remove('hidden');
    cardContainer.classList.remove('hidden');
}

function showError(message) {
    hideLoading();
    errorDiv.classList.remove('hidden');
    errorMessageP.textContent = message;
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderStatusButtons();
    pinForm.addEventListener('submit', handlePinSubmit);
    addDataButton.addEventListener('click', openCreateForm);
    document.body.addEventListener('click', handleBodyClick);
    confirmDeleteButton.addEventListener('click', executeDelete);
    form.addEventListener('submit', handleFormSubmit);
    fileInput.addEventListener('change', handleFileSelect);
});

