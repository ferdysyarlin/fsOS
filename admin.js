// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzU9-HXyIc4_aXXF8p17ckDMtG7zQYeCU2RnMk94cKpZVFv46oCUw1Md8zLuUgIwFSj2Q/exec';
const CORRECT_PIN = '3390'; // Ganti dengan PIN 4 digit rahasia Anda

// --- Variabel Global ---
let localData = [];
let fileData = [];
let currentlyEditingId = null;
let activeDetailId = null;
const statusOptions = ['Hadir', 'Lembur', 'Cuti', 'Dinas', 'Sakit', 'ST'];
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Palet Warna Pastel Baru
const colorOptions = {
    'default': 'bg-white hover:bg-gray-50',
    'blue': 'bg-blue-50 hover:bg-blue-100',
    'green': 'bg-green-50 hover:bg-green-100',
    'yellow': 'bg-yellow-50 hover:bg-yellow-100',
    'red': 'bg-red-50 hover:bg-red-100',
    'purple': 'bg-purple-50 hover:bg-purple-100',
};
const colorClasses = {
    'blue': 'bg-blue-300',
    'green': 'bg-green-300',
    'yellow': 'bg-yellow-300',
    'red': 'bg-red-300',
    'purple': 'bg-purple-300',
}

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
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const monthFilter = document.getElementById('month-filter');
const yearFilter = document.getElementById('year-filter');
const resetFilterButton = document.getElementById('reset-filter-button');
const reloadDataButton = document.getElementById('reload-data-button');
// Mobile Filter Elements
const mobileFilterButton = document.getElementById('mobile-filter-button');
const mobileFilterModal = document.getElementById('mobile-filter-modal');
const closeMobileFilterButton = document.getElementById('close-mobile-filter-button');
const applyMobileFilterButton = document.getElementById('apply-mobile-filter-button');
const searchInputMobile = document.getElementById('search-input-mobile');
const statusFilterMobile = document.getElementById('status-filter-mobile');
const monthFilterMobile = document.getElementById('month-filter-mobile');
const yearFilterMobile = document.getElementById('year-filter-mobile');
const colorContainer = document.getElementById('color-container');
const warnaInput = document.getElementById('warna-input');
const resetFilterButtonMobile = document.getElementById('reset-filter-button-mobile');

// --- DEKLARASI FUNGSI ---

function handlePinSubmit(e) {
    e.preventDefault();
    const pinModalContent = pinModalOverlay.querySelector('div');
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
    let files = [];
    try {
        if (data.File && typeof data.File === 'string') files = JSON.parse(data.File);
    } catch (e) { console.error("Gagal parse JSON file:", e); }

    detailContent.innerHTML = `
        <button onclick="hideDetailView()" class="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            Kembali
        </button>
        <div class="flex justify-between items-start">
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">ID Kinerja</label>
                <p class="text-sm text-gray-700 font-mono break-all">${data['ID Kinerja'] || '-'}</p>
            </div>
            <div class="text-right flex-shrink-0 ml-4">
                <label class="text-xs text-gray-500 uppercase font-semibold">Tanggal</label>
                <p class="text-sm text-gray-900">${data.Tanggal || '-'}</p>
            </div>
        </div>
        <div class="border-t pt-5 mt-5">
            <div class="flex justify-between items-center mb-2">
                <label class="text-xs text-gray-500 uppercase font-semibold">Deskripsi</label>
                ${getStatusBadge(data.Status)}
            </div>
            <p class="text-sm text-gray-800 whitespace-pre-wrap">${data.Deskripsi || 'Tidak ada deskripsi.'}</p>
        </div>
        <div class="border-t pt-5 mt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">Lampiran</label>
            <div class="mt-2">${renderFilePreviews(files)}</div>
        </div>
    `;
    lucide.createIcons();
}

function handleBodyClick(e) {
    const target = e.target;
    const itemElement = target.closest('[data-id]');
    
    if (!itemElement) return;
    const id = itemElement.getAttribute('data-id');

    if (target.closest('.edit-btn')) openEditForm(id);
    else if (target.closest('.delete-btn')) openDeleteModal(id);
    else if (target.closest('.pin-btn')) togglePin(id);
    else if (target.closest('.data-cell')) showDetailView(id);
}

function highlightActiveItem(id) {
    document.querySelectorAll('[data-id]').forEach(el => {
        el.classList.toggle('active-item', el.getAttribute('data-id') === id);
    });
}

async function fetchData() {
    showLoading();
    try {
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        localData = await response.json();
        populateFilters();
        applyAndRenderFilters();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function renderData(dataToRender) {
    tableBody.innerHTML = '';
    cardContainer.innerHTML = '';
    if (dataToRender.length === 0) {
        const emptyMessage = '<p class="col-span-full text-center py-10 text-gray-500">Tidak ada data yang cocok dengan filter.</p>';
        tableBody.innerHTML = `<tr><td colspan="5">${emptyMessage}</td></tr>`;
        cardContainer.innerHTML = emptyMessage;
        return;
    }
    dataToRender.forEach(item => {
        createTableRow(item);
        createCardView(item);
    });
    if (activeDetailId) highlightActiveItem(activeDetailId);
    lucide.createIcons();
}

function createTableRow(item) {
    const row = document.createElement('tr');
    const colorClass = colorOptions[item.Warna] || colorOptions['default'];
    row.className = `${colorClass}`;
    row.setAttribute('data-id', item['ID Kinerja']);
    
    const isPinned = item.Pin === true || item.Pin === 'TRUE';
    const pinIcon = isPinned ? `<i data-lucide="pin" class="w-5 h-5 text-indigo-600 fill-indigo-200"></i>` : `<i data-lucide="pin" class="w-5 h-5"></i>`;

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap data-cell cursor-pointer">
            ${getPreviewThumbnail(item.File)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap data-cell cursor-pointer"><div class="text-sm font-medium text-gray-900">${item.Tanggal || 'N/A'}</div></td>
        <td class="px-6 py-4 data-cell cursor-pointer">
            <div class="text-sm text-gray-700 whitespace-pre-wrap max-h-20 overflow-y-auto">${item.Deskripsi || ''}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap data-cell cursor-pointer">${getStatusBadge(item.Status)}</td>
        <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">
            <div class="flex items-center justify-end gap-1">
                <button class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition pin-btn" title="Sematkan">${pinIcon}</button>
                <button class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition edit-btn" title="Ubah"><i data-lucide="pencil" class="w-5 h-5"></i></button>
                <button class="p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition delete-btn" title="Hapus"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </td>`;
    tableBody.appendChild(row);
}

function createCardView(item) {
   const card = document.createElement('div');
   const colorClass = colorOptions[item.Warna] || colorOptions['default'];
   card.className = `rounded-xl shadow-md p-4 flex flex-col gap-3 ${colorClass}`;
   card.setAttribute('data-id', item['ID Kinerja']);

   const isPinned = item.Pin === true || item.Pin === 'TRUE';
   const pinIcon = isPinned ? `<i data-lucide="pin" class="w-5 h-5 text-indigo-600 fill-indigo-200"></i>` : `<i data-lucide="pin" class="w-5 h-5"></i>`;

   card.innerHTML = `
        <div class="data-cell cursor-pointer flex-1 flex items-start gap-4">
            ${getPreviewThumbnail(item.File)}
            <div class="flex-1 min-w-0">
                 <p class="text-xs font-normal text-gray-800 whitespace-pre-wrap max-h-16 overflow-y-auto">${item.Deskripsi || 'Tanpa Deskripsi'}</p>
            </div>
        </div>
        <div class="border-t border-gray-200 pt-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <p class="text-xs text-gray-500">${item.Tanggal || 'N/A'}</p>
                ${getStatusBadge(item.Status)}
            </div>
            <div class="flex items-center">
                 <button class="p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800 transition pin-btn" title="Sematkan">${pinIcon}</button>
                 <button class="p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800 transition edit-btn" title="Ubah"><i data-lucide="pencil" class="w-5 h-5"></i></button>
                 <button class="p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-red-600 transition delete-btn" title="Hapus"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>`;
    cardContainer.appendChild(card);
}

function openCreateForm() {
    currentlyEditingId = null;
    form.reset();
    idKinerjaInput.value = generateId();
    tanggalInput.valueAsDate = new Date();
    fileData = [];
    fileNameSpan.textContent = 'Pilih hingga 5 file (opsional)';
    fileLamaP.innerHTML = '';
    setActiveStatus('Hadir');
    setActiveColor('default');
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
    fileData = [];
    fileNameSpan.textContent = 'Pilih file baru (opsional)';
    
    let files = [];
    try { if (item.File) files = JSON.parse(item.File); } catch(e){}
    fileLamaP.innerHTML = files.length > 0 ? `File saat ini: ${files.map(f => f.name).join(', ')}` : 'Tidak ada file terunggah.';

    setActiveStatus(item.Status || 'Hadir');
    setActiveColor(item.Warna || 'default');
    formModalOverlay.classList.remove('hidden');
    formModalOverlay.querySelector('div').classList.add('scale-100');
}

function closeFormModal() { 
    const modal = formModalOverlay.querySelector('div');
    modal.classList.remove('scale-100');
    setTimeout(() => {
        formModalOverlay.classList.add('hidden');
    }, 150);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    const data = Object.fromEntries(new FormData(form).entries());
    data.files = fileData;
    data.action = currentlyEditingId ? 'update' : 'create';
    
    if (data.action === 'create') {
        const optimisticData = { ...data, Tanggal: data.Tanggal.split('-').reverse().join('/'), File: '[]', Pin: false, Warna: data.Warna };
        localData.unshift(optimisticData);
        applyAndRenderFilters();
    }
    closeFormModal();
    try {
        const response = await sendDataToServer(data);
        if (response.status === 'success') updateLocalData(response.savedData);
        else throw new Error(response.message || 'Gagal menyimpan data.');
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
    applyAndRenderFilters();
    deleteModalOverlay.classList.add('hidden');
    sendDataToServer({ 'ID Kinerja': id, action: 'delete' })
        .catch(error => {
            showError(`Gagal menghapus: ${error.message}`);
            localData = originalData;
            applyAndRenderFilters();
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
    if (index !== -1) {
        localData[index] = savedData;
    } else {
        localData.unshift(savedData);
    }
    applyAndRenderFilters();
}

function renderStatusButtons() {
    statusContainer.innerHTML = '';
    statusOptions.forEach(status => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = status;
        button.className = 'px-3 py-1 text-sm border rounded-full transition';
        button.dataset.status = status;
        button.onclick = () => setActiveStatus(status);
        statusContainer.appendChild(button);
    });
}

function setActiveStatus(activeStatus) {
    statusInput.value = activeStatus;
    statusContainer.querySelectorAll('button').forEach(btn => {
        const isActive = btn.dataset.status === activeStatus;
        btn.className = `px-3 py-1 text-sm border rounded-full transition ${isActive ? 'text-white border-indigo-600 bg-indigo-600' : 'text-gray-600 border-gray-300 bg-white hover:bg-gray-100'}`;
    });
}

function handleFileSelect() {
    const files = fileInput.files;
    if (!files.length) {
        fileData = [];
        fileNameSpan.textContent = 'Pilih hingga 5 file (opsional)';
        return;
    }
    if (files.length > 5) {
        alert('Anda hanya dapat memilih maksimal 5 file.');
        fileInput.value = '';
        return;
    }
    fileNameSpan.textContent = `${files.length} file dipilih.`;
    fileData = [];
    let filesToProcess = files.length;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            fileData.push({ base64Data: e.target.result.split(',')[1], fileName: file.name, mimeType: file.type });
            filesToProcess--;
            if (filesToProcess === 0) console.log(`${fileData.length} files ready to upload.`);
        };
        reader.readAsDataURL(file);
    });
}

function generateId() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}-${Math.random().toString(36).substring(2, 7)}`;
}

function getStatusBadge(status) {
    return `<span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}">${status || ''}</span>`;
}

function getPreviewThumbnail(fileJson) {
    let files = [];
    try { if (fileJson) files = JSON.parse(fileJson); } catch (e) {}
    const firstImage = files.find(f => f.type.startsWith('image/'));
    if (firstImage) {
        const thumbnailUrl = createThumbnailUrl(firstImage.url);
        return `<img src="${thumbnailUrl}" class="w-10 h-10 rounded-md object-cover border flex-shrink-0" loading="lazy">`;
    }
    return `<div class="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0"><i data-lucide="file-text" class="w-5 h-5"></i></div>`;
}

function createEmbedUrl(originalUrl) {
    const match = originalUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
}

function createThumbnailUrl(originalUrl) {
    const match = originalUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}` : originalUrl;
}

function renderFilePreviews(files) {
    if (!files || !files.length) {
        return `<div class="w-full h-48 border rounded-lg bg-gray-50 flex flex-col items-center justify-center p-4"><i data-lucide="file-x" class="w-12 h-12 text-gray-400 mb-2"></i><p class="text-sm text-gray-500">Tidak ada file terlampir.</p></div>`;
    }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const docFiles = files.filter(f => !f.type.startsWith('image/'));
    let html = '';
    if (imageFiles.length) {
        html += `<div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">`;
        imageFiles.forEach(file => {
            const thumbnailUrl = createThumbnailUrl(file.url);
            html += `<a href="${file.url}" target="_blank" rel="noopener noreferrer"><img src="${thumbnailUrl}" class="w-full h-32 object-cover rounded-md border hover:opacity-80 transition" loading="lazy" /></a>`;
        });
        html += `</div>`;
    }
    if (docFiles.length) {
        html += `<div class="space-y-4">`;
        docFiles.forEach(file => {
            const embedUrl = createEmbedUrl(file.url);
            if (embedUrl) html += `<iframe src="${embedUrl}" class="w-full h-96 border rounded-lg bg-gray-100" frameborder="0"></iframe>`;
        });
        html += `</div>`;
    }
    return html;
}

function getStatusColor(status) {
    const colors = { Hadir: 'bg-blue-100 text-blue-800', Lembur: 'bg-purple-100 text-purple-800', Cuti: 'bg-gray-100 text-gray-800', Dinas: 'bg-yellow-100 text-yellow-800', Sakit: 'bg-orange-100 text-orange-800', ST: 'bg-green-100 text-green-800' };
    return colors[status] || 'bg-pink-100 text-pink-800';
}

function showLoading() {
    loadingDiv.innerHTML = '<p class="text-gray-500">Memuat data...</p>';
    loadingDiv.style.display = 'block';
    if(tableBody.parentElement) tableBody.parentElement.classList.add('hidden');
    cardContainer.classList.add('hidden');
    errorDiv.classList.add('hidden');
}

function hideLoading() {
    loadingDiv.style.display = 'none';
    if(tableBody.parentElement) tableBody.parentElement.classList.remove('hidden');
    cardContainer.classList.remove('hidden');
}

function showError(message) {
    hideLoading();
    errorDiv.classList.remove('hidden');
    errorMessageP.textContent = message;
}

function populateFilters() {
    const years = [...new Set(localData.map(item => item.Tanggal.split('/')[2]))].sort((a,b) => b-a);
    const yearOptions = '<option value="">Semua Tahun</option>' + years.map(year => `<option value="${year}">${year}</option>`).join('');
    yearFilter.innerHTML = yearOptions;
    yearFilterMobile.innerHTML = yearOptions;
    
    const statusOptionsHtml = '<option value="">Semua Status</option>' + statusOptions.map(status => `<option value="${status}">${status}</option>`).join('');
    statusFilter.innerHTML = statusOptionsHtml;
    statusFilterMobile.innerHTML = statusOptionsHtml;

    const monthOptions = '<option value="">Semua Bulan</option>' + monthNames.map((name, index) => `<option value="${String(index + 1).padStart(2, '0')}">${name}</option>`).join('');
    monthFilter.innerHTML = monthOptions;
    monthFilterMobile.innerHTML = monthOptions;
}

function applyAndRenderFilters() {
    const searchTerm = (searchInput.value || searchInputMobile.value).toLowerCase();
    const status = statusFilter.value;
    const month = monthFilter.value;
    const year = yearFilter.value;
    
    let filteredData = localData.filter(item => {
        const [, itemMonth, itemYear] = item.Tanggal.split('/');
        const searchMatch = !searchTerm || (item.Deskripsi && item.Deskripsi.toLowerCase().includes(searchTerm));
        const statusMatch = !status || item.Status === status;
        const monthMatch = !month || itemMonth === month;
        const yearMatch = !year || itemYear === year;
        return searchMatch && statusMatch && monthMatch && yearMatch;
    });

    filteredData.sort((a, b) => {
        const pinA = a.Pin === true || a.Pin === 'TRUE' ? 1 : 0;
        const pinB = b.Pin === true || b.Pin === 'TRUE' ? 1 : 0;
        if (pinB !== pinA) return pinB - pinA;
        return 0;
    });

    renderData(filteredData);
}


function resetFilters() {
    searchInput.value = '';
    searchInputMobile.value = '';
    statusFilter.value = '';
    monthFilter.value = '';
    yearFilter.value = '';
    applyAndRenderFilters();
}

function syncMobileFilters() {
    statusFilter.value = statusFilterMobile.value;
    monthFilter.value = monthFilterMobile.value;
    yearFilter.value = yearFilterMobile.value;
}

function syncDesktopFilters() {
    statusFilterMobile.value = statusFilter.value;
    monthFilterMobile.value = monthFilter.value;
    yearFilterMobile.value = yearFilter.value;
}

function renderColorButtons() {
    colorContainer.innerHTML = '';
    const noColorBtn = document.createElement('button');
    noColorBtn.type = 'button';
    noColorBtn.className = 'color-swatch w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center';
    noColorBtn.dataset.color = 'default';
    noColorBtn.innerHTML = `<i data-lucide="slash" class="w-5 h-5 text-gray-500"></i>`;
    noColorBtn.onclick = () => setActiveColor('default');
    colorContainer.appendChild(noColorBtn);

    Object.keys(colorClasses).forEach(color => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `color-swatch w-8 h-8 rounded-full ${colorClasses[color]}`;
        button.dataset.color = color;
        button.onclick = () => setActiveColor(color);
        colorContainer.appendChild(button);
    });
}

function setActiveColor(activeColor) {
    warnaInput.value = activeColor === 'default' ? '' : activeColor;
    
    const ringColorValues = {
        blue: '#93c5fd',   // Tailwind blue-300
        green: '#86efac',  // Tailwind green-300
        yellow: '#fde047', // Tailwind yellow-300
        red: '#fca5a5',    // Tailwind red-300
        purple: '#c4b5fd', // Tailwind purple-300
        default: '#9ca3af' // Tailwind gray-400
    };

    colorContainer.querySelectorAll('.color-swatch').forEach(btn => {
        const btnColor = btn.dataset.color;
        const isSelected = btnColor === activeColor;
        btn.classList.toggle('selected', isSelected);

        if (isSelected) {
            btn.style.setProperty('--ring-color', ringColorValues[btnColor]);
        }
    });
}

async function togglePin(id) {
    const item = localData.find(d => d['ID Kinerja'] === id);
    if (!item) return;

    const currentPinStatus = item.Pin === true || item.Pin === 'TRUE';
    item.Pin = !currentPinStatus;

    applyAndRenderFilters();

    const dataToUpdate = { ...item, Pin: item.Pin, action: 'update', files: [] };
    
    try {
        await sendDataToServer(dataToUpdate);
    } catch (error) {
        showError(`Gagal menyimpan status pin: ${error.message}`);
        item.Pin = currentPinStatus; 
        applyAndRenderFilters();
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderStatusButtons();
    renderColorButtons();
    pinForm.addEventListener('submit', handlePinSubmit);
    addDataButton.addEventListener('click', openCreateForm);
    document.body.addEventListener('click', handleBodyClick);
    closeFormModalButton.addEventListener('click', closeFormModal);
    cancelDeleteButton.addEventListener('click', () => deleteModalOverlay.classList.add('hidden'));
    confirmDeleteButton.addEventListener('click', executeDelete);
    form.addEventListener('submit', handleFormSubmit);
    fileInput.addEventListener('change', handleFileSelect);
    resetFilterButton.addEventListener('click', resetFilters);
    reloadDataButton.addEventListener('click', fetchData);
    [searchInput, statusFilter, monthFilter, yearFilter].forEach(el => el.addEventListener('input', applyAndRenderFilters));
    searchInputMobile.addEventListener('input', applyAndRenderFilters);
    
    mobileFilterButton.addEventListener('click', () => {
        syncDesktopFilters();
        mobileFilterModal.classList.remove('hidden');
    });
    closeMobileFilterButton.addEventListener('click', () => mobileFilterModal.classList.add('hidden'));
    applyMobileFilterButton.addEventListener('click', () => {
        syncMobileFilters();
        applyAndRenderFilters();
        mobileFilterModal.classList.add('hidden');
    });
});
