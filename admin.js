// --- PENTING: Ganti URL di bawah ini dengan URL Web App Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec';

const form = document.getElementById('kinerja-form');
const submitButton = document.getElementById('submit-button');
const table = document.getElementById('kinerja-table');
const tableBody = document.getElementById('kinerja-table-body');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessageP = document.getElementById('error-message');

// Fungsi untuk mengambil dan menampilkan data
async function fetchData() {
    loadingDiv.style.display = 'block';
    table.classList.add('hidden');
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
            throw new Error(data.message);
        }
        
        renderTable(data);

    } catch (error) {
        console.error('Error fetching data:', error);
        errorDiv.classList.remove('hidden');
        errorMessageP.textContent = error.message;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Fungsi untuk merender data ke dalam tabel
function renderTable(data) {
    tableBody.innerHTML = ''; // Kosongkan tabel sebelum diisi
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">Belum ada data kinerja.</td></tr>';
    } else {
        data.forEach(item => {
            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.Tanggal || ''}</td>
                    <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">${item.Jenis || ''}</div>
                        <div class="text-sm text-gray-500">${item.Kinerja || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.Status)}">
                            ${item.Status || ''}
                        </span>
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

// Helper untuk warna status
function getStatusColor(status) {
    switch (status) {
        case 'Selesai': return 'bg-green-100 text-green-800';
        case 'Dalam Proses': return 'bg-yellow-100 text-yellow-800';
        case 'Revisi': return 'bg-red-100 text-red-800';
        default: return 'bg-blue-100 text-blue-800';
    }
}

// Event listener untuk form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';

    const formData = new FormData(form);
    const data = {
        Tanggal: formData.get('tanggal'),
        Jenis: formData.get('jenis'),
        Kinerja: formData.get('kinerja'),
        File: formData.get('file'),
        Status: formData.get('status'),
    };

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Diperlukan untuk tipe redirect dari GAS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        // Karena 'no-cors' tidak bisa membaca response, kita anggap sukses
        // dan langsung refresh data
        form.reset();
        document.getElementById('tanggal').valueAsDate = new Date();
        fetchData();

    } catch (error) {
        console.error('Error submitting data:', error);
        alert('Gagal menyimpan data. Cek konsol untuk detail.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan Kinerja';
    }
});

// Panggil fetchData saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tanggal').valueAsDate = new Date();
    fetchData();
});
