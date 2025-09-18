// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbycKVGuxIikYEVfFiV-3f7GAjrxsB-FJMTYOO0lam5qmgcjkiWtGo8k5seyOMMwPgy3gg/exec';
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
const ITEMS_PER_PAGE = 50;
const INITIAL_LOAD_COUNT = 50;

// Palet Warna Pastel
const colorOptions = {
    'default': 'bg-white hover:bg-gray-50', 'blue': 'bg-blue-50 hover:bg-blue-100', 'green': 'bg-green-50 hover:bg-green-100',
    'yellow': 'bg-yellow-50 hover:bg-yellow-100', 'red': 'bg-red-50 hover:bg-red-100', 'purple': 'bg-purple-50 hover:bg-purple-100',
};
const colorClasses = {
    'blue': 'bg-blue-300', 'green': 'bg-green-300', 'yellow': 'bg-yellow-300', 'red': 'bg-red-300', 'purple': 'bg-purple-300',
};

// --- Elemen DOM (Deklarasi Awal) ---
let body, pinModalOverlay, pinForm, pinInput, pinError, mainContainer, addDataButton, loadingDiv, errorDiv, errorMessageP, listView, detailView, detailContent, pageTitle, sidebar, sidebarOverlay, hamburgerButton, closeSidebarButton, navKinerja, navSkp, kinerjaView, tableBody, cardContainer, skpView, skpTableBody, skpCardContainer, filterBar, paginationContainer, formModalOverlay, closeFormModalButton, form, submitButton, idKinerjaInput, tanggalInput, deskripsiInput, statusContainer, statusInput, fileInput, fileNameSpan, fileLamaP, deleteModalOverlay, cancelDeleteButton, confirmDeleteButton, searchInput, statusFilter, monthFilter, yearFilter, resetFilterButton, reloadDataButton, mobileFilterButton, mobileFilterModal, closeMobileFilterButton, applyMobileFilterButton, searchInputMobile, statusFilterMobile, monthFilterMobile, yearFilterMobile, colorContainer, warnaInput, resetFilterButtonMobile, toastNotification;


// --- FUNGSI UTAMA & MANAJENEN APLIKASI ---

async function initializeApp() {
    // Muat 50 data pertama secara cepat
    await fetchData('kinerja', false, INITIAL_LOAD_COUNT);
    // Muat sisa data kinerja dan data SKP di latar belakang
    fetchData('kinerja', true, 0, INITIAL_LOAD_COUNT); // Offset 50
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
    currentPage = 1;

    const isKinerjaView = viewName === 'kinerja';

    kinerjaView.classList.toggle('hidden', !isKinerjaView);
    skpView.classList.toggle('hidden', isKinerjaView);
    filterBar.classList.toggle('hidden', !isKinerjaView);
    paginationContainer.classList.toggle('hidden', !isKinerjaView);
    addDataButton.classList.toggle('hidden', !isKinerjaView);
    pageTitle.textContent = isKinerjaView ? 'Kinerja' : 'SKP';

    navKinerja.classList.toggle('active', isKinerjaView);
    navSkp.classList.toggle('active', !isKinerjaView);

    if (isKinerjaView) {
        if (localData.length > 0) applyAndRenderFilters();
        else if (isDataLoading.kinerja) showLoading();
    } else {
        if (skpData.length > 0) renderSkpData(skpData);
        else if (isDataLoading.skp) {
             showLoading(); 
        }
    }
    if (window.innerWidth < 768) {
        closeMobileSidebar();
    }
}

async function fetchData(view, isBackground = false, limit = 0, offset = 0) {
    if (view === 'kinerja') isDataLoading.kinerja = true;
    if (view === 'skp') isDataLoading.skp = true;
    
    if (!isBackground) {
        showLoading();
    }

    let url = `${GAS_WEB_APP_URL}?page=${view}`;
    if (limit > 0) url += `&limit=${limit}`;
    if (offset > 0) url += `&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (view === 'kinerja') {
            if (offset > 0) {
                // Ini adalah data sisa, gabungkan dengan yang sudah ada
                localData = [...localData, ...data];
            } else {
                // Ini adalah pemuatan awal atau pemuatan penuh
                localData = data;
            }
             if (activeView === 'kinerja') {
                populateFilters();
                applyAndRenderFilters();
            }
        } else if (view === 'skp') {
            skpData = data;
            if (activeView === 'skp') {
                renderSkpData(skpData);
            }
        }
    } catch (error) {
        if (!isBackground) showError(error.message);
        else console.error(`Gagal memuat data ${view} di latar belakang:`, error);
    } finally {
        if (view === 'kinerja') isDataLoading.kinerja = false;
        if (view === 'skp') isDataLoading.skp = false;
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
        if (target.closest('.copy-btn')) copyDescription(id);
        else if (target.closest('.edit-btn')) openEditForm(id);
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
    if (paginatedData.length === 0 && currentPage === 1) {
        const emptyMessage = '<p class="col-span-full text-center py-10 text-gray-500">Tidak ada data yang cocok.</p>';
        tableBody.innerHTML = `<tr><td colspan="5">${emptyMessage}</td></tr>`;
        cardContainer.innerHTML = emptyMessage;
    } else {
        paginatedData.forEach(item => {
            createTableRow(item);
            createCardView(item);
        });
    }

    if (activeDetailId) highlightActiveItem(activeDetailId);
    lucide.createIcons();
    renderPagination(dataToRender.length);
}

function renderPagination(totalItems) {
    if (!paginationContainer) return; 
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
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `<a href="#" data-page="1" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium">1</a>`;
        if (startPage > 2) paginationHTML += `<span class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<a href="#" data-page="${i}" class="${currentPage === i ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium">${i}</a>`;
    }

     if (endPage < totalPages) {
        if (endPage < totalPages -1) paginationHTML += `<span class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">...</span>`;
        paginationHTML += `<a href="#" data-page="${totalPages}" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium">${totalPages}</a>`;
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

    paginationContainer.querySelectorAll('a[data-page]').forEach(a => {
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
                <button class="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition copy-btn" title="Salin Deskripsi"><i data-lucide="copy" class="w-5 h-5"></i></button>
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
                 <button class="p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800 transition copy-btn" title="Salin Deskripsi"><i data-lucide="copy" class="w-5 h-5"></i></button>
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
    skpCardContainer.innerHTML = '';
    if (!dataToRender || dataToRender.length === 0) {
        const emptyMessage = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Tidak ada data SKP.</td></tr>`;
        skpTableBody.innerHTML = emptyMessage;
        skpCardContainer.innerHTML = `<p class="text-center py-10 text-gray-500">Tidak ada data SKP.</p>`;
        return;
    }
    dataToRender.forEach(item => {
        createSkpTableRow(item);
        createSkpCard(item);
    });
    lucide.createIcons();
}

function createSkpTableRow(item){
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
}

function createSkpCard(item) {
    const card = document.createElement('div');
    const uniqueId = item['Tahun'] + item['Atasan'];
    card.className = `rounded-xl shadow-md p-4 flex flex-col gap-3 bg-white cursor-pointer`;
    card.setAttribute('data-id', uniqueId);
    const { predikatClass, nilaiClass } = getSkpColor(item.Predikat);
    card.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <p class="text-sm font-semibold text-gray-800">${item.Atasan}</p>
                <p class="text-xs text-gray-500">Tahun ${item.Tahun}</p>
            </div>
            <span class="font-semibold text-sm ${predikatClass}">${item.Predikat}</span>
        </div>
        <div class="border-t pt-3 flex justify-between items-center">
             <span class="text-sm">Nilai: <span class="px-2 py-1 rounded-md font-bold ${nilaiClass}">${item.Nilai}</span></span>
             <button class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors">
                <i data-lucide="eye" class="w-4 h-4"></i>
                Lihat File
            </button>
        </div>`;
    skpCardContainer.appendChild(card);
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
    
    const optimisticData = { 
        ...data,
        Tanggal: data.Tanggal.split('-').reverse().join('/'),
        File: '[]', 
        Pin: false 
    };

    if (currentlyEditingId) {
        const existingItem = localData.find(item => item['ID Kinerja'] === currentlyEditingId);
        if (existingItem) {
            optimisticData.File = existingItem.File;
            optimisticData.Pin = existingItem.Pin;
        }
    }
    
    updateLocalData(optimisticData);
    closeFormModal();
    
    data.files = fileData; 
    data.action = currentlyEditingId ? 'update' : 'create';

    try {
        const response = await sendDataToServer(data);
        if (response.status === 'success') {
            updateLocalData(response.savedData);
        } else {
            throw new Error(response.message || 'Gagal menyimpan data.');
        }
    } catch (error) {
        showError(error.message);
        fetchData('kinerja');
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
    const deletedItem = localData[itemIndex];

    localData.splice(itemIndex, 1);
    applyAndRenderFilters();
    deleteModalOverlay.classList.add('hidden');
    if (activeDetailId === id) hideDetailView();

    sendDataToServer({ 'ID Kinerja': id, action: 'delete' })
        .catch(error => {
            showError(`Gagal menghapus data: ${error.message}. Mengembalikan data.`);
            localData.splice(itemIndex, 0, deletedItem);
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

function copyDescription(id) {
    const item = localData.find(d => d['ID Kinerja'] === id);
    if (!item || !item.Deskripsi) return;

    const textarea = document.createElement('textarea');
    textarea.value = item.Deskripsi;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    showToast("Deskripsi disalin!");
}

function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 2000);
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
    const searchTerm = (searchInput.value || searchInputMobile.value || "").toLowerCase();
    const status = statusFilter.value;
    const month = monthFilter.value;
    const year = yearFilter.value;
    
    let filteredData = localData.filter(item => {
        if (!item) return false;
        
        const searchMatch = !searchTerm || (item.Deskripsi && typeof item.Deskripsi === 'string' && item.Deskripsi.toLowerCase().includes(searchTerm));
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
        
        const dateA = a.Tanggal ? new Date(a.Tanggal.split('/').reverse().join('-')) : new Date(0);
        const dateB = b.Tanggal ? new Date(b.Tanggal.split('/').reverse().join('-')) : new Date(0);
        return dateB - dateA;
    });
    renderData(filteredData);
}

function resetFilters() {
    searchInput.value = ''; searchInputMobile.value = ''; statusFilter.value = '';
    monthFilter.value = ''; yearFilter.value = ''; 
    currentPage = 1;
    applyAndRenderFilters();
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

    localData[itemIndex].Pin = newPinStatus;
    applyAndRenderFilters();

    const dataToUpdate = { ...item, Pin: newPinStatus, action: 'update', files: [] };
    sendDataToServer(dataToUpdate)
        .catch(error => {
            showError(`Gagal menyematkan: ${error.message}. Mengembalikan.`);
            localData[itemIndex].Pin = originalPinStatus;
            applyAndRenderFilters();
        });
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi semua elemen DOM di sini setelah dokumen siap
    body = document.body;
    pinModalOverlay = document.getElementById('pin-modal-overlay');
    pinForm = document.getElementById('pin-form');
    pinInput = document.getElementById('pin-input');
    pinError = document.getElementById('pin-error');
    mainContainer = document.getElementById('main-container');
    addDataButton = document.getElementById('add-data-button');
    loadingDiv = document.getElementById('loading');
    errorDiv = document.getElementById('error');
    errorMessageP = document.getElementById('error-message');
    listView = document.getElementById('list-view');
    detailView = document.getElementById('detail-view');
    detailContent = document.getElementById('detail-content');
    pageTitle = document.getElementById('page-title');
    sidebar = document.getElementById('sidebar');
    sidebarOverlay = document.getElementById('sidebar-overlay');
    hamburgerButton = document.getElementById('hamburger-button');
    closeSidebarButton = document.getElementById('close-sidebar-button');
    navKinerja = document.getElementById('nav-kinerja');
    navSkp = document.getElementById('nav-skp');
    kinerjaView = document.getElementById('kinerja-view');
    tableBody = document.getElementById('kinerja-table-body');
    cardContainer = document.getElementById('kinerja-card-container');
    skpView = document.getElementById('skp-view');
    skpTableBody = document.getElementById('skp-table-body');
    skpCardContainer = document.getElementById('skp-card-container');
    filterBar = document.getElementById('filter-bar');
    paginationContainer = document.getElementById('pagination-container');
    formModalOverlay = document.getElementById('form-modal-overlay');
    closeFormModalButton = document.getElementById('close-form-modal');
    form = document.getElementById('kinerja-form');
    submitButton = document.getElementById('submit-button');
    idKinerjaInput = document.getElementById('id-kinerja');
    tanggalInput = document.getElementById('tanggal');
    deskripsiInput = document.getElementById('deskripsi');
    statusContainer = document.getElementById('status-container');
    statusInput = document.getElementById('status-input');
    fileInput = document.getElementById('file-input');
    fileNameSpan = document.getElementById('file-name');
    fileLamaP = document.getElementById('file-lama');
    deleteModalOverlay = document.getElementById('delete-modal-overlay');
    cancelDeleteButton = document.getElementById('cancel-delete-button');
    confirmDeleteButton = document.getElementById('confirm-delete-button');
    searchInput = document.getElementById('search-input');
    statusFilter = document.getElementById('status-filter');
    monthFilter = document.getElementById('month-filter');
    yearFilter = document.getElementById('year-filter');
    resetFilterButton = document.getElementById('reset-filter-button');
    reloadDataButton = document.getElementById('reload-data-button');
    mobileFilterButton = document.getElementById('mobile-filter-button');
    mobileFilterModal = document.getElementById('mobile-filter-modal');
    closeMobileFilterButton = document.getElementById('close-mobile-filter-button');
    applyMobileFilterButton = document.getElementById('apply-mobile-filter-button');
    searchInputMobile = document.getElementById('search-input-mobile');
    statusFilterMobile = document.getElementById('status-filter-mobile');
    monthFilterMobile = document.getElementById('month-filter-mobile');
    yearFilterMobile = document.getElementById('year-filter-mobile');
    colorContainer = document.getElementById('color-container');
    warnaInput = document.getElementById('warna-input');
    resetFilterButtonMobile = document.getElementById('reset-filter-button-mobile');
    toastNotification = document.getElementById('toast-notification');

    // Lanjutkan dengan sisa inisialisasi
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
    [searchInput, statusFilter, monthFilter, yearFilter].forEach(el => el.addEventListener('input', () => { currentPage = 1; applyAndRenderFilters(); }));
    searchInputMobile.addEventListener('input', () => { currentPage = 1; applyAndRenderFilters(); });
    mobileFilterButton.addEventListener('click', () => { syncDesktopFilters(); mobileFilterModal.classList.remove('hidden'); });
    closeMobileFilterButton.addEventListener('click', () => mobileFilterModal.classList.add('hidden'));
    applyMobileFilterButton.addEventListener('click', () => { currentPage = 1; syncMobileFilters(); applyAndRenderFilters(); mobileFilterModal.classList.add('hidden'); });
    
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

