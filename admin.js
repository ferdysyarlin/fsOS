// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzLKJ3844QnYp2VFHnxZqOIgXiJQnOsdODkNWIR62yAV6TAwm293umXAzQBgZEv0rEY/exec';
const CORRECT_PIN = '3390'; // Ganti dengan PIN 4 digit rahasia Anda

// --- Variabel Global ---
let localData = []; // Untuk data Kinerja
let skpData = []; // Untuk data SKP
let fileData = [];
let currentlyEditingId = null;
let activeDetailId = null;
let activeView = 'kinerja'; // 'kinerja' atau 'skp'
let isDataLoading = { kinerja: false, skp: false };
const statusOptions = ['Hadir', 'Lembur', 'Cuti', 'Dinas', 'Sakit', 'ST'];
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
let currentPage = 1;
const ITEMS_PER_PAGE = 100;

// Palet Warna Pastel
const colorOptions = {
    'default': 'bg-white hover:bg-gray-50', 'blue': 'bg-blue-50 hover:bg-blue-100', 'green': 'bg-green-50 hover:bg-green-100',
    'yellow': 'bg-yellow-50 hover:bg-yellow-100', 'red': 'bg-red-50 hover:bg-red-100', 'purple': 'bg-purple-50 hover:bg-purple-100',
};
const colorClasses = {
    'blue': 'bg-blue-300', 'green': 'bg-green-300', 'yellow': 'bg-yellow-300', 'red': 'bg-red-300', 'purple': 'bg-purple-300',
};

// --- Elemen DOM ---
const body = document.body;
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
const detailContent = document.getElementById('detail-content');
const pageTitle = document.getElementById('page-title');

// Elemen Navigasi & Sidebar
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const hamburgerButton = document.getElementById('hamburger-button');
const closeSidebarButton = document.getElementById('close-sidebar-button');
const navKinerja = document.getElementById('nav-kinerja');
const navSkp = document.getElementById('nav-skp');

// Elemen View
const kinerjaView = document.getElementById('kinerja-view');
const tableBody = document.getElementById('kinerja-table-body');
const cardContainer = document.getElementById('kinerja-card-container');
const skpView = document.getElementById('skp-view');
const skpTableBody = document.getElementById('skp-table-body');
const filterBar = document.getElementById('filter-bar');
const paginationContainer = document.getElementById('pagination-container');


// Elemen Form & Modal
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

// --- FUNGSI UTAMA & MANAJEMEN APLIKASI ---

async function initializeApp() {
    await fetchData('kinerja', false);
    fetchData('skp', true);
}

function handlePinSubmit(e) {
    e.preventDefault();
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        mainContainer.classList.remove('hidden');
        initializeApp();
    } else {
        const pinModalContent = pinModalOverlay.querySelector('div');
        pinError.textContent = 'PIN salah, coba lagi.';
        pinModalContent.classList.add('shake');
        pinInput.value = '';
        pinInput.focus();
        setTimeout(() => pinModalContent.classList.remove('shake'), 500);
    }
}

function switchView(viewName) {
    if (activeView === viewName) return;
    activeView = viewName;
    hideDetailView();

    const isKinerjaView = viewName === 'kinerja';

    kinerjaView.classList.toggle('hidden', !isKinerjaView);
    skpView.classList.toggle('hidden', isKinerjaView);
    filterBar.classList.toggle('hidden', !isKinerjaView);
    addDataButton.classList.toggle('hidden', !isKinerjaView);
    pageTitle.textContent = isKinerjaView ? 'Kinerja' : 'SKP';

    navKinerja.classList.toggle('active', isKinerjaView);
    navSkp.classList.toggle('active', !isKinerjaView);

    if (isKinerjaView) {
        if (localData.length > 0) applyAndRenderFilters();
    } else {
        if (skpData.length > 0) renderSkpData(skpData);
        else if (isDataLoading.skp) {
            skpTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Memuat data SKP...</td></tr>`;
        }
    }
    if (window.innerWidth < 768) {
        closeMobileSidebar();
    }
}

async function fetchData(view, isBackground = false) {
    isDataLoading[view] = true;
    if (!isBackground) {
        showLoading();
    }

    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?page=${view}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (view === 'kinerja') {
            localData = data.sort((a, b) => {
                const dateA = new Date(a.Tanggal.split('/').reverse().join('-'));
                const dateB = new Date(b.Tanggal.split('/').reverse().join('-'));
                return dateB - dateA;
            });
            if (!isBackground && activeView === 'kinerja') {
                populateFilters();
                applyAndRenderFilters();
            }
        } else if (view === 'skp') {
            skpData = data;
            if (!isBackground && activeView === 'skp') {
                renderSkpData(skpData);
            }
        }
    } catch (error) {
        if (!isBackground) showError(error.message);
        else console.error(`Gagal memuat data ${view} di latar belakang:`, error);
    } finally {
        isDataLoading[view] = false;
        if (!isBackground) {
            hideLoading();
        }
    }
}

function toggleSidebar() {
    if (window.innerWidth < 768) {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
    } else {
        body.classList.toggle('sidebar-collapsed');
    }
}

function closeMobileSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

// --- FUNGSI DETAIL VIEW ---

function showDetailView(id) {
    let itemData;
    if (activeView === 'kinerja') {
        itemData = localData.find(item => item && item['ID Kinerja'] === id);
    } else if (activeView === 'skp') {
        itemData = skpData.find(item => item && (item['Tahun'] + item['Atasan']) === id);
    }
    if (!itemData) return;

    activeDetailId = id;
    if (activeView === 'kinerja') {
        renderDetail(itemData);
    } else if (activeView === 'skp') {
        renderSkpDetail(itemData);
    }

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

function handleBodyClick(e) {
    const target = e.target;
    const itemElement = target.closest('[data-id]');
    if (!itemElement) return;
    const id = itemElement.getAttribute('data-id');

    if (activeView === 'kinerja') {
        if (target.closest('.edit-btn')) openEditForm(id);
        else if (target.closest('.delete-btn')) openDeleteModal(id);
        else if (target.closest('.pin-btn')) togglePin(id);
        else if (target.closest('.data-cell')) showDetailView(id);
    } else if (activeView === 'skp') {
        showDetailView(id);
    }
}

function highlightActiveItem(id) {
    document.querySelectorAll('[data-id]').forEach(el => {
        el.classList.toggle('active-item', el.getAttribute('data-id') === id);
    });
}

// --- FUNGSI RENDER TAMPILAN KINERJA ---

function renderData(dataToRender) {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = dataToRender.slice(startIndex, endIndex);

    tableBody.innerHTML = '';
    cardContainer.innerHTML = '';
    if (paginatedData.length === 0) {
        const emptyMessage = '<p class="col-span-full text-center py-10 text-gray-500">Tidak ada data yang cocok.</p>';
        tableBody.innerHTML = `<tr><td colspan="5">${emptyMessage}</td></tr>`;
        cardContainer.innerHTML = emptyMessage;
        renderPagination(0);
        return;
    }
    paginatedData.forEach(item => {
        createTableRow(item);
        createCardView(item);
    });
    if (activeDetailId) highlightActiveItem(activeDetailId);
    lucide.createIcons();
    renderPagination(dataToRender.length);
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    let paginationHTML = `<nav class="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">`;
    paginationHTML += `<div class="-mt-px flex w-0 flex-1">`;
    if (currentPage > 1) {
        paginationHTML += `<a href="#" data-page="${currentPage - 1}" class="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
        <i data-lucide="arrow-left" class="mr-3 h-5 w-5 text-gray-400"></i>
        Sebelumnya
      </a>`;
    }
    paginationHTML += `</div>`;
    paginationHTML += `<div class="hidden md:-mt-px md:flex">`;
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<a href="#" data-page="${i}" class="${currentPage === i ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium">${i}</a>`;
    }
    paginationHTML += `</div>`;
    paginationHTML += `<div class="-mt-px flex w-0 flex-1 justify-end">`;
    if (currentPage < totalPages) {
        paginationHTML += `<a href="#" data-page="${currentPage + 1}" class="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
        Selanjutnya
        <i data-lucide="arrow-right" class="ml-3 h-5 w-5 text-gray-400"></i>
      </a>`;
    }
    paginationHTML += `</div></nav>`;

    paginationContainer.innerHTML = paginationHTML;
    lucide.createIcons();

    paginationContainer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = parseInt(e.currentTarget.dataset.page);
            applyAndRenderFilters();
        });
    });
}


function createTableRow(item) {
    const row = document.createElement('tr');
    row.className = `${colorOptions[item.Warna] || colorOptions['default']} cursor-pointer`;
    row.setAttribute('data-id', item['ID Kinerja']);
    const isPinned = item.Pin === true || item.Pin === 'TRUE';
    const pinIcon = isPinned ? `<i data-lucide="pin" class="w-5 h-5 text-indigo-600 fill-indigo-200"></i>` : `<i data-lucide="pin" class="w-5 h-5"></i>`;
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap data-cell">${getPreviewThumbnail(item.File)}</td>
        <td class="px-6 py-4 whitespace-nowrap data-cell"><div class="text-sm font-medium text-gray-900">${item.Tanggal || 'N/A'}</div></td>
        <td class="px-6 py-4 data-cell"><div class="text-sm text-gray-700 whitespace-pre-wrap max-h-20 overflow-y-auto">${item.Deskripsi || ''}</div></td>
        <td class="px-6 py-4 whitespace-nowrap data-cell">${getStatusBadge(item.Status)}</td>
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
   card.className = `rounded-xl shadow-md p-4 flex flex-col gap-3 ${colorOptions[item.Warna] || colorOptions['default']}`;
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

// --- FUNGSI RENDER TAMPILAN SKP ---

function renderSkpData(dataToRender) {
    skpTableBody.innerHTML = '';
    if (!dataToRender || dataToRender.length === 0) {
        skpTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Tidak ada data SKP.</td></tr>`;
        return;
    }
    dataToRender.forEach(item => {
        const row = document.createElement('tr');
        const uniqueId = item['Tahun'] + item['Atasan'];
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.setAttribute('data-id', uniqueId);
        const { predikatClass, nilaiClass } = getSkpColor(item.Predikat);
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.Tahun}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${item.Atasan}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 py-1 rounded-md font-semibold ${nilaiClass}">${item.Nilai}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><span class="font-semibold ${predikatClass}">${item.Predikat}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <button class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                    Lihat
                </button>
            </td>`;
        skpTableBody.appendChild(row);
    });
    lucide.createIcons();
}

function getSkpColor(predikat) {
    switch (predikat) {
        case 'Sangat Baik': return { predikatClass: 'text-emerald-700', nilaiClass: 'bg-emerald-100 text-emerald-800' };
        case 'Baik': return { predikatClass: 'text-blue-700', nilaiClass: 'bg-blue-100 text-blue-800' };
        case 'Cukup': return { predikatClass: 'text-amber-700', nilaiClass: 'bg-amber-100 text-amber-800' };
        case 'Kurang': return { predikatClass: 'text-red-700', nilaiClass: 'bg-red-100 text-red-800' };
        default: return { predikatClass: 'text-gray-700', nilaiClass: 'bg-gray-100 text-gray-800' };
    }
}


// --- FUNGSI DETAIL VIEW ---

function renderDetail(data) { // Detail untuk Kinerja
    let files = [];
    try { if (data.File && typeof data.File === 'string') files = JSON.parse(data.File); } catch (e) { console.error("Gagal parse JSON file:", e); }
    detailContent.innerHTML = `
        <button onclick="hideDetailView()" class="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"><i data-lucide="arrow-left" class="w-4 h-4"></i>Kembali</button>
        <div class="flex justify-between items-start">
            <div><label class="text-xs text-gray-500 uppercase font-semibold">ID Kinerja</label><p class="text-sm text-gray-700 font-mono break-all">${data['ID Kinerja'] || '-'}</p></div>
            <div class="text-right flex-shrink-0 ml-4"><label class="text-xs text-gray-500 uppercase font-semibold">Tanggal</label><p class="text-sm text-gray-900">${data.Tanggal || '-'}</p></div>
        </div>
        <div class="border-t pt-5 mt-5">
            <div class="flex justify-between items-center mb-2"><label class="text-xs text-gray-500 uppercase font-semibold">Deskripsi</label>${getStatusBadge(data.Status)}</div>
            <p class="text-sm text-gray-800 whitespace-pre-wrap">${data.Deskripsi || 'Tidak ada deskripsi.'}</p>
        </div>
        <div class="border-t pt-5 mt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">Lampiran</label>
            <div class="mt-2">${renderFilePreviews(files)}</div>
        </div>`;
    lucide.createIcons();
}

function renderSkpDetail(data) { // Detail untuk SKP
    const embedUrl = createEmbedUrl(data.File);
    detailContent.innerHTML = `
        <button onclick="hideDetailView()" class="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"><i data-lucide="arrow-left" class="w-4 h-4"></i>Kembali</button>
        <div>
            <div class="flex justify-between items-center mb-2">
                <label class="text-xs text-gray-500 uppercase font-semibold">Pratinjau File SKP Tahun ${data.Tahun}</label>
                <a href="${data.File}" target="_blank" rel="noopener noreferrer" class="text-xs text-indigo-600 hover:underline font-semibold">Buka di Tab Baru <i data-lucide="external-link" class="inline w-3 h-3"></i></a>
            </div>
            ${embedUrl ? `<iframe src="${embedUrl}" class="w-full h-[70vh] border rounded-lg bg-gray-100" frameborder="0"></iframe>` : 
            `<div class="w-full h-96 border rounded-lg bg-gray-50 flex flex-col items-center justify-center p-4"><i data-lucide="file-x" class="w-12 h-12 text-gray-400 mb-2"></i><p class="text-sm text-gray-500">URL file tidak valid atau tidak dapat disematkan.</p></div>`
            }
        </div>
    `;
    lucide.createIcons();
}

// --- FUNGSI HELPER & LAIN-LAIN ---

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
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Optimistic UI Update for Edit/Create
    const optimisticData = { 
        ...data,
        Tanggal: data.Tanggal.split('-').reverse().join('/'),
        File: '[]', // Placeholder, will be updated from server
        Pin: false 
    };

    if (currentlyEditingId) {
        // For Edit: find existing data to merge
        const existingItem = localData.find(item => item['ID Kinerja'] === currentlyEditingId);
        if (existingItem) {
            optimisticData.File = existingItem.File; // Keep old files until server confirms
            optimisticData.Pin = existingItem.Pin;
        }
    }
    
    updateLocalData(optimisticData);
    closeFormModal();
    
    // Add file data for server submission
    data.files = fileData; 
    data.action = currentlyEditingId ? 'update' : 'create';

    try {
        const response = await sendDataToServer(data);
        if (response.status === 'success') {
            // Sync with server authoritative response
            updateLocalData(response.savedData);
        } else {
            throw new Error(response.message || 'Gagal menyimpan data.');
        }
    } catch (error) {
        showError(error.message);
        fetchData('kinerja'); // Re-fetch all data on error to ensure consistency
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

    const itemIndex = localData.findIndex(item => item['ID Kinerja'] === id);
    if (itemIndex === -1) return;

    // 1. Back up the item in case of failure
    const deletedItem = localData[itemIndex];

    // 2. Optimistically remove from local data and update UI
    localData.splice(itemIndex, 1);
    applyAndRenderFilters();
    deleteModalOverlay.classList.add('hidden');
    if (activeDetailId === id) hideDetailView();

    // 3. Send request to server in the background
    sendDataToServer({ 'ID Kinerja': id, action: 'delete' })
        .catch(error => {
            // 4. If it fails, revert the change and show an error
            showError(`Gagal menghapus data: ${error.message}. Mengembalikan data.`);
            localData.splice(itemIndex, 0, deletedItem); // Re-insert at original position
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
    const index = localData.findIndex(item => item && item['ID Kinerja'] === savedData['ID Kinerja']);
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
            if (filesToProcess === 0) {
                console.log(`${fileData.length} files ready to upload.`);
            }
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
    const match = originalUrl ? originalUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/) : null;
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
            if (embedUrl) {
                html += `<iframe src="${embedUrl}" class="w-full h-96 border rounded-lg bg-gray-100" frameborder="0"></iframe>`;
            }
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
    errorDiv.classList.add('hidden');
    kinerjaView.classList.add('hidden');
    skpView.classList.add('hidden');
}

function hideLoading() {
    loadingDiv.style.display = 'none';
    if (activeView === 'kinerja') {
        kinerjaView.classList.remove('hidden');
    } else if (activeView === 'skp') {
        skpView.classList.remove('hidden');
    }
}

function showError(message) {
    hideLoading();
    errorDiv.classList.remove('hidden');
    errorMessageP.textContent = message;
}

function populateFilters() {
    const years = [...new Set(
        localData.filter(item => item && typeof item.Tanggal === 'string' && item.Tanggal.includes('/'))
            .map(item => item.Tanggal.split('/')[2])
    )].sort((a, b) => b - a);
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
        if (!item) return false;
        const searchMatch = !searchTerm || (item.Deskripsi && item.Deskripsi.toLowerCase().includes(searchTerm));
        const statusMatch = !status || item.Status === status;
        if (!searchMatch || !statusMatch) return false;
        const hasDate = typeof item.Tanggal === 'string' && item.Tanggal.includes('/');
        if (!month && !year) return true;
        if (hasDate) {
            const [, itemMonth, itemYear] = item.Tanggal.split('/');
            const monthMatch = !month || itemMonth === month;
            const yearMatch = !year || itemYear === year;
            return monthMatch && yearMatch;
        }
        return false;
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
    searchInput.value = ''; searchInputMobile.value = ''; statusFilter.value = '';
    monthFilter.value = ''; yearFilter.value = ''; applyAndRenderFilters();
}

function syncMobileFilters() {
    statusFilter.value = statusFilterMobile.value; monthFilter.value = monthFilterMobile.value;
    yearFilter.value = yearFilterMobile.value;
}

function syncDesktopFilters() {
    statusFilterMobile.value = statusFilter.value; monthFilterMobile.value = monthFilter.value;
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
    const ringColorValues = { blue: '#93c5fd', green: '#86efac', yellow: '#fde047', red: '#fca5a5', purple: '#c4b5fd', default: '#9ca3af' };
    colorContainer.querySelectorAll('.color-swatch').forEach(btn => {
        const btnColor = btn.dataset.color;
        const isSelected = btnColor === activeColor;
        btn.classList.toggle('selected', isSelected);
        if (isSelected) btn.style.setProperty('--ring-color', ringColorValues[btnColor]);
    });
}

function togglePin(id) {
    const itemIndex = localData.findIndex(d => d && d['ID Kinerja'] === id);
    if (itemIndex === -1) return;

    const item = localData[itemIndex];
    const originalPinStatus = item.Pin;
    const newPinStatus = !(originalPinStatus === true || originalPinStatus === 'TRUE');

    // 1. Optimistically update local data and UI
    localData[itemIndex].Pin = newPinStatus;
    applyAndRenderFilters();

    // 2. Send request to server
    const dataToUpdate = { ...item, Pin: newPinStatus, action: 'update', files: [] };
    sendDataToServer(dataToUpdate)
        .catch(error => {
            // 3. If it fails, revert the change and show an error
            showError(`Gagal menyematkan: ${error.message}. Mengembalikan.`);
            localData[itemIndex].Pin = originalPinStatus;
            applyAndRenderFilters();
        });
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
    resetFilterButtonMobile.addEventListener('click', resetFilters);
    reloadDataButton.addEventListener('click', () => fetchData(activeView));
    
    // Navigasi & Sidebar
    navKinerja.addEventListener('click', (e) => { e.preventDefault(); switchView('kinerja'); });
    navSkp.addEventListener('click', (e) => { e.preventDefault(); switchView('skp'); });
    hamburgerButton.addEventListener('click', toggleSidebar);
    closeSidebarButton.addEventListener('click', closeMobileSidebar);
    sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Filter Listeners
    [searchInput, statusFilter, monthFilter, yearFilter].forEach(el => el.addEventListener('input', applyAndRenderFilters));
    searchInputMobile.addEventListener('input', applyAndRenderFilters);
    mobileFilterButton.addEventListener('click', () => { syncDesktopFilters(); mobileFilterModal.classList.remove('hidden'); });
    closeMobileFilterButton.addEventListener('click', () => mobileFilterModal.classList.add('hidden'));
    applyMobileFilterButton.addEventListener('click', () => { syncMobileFilters(); applyAndRenderFilters(); mobileFilterModal.classList.add('hidden'); });
    
    // Daftarkan Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker berhasil didaftarkan:', registration);
                })
                .catch(registrationError => {
                    console.log('Pendaftaran Service Worker gagal:', registrationError);
                });
        });
    }
});

