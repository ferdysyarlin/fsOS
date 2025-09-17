// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwEiDsc6nttKld_RyZtSs8r9kRVKN3LKV2ukEgV1c87ZnQWtcvUrK7Lg481zKVYLgFi1Q/exec';
const CORRECT_PIN = '1234'; // Ganti dengan PIN 4 digit rahasia Anda

// --- Elemen DOM ---
const pinModalOverlay = document.getElementById('pin-modal-overlay');
const pinModalContent = document.getElementById('pin-modal-content');
const pinForm = document.getElementById('pin-form');
const pinInput = document.getElementById('pin-input');
const pinError = document.getElementById('pin-error');
const mainContent = document.getElementById('main-content');
const formModalOverlay = document.getElementById('form-modal-overlay');
const closeFormModalButton = document.getElementById('close-form-modal');
const addDataButton = document.getElementById('add-data-button');
const form = document.getElementById('kinerja-form');
const submitButton = document.getElementById('submit-button');
const tableBody = document.getElementById('kinerja-table-body');
const cardContainer = document.getElementById('kinerja-card-container');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessageP = document.getElementById('error-message');
const statusContainer = document.getElementById('status-container');
const statusInput = document.getElementById('status-input');
const fileUploadInput = document.getElementById('file-upload');
const idKinerjaInput = document.getElementById('id-kinerja');

const statusOptions = ['Hadir', 'Lembur', 'Cuti', 'Dinas', 'Sakit', 'ST'];

// --- LOGIKA APLIKASI ---

// Inisialisasi Tombol Status
function initializeStatusButtons() {
    statusContainer.innerHTML = '';
    statusOptions.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = option;
        button.dataset.value = option;
        button.className = `status-btn p-2 text-sm font-medium border rounded-md ${getStatusColor(option, true)}`;
        if (option === 'Hadir') {
            button.classList.add('selected', ...getStatusColor('Hadir').split(' '));
        }
        statusContainer.appendChild(button);
    });
}

// Verifikasi PIN
pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        mainContent.classList.remove('hidden');
        addDataButton.classList.remove('hidden');
        fetchData();
    } else {
        pinError.textContent = 'PIN salah, coba lagi.';
        pinModalContent.classList.add('shake');
        pinInput.value = '';
        setTimeout(() => pinModalContent.classList.remove('shake'), 500);
    }
});

// Kontrol Modal Form & Status
addDataButton.addEventListener('click', () => {
    form.reset();
    document.getElementById('tanggal').valueAsDate = new Date();
    statusInput.value = 'Hadir';
    initializeStatusButtons();
    idKinerjaInput.value = createKinerjaId();
    formModalOverlay.classList.remove('hidden');
});

closeFormModalButton.addEventListener('click', () => formModalOverlay.classList.add('hidden'));
statusContainer.addEventListener('click', (e) => {
    if (e.target.matches('.status-btn')) {
        statusContainer.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('selected', ...getStatusColor(btn.dataset.value).split(' ')));
        e.target.classList.add('selected', ...getStatusColor(e.target.dataset.value).split(' '));
        statusInput.value = e.target.dataset.value;
    }
});

// Logika Data (Fetch & Render)
async function fetchData() {
    loadingDiv.style.display = 'block';
    errorDiv.classList.add('hidden');
    tableBody.parentElement.parentElement.classList.add('hidden');
    cardContainer.classList.add('hidden');

    try {
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        renderData(data);
    } catch (error) {
        errorDiv.classList.remove('hidden');
        errorMessageP.textContent = error.message;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function renderData(data) {
    tableBody.innerHTML = '';
    cardContainer.innerHTML = '';
    if (data.length === 0) {
        const emptyMessage = '<p class="px-6 py-10 text-center text-gray-500">Belum ada data kinerja.</p>';
        tableBody.innerHTML = `<tr><td colspan="4">${emptyMessage}</td></tr>`;
        cardContainer.innerHTML = emptyMessage;
    } else {
        data.forEach(item => {
            tableBody.innerHTML += createTableRow(item);
            cardContainer.innerHTML += createCard(item);
        });
    }
    tableBody.parentElement.parentElement.classList.remove('hidden');
    cardContainer.classList.remove('hidden');
}

function createTableRow(item) {
    const id = item['ID Kinerja'];
    return `
        <tr id="row-${id}" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-cell="Tanggal">${item.Tanggal || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${item.Deskripsi || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.Status)}">${item.Status || ''}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center" data-cell="File">${createFileIcon(item.File)}</td>
        </tr>`;
}

function createCard(item) {
    const id = item['ID Kinerja'];
    return `
        <div id="card-${id}" class="bg-white rounded-lg shadow p-4 space-y-3">
            <div class="flex justify-between items-start">
                <div class="flex-grow">
                    <p class="text-sm font-medium text-gray-900" data-cell="Tanggal">${item.Tanggal || 'N/A'}</p>
                    <p class="text-sm text-gray-500">${item.Deskripsi || ''}</p>
                </div>
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.Status)}">${item.Status || ''}</span>
            </div>
            <div class="flex justify-end pt-2 border-t border-gray-100" data-cell="File">${createFileIcon(item.File)}</div>
        </div>`;
}

// Submit Form (Optimistic UI)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const temporaryData = Object.fromEntries(new FormData(form).entries());
    const file = fileUploadInput.files[0];
    
    // --- Optimistic UI: Update UI ---
    const newRowHTML = createTableRow(temporaryData);
    const newCardHTML = createCard(temporaryData);
    
    tableBody.insertAdjacentHTML('afterbegin', newRowHTML);
    cardContainer.insertAdjacentHTML('afterbegin', newCardHTML);
    
    document.getElementById(`row-${temporaryData['ID Kinerja']}`).classList.add('new-row-highlight');
    document.getElementById(`card-${temporaryData['ID Kinerja']}`).classList.add('new-row-highlight');
    
    formModalOverlay.classList.add('hidden');
    submitButton.disabled = true;

    // --- Send data to server ---
    try {
        let fileData = null;
        if (file) {
            fileData = await new Promise((resolve, reject) => {
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
        const responseData = await sendDataToServer({ ...temporaryData, file: fileData });
        
        // --- Sync UI with server response ---
        if (responseData && responseData.status === 'success' && responseData.savedData) {
            updateUI(responseData.savedData);
        }

    } catch (error) {
        console.error('Gagal menyimpan data:', error);
        alert('Gagal menyimpan data. Perubahan akan dikembalikan.');
        document.getElementById(`row-${temporaryData['ID Kinerja']}`)?.remove();
        document.getElementById(`card-${temporaryData['ID Kinerja']}`)?.remove();
    } finally {
        submitButton.disabled = false;
        form.reset();
    }
});

async function sendDataToServer(data) {
    const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    if (!response.ok) throw new Error('Network response was not ok.');
    return response.json();
}

function updateUI(savedData) {
    const id = savedData['ID Kinerja'];
    const row = document.getElementById(`row-${id}`);
    const card = document.getElementById(`card-${id}`);

    if (row && card) {
        const newFileIcon = createFileIcon(savedData.File);
        
        row.querySelector('[data-cell="Tanggal"]').textContent = savedData.Tanggal;
        row.querySelector('[data-cell="File"]').innerHTML = newFileIcon;
        
        card.querySelector('[data-cell="Tanggal"]').textContent = savedData.Tanggal;
        card.querySelector('[data-cell="File"]').innerHTML = newFileIcon;
    }
}

// Helper Functions
function createKinerjaId() {
    const date = new Date();
    const random = Math.random().toString(36).substring(2, 7);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${random}`;
}

function createFileIcon(fileUrl) {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`;
    if (fileUrl && fileUrl.startsWith('http')) {
        return `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="inline-block text-indigo-600 hover:text-indigo-800">${svgIcon}</a>`;
    } else {
        return `<span class="inline-block text-gray-300 cursor-not-allowed">${svgIcon}</span>`;
    }
}

function getStatusColor(status, forButton = false) {
    const colors = { Hadir: 'bg-blue-100 text-blue-800', Lembur: 'bg-purple-100 text-purple-800', Cuti: 'bg-gray-100 text-gray-800', Dinas: 'bg-yellow-100 text-yellow-800', Sakit: 'bg-orange-100 text-orange-800', ST: 'bg-green-100 text-green-800' };
    const buttonColors = { Hadir: 'border-blue-300 hover:bg-blue-50 text-blue-700', Lembur: 'border-purple-300 hover:bg-purple-50 text-purple-700', Cuti: 'border-gray-300 hover:bg-gray-50 text-gray-700', Dinas: 'border-yellow-300 hover:bg-yellow-50 text-yellow-700', Sakit: 'border-orange-300 hover:bg-orange-50 text-orange-700', ST: 'border-green-300 hover:bg-green-50 text-green-700' };
    return forButton ? (buttonColors[status] || 'border-gray-300 text-gray-700') : (colors[status] || 'bg-pink-100 text-pink-800');
}

// Inisialisasi awal
initializeStatusButtons();

