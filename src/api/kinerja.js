// !!! PENTING: Ganti dengan URL Web App Anda dari Google Apps Script !!!
const GAS_URL = 'GANTI_DENGAN_URL_WEB_APP_ANDA';

/**
 * Fungsi helper untuk melakukan request POST ke GAS API.
 * @param {string} action - Nama aksi yang akan dipanggil di backend.
 * @param {object} payload - Data yang dikirimkan.
 * @returns {Promise<object>} - Hasil dari backend.
 */
async function postToAction(action, payload) {
    const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Diperlukan untuk menghindari preflight CORS
        body: JSON.stringify({ action, payload })
    });
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Mengambil semua data kinerja yang sudah diurutkan.
 */
export async function getSheetData() {
    const response = await fetch(`${GAS_URL}?action=getSheetData`);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Menambahkan data kinerja baru.
 */
export function addNewRow(dataObject) {
    return postToAction('addNewRow', dataObject);
}

/**
 * Memperbarui data kinerja yang ada.
 */
export function updateRowData(dataObject) {
    return postToAction('updateRowData', dataObject);
}

/**
 * Menghapus data kinerja berdasarkan ID.
 */
export function deleteRow(idKinerja) {
    return postToAction('deleteRow', { idKinerja });
}

/**
 * Mengubah status pin.
 */
export function updatePinStatus(idKinerja, newStatus) {
    return postToAction('updatePinStatus', { idKinerja, newStatus });
}

/**
 * Mengambil data spesifik berdasarkan ID.
 */
export async function getDataById(id) {
    const response = await fetch(`${GAS_URL}?action=getDataById&id=${id}`);
     if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
}

// Tambahkan fungsi API lainnya sesuai kebutuhan (uploadFile, updateWarna, dll.)
