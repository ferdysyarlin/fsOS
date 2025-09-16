// !!! PENTING: Ganti dengan URL Web App Anda dari Google Apps Script !!!
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxQYwRMdHN3oB9Hoq0UOBvSbDTDXhXGopAzYTYsc1sr7ThIwQe43Q1Rv8-8QpX4gAtf/exec';

// Variabel untuk Caching Data
let kinerjaCache = null; 
let labelCache = null;   
// PERUBAHAN BARU: Variabel untuk menyimpan file yang diunggah sementara
let tempUploadedFiles = {};

const softColors = {
  'default': { bg: 'bg-white', border: 'border-slate-200' },
  'yellow':  { bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'blue':    { bg: 'bg-blue-50', border: 'border-blue-200' },
  'green':   { bg: 'bg-green-50', border: 'border-green-200' },
  'purple':  { bg: 'bg-purple-50', border: 'border-purple-200' },
  'pink':    { bg: 'bg-pink-50', border: 'border-pink-200' }
};
const colorPickerPalette = [
    { name: 'default', hex: '#FFFFFF', border: '#E2E8F0' },
    { name: 'yellow', hex: '#FEF9C3', border: '#FDE68A' },
    { name: 'blue', hex: '#DBEAFE', border: '#BFDBFE' },
    { name: 'green', hex: '#D1FAE5', border: '#A7F3D0' },
    { name: 'purple', hex: '#EDE9FE', border: '#DDD6FE' },
    { name: 'pink', hex: '#FCE7F3', border: '#FBCFE8' }
];

const api = {
    async get(action, params = {}) {
        const url = new URL(GAS_URL);
        url.searchParams.append('action', action);
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        return response.json();
    },
    async post(action, payload) {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, payload })
        });
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        return response.json();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', (e) => handleNavigation(e, link)));
    document.getElementById('add-data-btn').addEventListener('click', handleCreateNewEntry);
    setupSidebar();
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.color-picker-popup') && !e.target.closest('.color-picker-toggle')) {
            const openPicker = document.querySelector('.color-picker-popup');
            if (openPicker) openPicker.remove();
        }
    });
});

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    const navTexts = document.querySelectorAll('.nav-text');
    const mainNav = document.getElementById('main-nav');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    if (sidebarToggle) sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('w-64');
        sidebar.classList.toggle('w-20');
        mainNav.classList.toggle('p-4');
        mainNav.classList.toggle('p-2');
        toggleIcon.classList.toggle('fa-chevron-left');
        toggleIcon.classList.toggle('fa-chevron-right');
        navTexts.forEach(text => text.classList.toggle('hidden'));
    });
     if (mobileMenuButton) mobileMenuButton.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        sidebarBackdrop.classList.remove('hidden');
       });
     if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarBackdrop.classList.add('hidden');
       });
}

function handleNavigation(event, clickedLink) {
    event.preventDefault();
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    clickedLink.classList.add('active');
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebar-backdrop').classList.add('hidden');
    }
    switch (clickedLink.id) {
        case 'nav-dashboard': loadDashboard(); break;
        case 'nav-kinerja': loadKinerjaData(); break;
    }
}

function loadDashboard() {
    document.getElementById('add-button-container').style.display = 'none';
    document.getElementById('main-content').innerHTML = `
        <div class="bg-white shadow-lg rounded-xl p-6">
          <h2 class="text-2xl font-bold text-slate-800">Selamat Datang di fsOS</h2>
          <p class="mt-2 text-slate-600">Pilih menu 'Kinerja' dari sidebar untuk melihat dan mengelola data.</p>
        </div>`;
}

async function loadLabelsInBackground() {
    if (labelCache !== null) return; 
    try {
        const response = await api.get('getLabels');
        if (response.status === 'success') {
            labelCache = response.data;
            console.log("Labels loaded and cached successfully.");
        }
    } catch (error) {
        console.error("Failed to load labels in background:", error);
    }
}

async function loadKinerjaData() {
    document.getElementById('add-button-container').style.display = 'block';

    if (kinerjaCache !== null) {
        displayCards(kinerjaCache);
    } else {
        console.log("Cache kosong. Menampilkan loading dan mengambil data awal.");
        showLoading('Memuat data kinerja...');
    }

    try {
        const response = await api.get('getSheetData');
        if (response.status === 'success') {
            const newDataString = JSON.stringify(response.data);
            const oldDataString = JSON.stringify(kinerjaCache);

            if (newDataString !== oldDataString) {
                console.log("Data di server berubah. Memperbarui cache dan tampilan.");
                kinerjaCache = response.data;
                displayCards(kinerjaCache);
                if (labelCache === null) {
                    loadLabelsInBackground();
                }
            } else {
                console.log("Tidak ada perubahan data dari server.");
            }
        } else {
            if (kinerjaCache === null) {
                showError(response.message);
            }
        }
    } catch (error) {
        console.error("Gagal mengambil data di latar belakang:", error);
        if (kinerjaCache === null) {
            showError(error);
        }
    }
}


function showLoading(message) {
    document.getElementById('main-content').innerHTML = `<div class="w-full text-center p-10"><i class="fas fa-spinner fa-spin fa-3x text-indigo-500"></i><p class="mt-4 text-gray-600">${message}</p></div>`;
}

function showError(error) {
    const errorMessage = typeof error === 'object' ? error.message : JSON.stringify(error);
    document.getElementById('main-content').innerHTML = `<div class="p-4 text-red-600 bg-red-100 rounded-lg"><strong>Error:</strong> ${errorMessage}</div>`;
}

function displayCards(dataRows) {
    const mainContent = document.getElementById('main-content');
    if (!dataRows || dataRows.length === 0) {
        mainContent.innerHTML = `<div class="bg-white p-6 rounded-lg shadow-sm"><p>Tidak ada data. Klik tombol '+' untuk menambah data baru.</p></div>`;
        return;
    }
    
    let contentHtml = `<div class="masonry-container">`;
    const sortedData = [...dataRows].sort((a, b) => {
        const pinA = a.Pin == 1;
        const pinB = b.Pin == 1;
        if (pinA !== pinB) return pinA ? -1 : 1;
        return b['ID Kinerja'] - a['ID Kinerja'];
    });

    sortedData.forEach((row) => {
        const idKinerja = row['ID Kinerja'];
        const colorClasses = softColors[row.Warna] || softColors['default'];
        const isPinned = row.Pin == 1;
        const sanitizedDeskripsi = JSON.stringify(row.Deskripsi);

        const pinButton = isPinned
            ? `<button onclick="event.stopPropagation(); togglePinStatus('${idKinerja}', ${isPinned})" title="Lepas Sematan" class="w-7 h-7 flex items-center justify-center text-indigo-600 hover:text-slate-500"><i class="fas fa-thumbtack"></i></button>`
            : `<button onclick="event.stopPropagation(); togglePinStatus('${idKinerja}', ${isPinned})" title="Sematkan" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-indigo-600"><i class="fas fa-thumbtack"></i></button>`;

        contentHtml += `
        <div id="card-${idKinerja}" 
             class="masonry-item group relative ${colorClasses.bg} border ${colorClasses.border} rounded-xl shadow-sm hover:shadow-lg transition-shadow p-4 flex flex-col cursor-pointer" 
             onclick="showEditModal('${idKinerja}')">
            <div class="absolute top-2 right-2 flex items-center space-x-1 bg-white/70 backdrop-blur-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button onclick='event.stopPropagation(); copyDescription(${sanitizedDeskripsi}, this.querySelector("i"))' title="Salin Deskripsi" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-indigo-600"><i class="fas fa-copy"></i></button>
                <button onclick="event.stopPropagation(); showColorPicker(event, '${idKinerja}')" title="Ubah Warna" class="color-picker-toggle w-7 h-7 flex items-center justify-center text-slate-500 hover:text-indigo-600"><i class="fas fa-palette"></i></button>
                ${pinButton}
                <button onclick="event.stopPropagation(); showDeleteConfirmation('${idKinerja}')" title="Hapus" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-600"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="flex items-center mb-2">
                ${isPinned ? `<div title="Disematkan" class="text-indigo-600 mr-2"><i class="fas fa-thumbtack fa-sm"></i></div>` : ''}
                <p class="text-xs text-slate-500">${row.Tanggal || ''}</p>
            </div>
            ${row.Foto ? `<a href="${row.Foto}" target="_blank" class="block my-3"><img src="https://drive.google.com/thumbnail?id=${extractIdFromUrl(row.Foto)}&sz=w500" alt="Foto Kinerja" class="rounded-md w-full object-cover"></a>` : ''}
            <p class="text-slate-800 text-sm whitespace-pre-wrap">${row.Deskripsi || '<i>Tanpa Deskripsi</i>'}</p>
        </div>`;
    });
    contentHtml += '</div>';
    mainContent.innerHTML = contentHtml;
}

function copyDescription(text, iconElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalIconClass = iconElement.className;
        iconElement.className = 'fas fa-check text-green-500';
        setTimeout(() => { iconElement.className = originalIconClass; }, 1500);
    });
}

function showColorPicker(event, idKinerja) {
    event.stopPropagation();
    let existingPicker = document.querySelector('.color-picker-popup');
    if (existingPicker) existingPicker.remove();
    
    const picker = document.createElement('div');
    picker.className = 'color-picker-popup absolute z-20 bg-white rounded-lg shadow-lg p-2 flex gap-2';
    picker.innerHTML = colorPickerPalette.map(color => 
        `<div class="color-swatch" style="background-color:${color.hex};border:2px solid ${color.border};" onclick="updateCardColor('${idKinerja}', '${color.name}')"></div>`
    ).join('');
    
    document.body.appendChild(picker);
    const rect = event.currentTarget.getBoundingClientRect();
    picker.style.top = `${rect.bottom + window.scrollY + 5}px`;
    picker.style.left = `${rect.left + window.scrollX - (picker.offsetWidth / 2)}px`;
}

async function updateCardColor(idKinerja, colorName) {
    document.querySelector('.color-picker-popup')?.remove();
    const cardElement = document.getElementById(`card-${idKinerja}`);
    if (!cardElement) return;

    Object.keys(softColors).forEach(key => {
        cardElement.classList.remove(softColors[key].bg, softColors[key].border);
    });
    const newColorClasses = softColors[colorName] || softColors['default'];
    cardElement.classList.add(newColorClasses.bg, newColorClasses.border);
    
    const itemInCache = kinerjaCache.find(item => item['ID Kinerja'] === idKinerja);
    if (itemInCache) itemInCache.Warna = colorName;

    try {
        await api.post('updateWarna', { idKinerja, colorName });
    } catch(e) {
        showError(e);
        loadKinerjaData(true); 
    }
}

async function togglePinStatus(idKinerja, isPinned) {
    const newStatus = isPinned ? 0 : 1;
    
    const itemInCache = kinerjaCache.find(item => item['ID Kinerja'] == idKinerja);
    if (itemInCache) itemInCache.Pin = newStatus;
    displayCards(kinerjaCache);

    try {
        await api.post('updatePinStatus', { idKinerja, newStatus });
    } catch (e) {
        showError(e);
        if (itemInCache) itemInCache.Pin = isPinned ? 1 : 0;
        displayCards(kinerjaCache);
    }
}

function renderAttachment(type, url, idKinerja) {
    const container = document.getElementById(`${type}-attachment-container`);
    if (!container) return;
    const columnName = type === 'photo' ? 'Foto' : 'File';
    const acceptType = type === 'photo' ? 'image/*' : '*/*';
    
    let content = '';
    if (url) {
        content = `<div class="flex items-center justify-between p-2 bg-slate-100 rounded-md">
            <a href="${url}" target="_blank" class="flex items-center gap-2 text-sm text-indigo-600 hover:underline truncate">
                <i class="fas ${type === 'photo' ? 'fa-image' : 'fa-paperclip'}"></i>
                <span class="truncate">Lihat ${type === 'photo' ? 'Gambar' : 'File'}</span>
            </a>
        </div>`;
    } else {
        content = `<button type="button" onclick="document.getElementById('upload-${type}-input').click()" class="w-full text-left p-2 text-sm text-slate-500 hover:bg-slate-100 rounded-md">
            <i class="fas ${type === 'photo' ? 'fa-camera' : 'fa-upload'} mr-2"></i>Unggah ${type === 'photo' ? 'Gambar' : 'File'}
        </button>
        <input type="file" id="upload-${type}-input" accept="${acceptType}" class="hidden" onchange="handleFileUpload(this, '${idKinerja}', '${columnName}')">`;
    }
    container.innerHTML = content;
}

function renderSelectedLabels(kategoriString) {
    const container = document.getElementById('selected-labels-container');
    if (!container) return;
    container.innerHTML = '';
    if (kategoriString && kategoriString.trim() !== '') {
        const labels = kategoriString.split(',').map(l => l.trim());
        labels.forEach(label => {
            if(label) {
                container.innerHTML += `<span class="bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">${label}</span>`;
            }
        });
    }
}

// PERUBAHAN BARU: Fungsi ini menangani pembuatan entri baru
function handleCreateNewEntry() {
    tempUploadedFiles = {}; // Reset file sementara setiap kali item baru dibuat
    const today = new Date();
    const day = ('0' + today.getDate()).slice(-2);
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const year = today.getFullYear();

    const newEntry = {
      'ID Kinerja': null, // ID akan di-generate oleh server
      'Tanggal': `${day}/${month}/${year}`,
      'Deskripsi': '',
      'Label': '',
      'Pin': 0,
      'Warna': 'default',
      'Foto': '',
      'File': ''
    };
    showEditModal(null, newEntry);
}


async function showEditModal(idKinerja, newEntryData = null) {
    const isNew = idKinerja === null;
    let dataToEdit;

    if (isNew) {
        dataToEdit = newEntryData;
    } else {
        dataToEdit = kinerjaCache.find(item => item['ID Kinerja'] == idKinerja);
    }
    
    if (!dataToEdit) {
        showError("Data tidak ditemukan.");
        return;
    }
    
    document.getElementById('edit-data-modal')?.remove();
    const colorSwatchesHtml = colorPickerPalette.map(color => `<div class="color-swatch" data-color="${color.name}" style="background-color: ${color.hex}; border: 2px solid ${color.border};"></div>`).join('');
    const modalHtml = `
      <div id="edit-data-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div id="modal-content-area" class="flex-1 p-6 overflow-y-auto">
                <textarea id="form-deskripsi" required class="w-full h-48 resize-none focus:outline-none text-slate-800 placeholder-slate-400 text-lg mb-4" placeholder="Tulis sesuatu...">${dataToEdit.Deskripsi || ''}</textarea>
                <input type="hidden" id="form-label" value="${dataToEdit.Label || ''}">
                <div id="selected-labels-container" class="flex flex-wrap gap-2 mb-4"></div>
                <div class="space-y-3">
                    <div id="photo-attachment-container"></div>
                    <div id="file-attachment-container"></div>
                </div>
            </div>
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-xl">
                <div class="flex items-center gap-4">
                    <button type="button" id="edit-open-label-modal-btn" title="Pilih Label" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 rounded-full transition-colors"><i class="fas fa-tag"></i></button>
                    <input type="date" id="form-tanggal" required class="text-sm text-slate-600 bg-transparent border-b-2 border-transparent focus:border-indigo-500 focus:outline-none">
                    <div class="flex items-center gap-2" id="edit-color-picker">${colorSwatchesHtml}<input type="hidden" id="form-warna"></div>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" id="modal-cancel-btn" class="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300">Batal</button>
                    <button type="button" id="modal-save-btn" class="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-md hover:bg-slate-900">${isNew ? 'Tambah' : 'Simpan'}</button>
                </div>
            </div>
          </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const [day, month, year] = dataToEdit.Tanggal.split('/');
    document.getElementById('form-tanggal').value = `${year}-${month}-${day}`;
    document.getElementById('form-warna').value = dataToEdit.Warna || 'default';

    renderAttachment('photo', dataToEdit.Foto, idKinerja);
    renderAttachment('file', dataToEdit.File, idKinerja);
    renderSelectedLabels(dataToEdit.Label);

    document.querySelectorAll('#edit-color-picker .color-swatch').forEach(swatch => {
        swatch.style.outline = (swatch.dataset.color === (dataToEdit.Warna || 'default')) ? '2px solid #0f172a' : 'none';
    });
    
    const handleSaveFromModal = async () => {
        const btn = document.getElementById('modal-save-btn');
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

        const tanggalValue = document.getElementById('form-tanggal').value;
        const [year, month, day] = tanggalValue.split('-');
        
        let dataObject = {
            'ID Kinerja': idKinerja, // Bisa null jika baru
            'Tanggal': `${day}/${month}/${year}`,
            'Deskripsi': document.getElementById('form-deskripsi').value,
            'Label': document.getElementById('form-label').value,
            'Warna': document.getElementById('form-warna').value,
            'tempFiles': tempUploadedFiles, // Kirim file yang sudah diunggah sementara
        };

        try {
            const action = isNew ? 'addNewRow' : 'updateRowData';
            const response = await api.post(action, dataObject);
            if (response.status !== 'success') throw new Error(response.message);
            
            document.getElementById('edit-data-modal').remove();
            loadKinerjaData(true); // Paksa muat ulang untuk mendapatkan data terbaru
        } catch (error) {
            showError(error);
            btn.disabled = false;
            btn.textContent = isNew ? 'Tambah' : 'Simpan';
        }
    };

    document.getElementById('modal-cancel-btn').onclick = () => {
        document.getElementById('edit-data-modal').remove();
    };
    document.getElementById('modal-save-btn').onclick = handleSaveFromModal;
    document.getElementById('edit-open-label-modal-btn').onclick = () => showLabelModal();
    document.getElementById('edit-color-picker').onclick = (e) => {
        if (e.target.classList.contains('color-swatch')) {
            document.querySelectorAll('#edit-color-picker .color-swatch').forEach(el => el.style.outline = 'none');
            e.target.style.outline = '2px solid #0f172a';
            document.getElementById('form-warna').value = e.target.dataset.color;
        }
    };
}

function showDeleteConfirmation(idKinerja) {
    document.getElementById('delete-modal')?.remove();
    const modalHtml = `<div id="delete-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-scale-in"><h3 class="text-lg font-bold text-slate-800">Konfirmasi Hapus</h3><p class="text-sm text-slate-600 mt-2">Yakin ingin menghapus data ini?</p><div class="mt-6 flex justify-end space-x-3"><button id="cancel-delete-btn" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Batal</button><button id="confirm-delete-btn" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Ya, Hapus</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('cancel-delete-btn').onclick = () => document.getElementById('delete-modal').remove();
    document.getElementById('confirm-delete-btn').onclick = async () => {
        const originalCache = [...kinerjaCache]; 
        kinerjaCache = kinerjaCache.filter(item => item['ID Kinerja'] != idKinerja);
        displayCards(kinerjaCache);
        document.getElementById('delete-modal').remove();

        try {
            await api.post('deleteRow', { idKinerja });
        } catch(error) { 
            showError(error); 
            kinerjaCache = originalCache;
            displayCards(kinerjaCache);
        }
    };
}


function handleFileUpload(inputElement, idKinerja, columnName) {
    const file = inputElement.files[0];
    if (!file) return;

    const container = document.getElementById(columnName === 'Foto' ? 'photo-attachment-container' : 'file-attachment-container');
    container.innerHTML = `<div class="flex items-center text-sm p-2"><i class="fas fa-spinner fa-spin text-indigo-500"></i><span class="ml-2 text-slate-500">Mengunggah...</span></div>`;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileObject = { fileName: file.name, mimeType: file.type, bytes: e.target.result.split(',')[1] };
        try {
            // PERUBAHAN: Jika item baru (idKinerja null), panggil aksi yang berbeda
            const isNew = idKinerja === null;
            const action = isNew ? 'uploadTempFile' : 'uploadFile';
            const payload = isNew 
                ? { fileObject } 
                : { fileObject, idKinerja, columnName, sheetName: 'Kinerja' };
            
            const response = await api.post(action, payload);
            if (response.error || response.status === 'error') throw new Error(response.message || response.error);

            if (isNew) {
                // Simpan ID file sementara
                tempUploadedFiles[columnName] = response.tempFileId;
                // Tampilkan konfirmasi di UI
                container.innerHTML = `<div class="flex items-center justify-between p-2 bg-green-100 text-green-800 rounded-md">
                    <span class="flex items-center gap-2 text-sm"><i class="fas fa-check"></i>File siap diunggah.</span>
                </div>`;
            } else {
                // Jika item sudah ada, perbarui cache dan UI seperti biasa
                const itemInCache = kinerjaCache.find(item => item['ID Kinerja'] == idKinerja);
                if(itemInCache) {
                    if(columnName === 'Foto') itemInCache.Foto = response.viewerUrl;
                    if(columnName === 'File') itemInCache.File = response.viewerUrl;
                }
                renderAttachment(columnName === 'Foto' ? 'photo' : 'file', response.viewerUrl, idKinerja); 
                displayCards(kinerjaCache);
            }

        } catch (err) {
            container.innerHTML = `<span class="text-red-600 font-bold text-sm p-2">Gagal: ${err.message}</span>`;
            renderAttachment(columnName === 'Foto' ? 'photo' : 'file', null, idKinerja);
        }
    };
    reader.readAsDataURL(file);
}

async function showLabelModal() {
    document.getElementById('label-select-modal')?.remove();
    const modalHtml = `<div id="label-select-modal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60] p-4"><div class="bg-white rounded-lg shadow-xl w-full max-w-xs animate-scale-in flex flex-col"><div class="p-3 border-b border-slate-200"><input type="text" id="label-search-input" placeholder="Cari atau tambah..." class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"></div><div id="label-list-container" class="p-2 flex-1 overflow-y-auto max-h-60"><div class="text-center p-4"><i class="fas fa-spinner fa-spin text-indigo-500"></i></div></div><div class="p-3 bg-slate-50 border-t text-right rounded-b-lg"><button id="apply-label-btn" class="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-md hover:bg-slate-900">Terapkan</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const listContainer = document.getElementById('label-list-container');
    const searchInput = document.getElementById('label-search-input');
    const labelInput = document.getElementById('form-label');
    let selectedLabels = (labelInput.value || '').split(',').map(l => l.trim()).filter(Boolean);
    
    if (labelCache === null) await loadLabelsInBackground();
    
    const allLabels = labelCache || []; 

    const render = (filter = '') => {
        listContainer.innerHTML = '';
        const filtered = allLabels.filter(l => l.toLowerCase().includes(filter.toLowerCase()));
        filtered.forEach(label => {
            const isChecked = selectedLabels.includes(label);
            listContainer.innerHTML += `<label class="flex items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer"><input type="checkbox" data-label="${label}" class="h-4 w-4 rounded border-gray-300" ${isChecked ? 'checked' : ''}><span class="ml-3 text-sm">${label}</span></label>`;
        });
        if (filter && !allLabels.some(l => l.toLowerCase() === filter.toLowerCase())) {
            listContainer.insertAdjacentHTML('afterbegin', `<div class="p-2 text-sm text-indigo-600 rounded-md hover:bg-indigo-50 cursor-pointer font-semibold add-new-label"><i class="fas fa-plus fa-xs mr-2"></i> Tambah "${filter}"</div>`);
        }
    };
    
    listContainer.onclick = (e) => {
        if (e.target.closest('.add-new-label')) {
            const newLabel = searchInput.value.trim();
            if (newLabel && !allLabels.includes(newLabel)) {
                allLabels.push(newLabel);
                labelCache.push(newLabel); 
            }
            if (newLabel && !selectedLabels.includes(newLabel)) selectedLabels.push(newLabel);
            searchInput.value = '';
            render();
        }
    };
    
    listContainer.onchange = (e) => {
        if (e.target.type === 'checkbox') {
            const label = e.target.dataset.label;
            if (e.target.checked) {
                if (!selectedLabels.includes(label)) selectedLabels.push(label);
            } else {
                selectedLabels = selectedLabels.filter(l => l !== label);
            }
        }
    };

    searchInput.oninput = () => render(searchInput.value);
    document.getElementById('apply-label-btn').onclick = () => {
        const newKategoriString = selectedLabels.join(', ');
        labelInput.value = newKategoriString;
        renderSelectedLabels(newKategoriString);
        document.getElementById('label-select-modal').remove();
    };
    render();
}

function extractIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
}

