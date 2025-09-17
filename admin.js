// --- PENTING: Ganti dengan URL dan PIN Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwfWTBx2Q_3upcAyIul1pP3V0OiffCtgVDdT8xWC2uQOX-Tw-nqcH-26vlGoP1svddtTg/exec';
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

// --- LOGIKA APLIKASI ---

// 1. Verifikasi PIN
pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    pinError.textContent = '';
    
    if (pinInput.value === CORRECT_PIN) {
        pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
        mainContent.classList.remove('hidden');
        addDataButton.classList.remove('hidden');
        document.getElementById('tanggal').valueAsDate = new Date();
        fetchData();
    } else {
        pinError.textContent = 'PIN salah, coba lagi.';
        pinModalContent.classList.add('shake');
        pinInput.value = '';
        pinInput.focus();
        setTimeout(() => pinModalContent.classList.remove('shake'), 500);
    }
});

// 2. Kontrol Modal Form & Pembuatan ID Kinerja
addDataButton.addEventListener('click', () => {
    form.reset();
    document.getElementById('tanggal').valueAsDate = new Date();
    document.querySelector('input[name="Status"][value="Hadir"]').checked = true;

    const tanggalInput = document.getElementById('tanggal').value;
    const tanggalFormatted = tanggalInput.replace(/-/g, '');
    const randomString = Math.random().toString(36).substring(2, 7);
    const idKinerja = `${tanggalFormatted}-${randomString}`;
    
    document.getElementById('id-kinerja-input').value = idKinerja;
    
    formModalOverlay.classList.remove('hidden');
});

closeFormModalButton.addEventListener('click', () => formModalOverlay.classList.add('hidden'));
formModalOverlay.addEventListener('click', (e) => {
    if (e.target === formModalOverlay) formModalOverlay.classList.add('hidden');
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
            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatDate(item.Tanggal)}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${item.Deskripsi || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.Status)}">${item.Status || ''}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                        ${item.File ? `<a href="${item.File}" target="_blank" rel="noopener noreferrer">Lihat File</a>` : 'Tidak ada'}
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }
    table.classList.remove('hidden');
}

// 4. Helper Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Cek jika format sudah benar dari GAS (ada apostrof)
    if (String(dateString).startsWith("'")) {
         return dateString.replace(/'/g, ''); // Hapus apostrof untuk tampilan
    }
    // Jika format dari JavaScript Date object
    try {
        const date = new Date(dateString);
        // Cek jika tanggal valid
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString; // Fallback
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

// 5. Submit Form Kinerja
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        formModalOverlay.classList.add('hidden');
        
        // Beri jeda sedikit agar Google Sheet sempat memproses data
        setTimeout(() => {
            fetchData();
        }, 1500); 

    } catch (error) {
        console.error('Error submitting data:', error);
        alert('Gagal menyimpan data. Cek konsol untuk detail.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan Kinerja';
    }
});

