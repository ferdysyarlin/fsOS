// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby-aWCOFsGT4hC39LaFPPMpf43j8v1zs-ezmXMib5yrpVEYUNpysjiqMowXgNqUb9kn3w/exec';
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
const table = document.getElementById('kinerja-table');
const tableBody = document.getElementById('kinerja-table-body');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessageP = document.getElementById('error-message');
const statusContainer = document.getElementById('status-container');
const statusInput = document.getElementById('status-input');
const fileUploadInput = document.getElementById('file-upload');
const idKinerjaInput = document.getElementById('id-kinerja');

const statusOptions = ['Hadir', 'Lembur', 'Cuti', 'Dinas', 'Sakit', 'ST'];

// --- LOGIKA APLIKASI ---

// 0. Inisialisasi Tombol Status
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

// 1. Verifikasi PIN
pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    pinError.textContent = '';
    
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        mainContent.classList.remove('hidden');
        addDataButton.classList.remove('hidden');
        fetchData();
    } else {
        pinError.textContent = 'PIN salah, coba lagi.';
        pinModalContent.classList.add('shake');
        pinInput.value = '';
        pinInput.focus();
        setTimeout(() => pinModalContent.classList.remove('shake'), 500);
    }
});

// 2. Kontrol Modal Form & Status
addDataButton.addEventListener('click', () => {
    form.reset();
    document.getElementById('tanggal').valueAsDate = new Date();
    statusInput.value = 'Hadir';
    initializeStatusButtons(); // Reset tombol ke default
    idKinerjaInput.value = createKinerjaId();
    formModalOverlay.classList.remove('hidden');
});

closeFormModalButton.addEventListener('click', () => formModalOverlay.classList.add('hidden'));
formModalOverlay.addEventListener('click', (e) => {
    if (e.target === formModalOverlay) formModalOverlay.classList.add('hidden');
});

statusContainer.addEventListener('click', (e) => {
    if (e.target.matches('.status-btn')) {
        statusContainer.querySelectorAll('.status-btn').forEach(btn => {
            btn.classList.remove('selected', ...getStatusColor(btn.dataset.value).split(' '));
        });
        e.target.classList.add('selected', ...getStatusColor(e.target.dataset.value).split(' '));
        statusInput.value = e.target.dataset.value;
    }
});


// 3. Logika Data (Fetch & Render)
async function fetchData() {
    loadingDiv.innerHTML = '<p class="text-gray-500">Memuat data...</p>';
    loadingDiv.style.display = 'block';
    table.classList.add('hidden');
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.message);
        renderTable(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        errorDiv.classList.remove('hidden');
        errorMessageP.textContent = error.message;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Belum ada data kinerja.</td></tr>';
    } else {
        data.forEach(item => {
            const row = createTableRow(item);
            tableBody.innerHTML += row;
        });
    }
    table.classList.remove('hidden');
}

function createTableRow(item) {
    return `
        <tr id="row-${item['ID Kinerja']}" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.Tanggal || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${item.Deskripsi || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.Status)}">${item.Status || ''}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                ${item.File ? `<a href="${item.File}" target="_blank" rel="noopener noreferrer">Lihat File</a>` : 'Tidak ada'}
            </td>
        </tr>
    `;
}

// 4. Submit Form (Optimistic UI)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const temporaryData = Object.fromEntries(new FormData(form).entries());
    const file = fileUploadInput.files[0];
    
    // --- Optimistic UI Step 1: Update UI immediately ---
    const newRowHTML = createTableRow(temporaryData);
    const tempRow = document.createElement('tbody');
    tempRow.innerHTML = newRowHTML;
    tempRow.firstElementChild.classList.add('new-row-highlight');
    
    if (tableBody.firstChild) {
        tableBody.insertBefore(tempRow.firstElementChild, tableBody.firstChild);
    } else {
        tableBody.appendChild(tempRow.firstElementChild);
    }
    formModalOverlay.classList.add('hidden');

    // --- Optimistic UI Step 2: Send data to server in background ---
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';

    try {
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const fileData = {
                    base64Data: reader.result.split(',')[1],
                    fileName: file.name,
                    mimeType: file.type,
                };
                await sendDataToServer({...temporaryData, file: fileData });
            };
        } else {
            await sendDataToServer(temporaryData);
        }
    } catch (error) {
        // --- Optimistic UI Step 3: Revert UI on failure ---
        console.error('Gagal menyimpan data:', error);
        alert('Gagal menyimpan data. Perubahan akan dikembalikan.');
        const failedRow = document.getElementById(`row-${temporaryData['ID Kinerja']}`);
        if (failedRow) failedRow.remove();
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan Kinerja';
        form.reset();
    }
});

async function sendDataToServer(data) {
    // PERBAIKAN ERROR CORS: Mengirim data sebagai text/plain
    const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
    });

    if (response && response.type === 'error') {
      throw new Error('Network error');
    }
}

// 5. Helper Functions
function createKinerjaId() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7);
    return `${yyyy}${mm}${dd}-${random}`;
}

function getStatusColor(status, forButton = false) {
    const colors = {
        Hadir: 'bg-blue-100 text-blue-800',
        Lembur: 'bg-purple-100 text-purple-800',
        Cuti: 'bg-gray-100 text-gray-800',
        Dinas: 'bg-yellow-100 text-yellow-800',
        Sakit: 'bg-orange-100 text-orange-800',
        ST: 'bg-green-100 text-green-800',
    };
    const buttonColors = {
        Hadir: 'border-blue-300 hover:bg-blue-50 text-blue-700',
        Lembur: 'border-purple-300 hover:bg-purple-50 text-purple-700',
        Cuti: 'border-gray-300 hover:bg-gray-50 text-gray-700',
        Dinas: 'border-yellow-300 hover:bg-yellow-50 text-yellow-700',
        Sakit: 'border-orange-300 hover:bg-orange-50 text-orange-700',
        ST: 'border-green-300 hover:bg-green-50 text-green-700',
    };
    if (forButton) {
        return buttonColors[status] || 'border-gray-300 hover:bg-gray-50 text-gray-700';
    }
    return colors[status] || 'bg-pink-100 text-pink-800';
}

// Inisialisasi awal saat script dimuat
initializeStatusButtons();

