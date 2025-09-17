// --- Variabel Global ---
let localKinerjaData = [];
let localSkpData = [];

// --- Variabel DOM ---
let statsContainer, recentKinerjaContainer;

// --- Fungsi Fetch Data (untuk Reload) ---
// Dalam kasus dasbor, reload akan ditangani oleh admin.js yang memuat ulang semua cache.
// Fungsi ini ada untuk konsistensi dengan modul lain.
export async function fetchData() {
    console.log("Meminta pembaruan data untuk dasbor...");
    return true; 
}

// --- Fungsi Render ---
function renderDashboard(kinerjaData, skpData) {
    if (!statsContainer || !recentKinerjaContainer) return;

    // 1. Kalkulasi Statistik
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear().toString();

    const kinerjaBulanIni = kinerjaData.filter(item => {
        const [, month, year] = item.Tanggal.split('/');
        return month === currentMonth && year === currentYear;
    }).length;

    const kinerjaTahunIni = kinerjaData.filter(item => {
        const [, , year] = item.Tanggal.split('/');
        return year === currentYear;
    }).length;

    const totalSkp = skpData.length;

    // 2. Render Kartu Statistik
    statsContainer.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm">
            <p class="text-sm font-medium text-gray-500">Kinerja Bulan Ini</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">${kinerjaBulanIni}</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm">
            <p class="text-sm font-medium text-gray-500">Total Kinerja Tahun Ini</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">${kinerjaTahunIni}</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm">
            <p class="text-sm font-medium text-gray-500">Total SKP Tercatat</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">${totalSkp}</p>
        </div>
    `;

    // 3. Render Aktivitas Terakhir
    const recentKinerja = kinerjaData.slice(0, 5);
    if(recentKinerja.length === 0){
        recentKinerjaContainer.innerHTML = `<p class="text-center text-gray-500 py-4">Belum ada aktivitas kinerja.</p>`;
        return;
    }

    recentKinerjaContainer.innerHTML = ''; // Kosongkan kontainer
    const list = document.createElement('ul');
    list.className = 'divide-y divide-gray-100';
    recentKinerja.forEach(item => {
        const li = document.createElement('li');
        li.className = 'py-3 flex items-center justify-between';
        li.innerHTML = `
            <div>
                <p class="text-sm font-medium text-gray-800">${item.Deskripsi ? item.Deskripsi.substring(0, 50) + (item.Deskripsi.length > 50 ? '...' : '') : 'Tanpa Deskripsi'}</p>
                <p class="text-xs text-gray-500">${item.Tanggal}</p>
            </div>
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">${item.Status}</span>
        `;
        list.appendChild(li);
    });
    recentKinerjaContainer.appendChild(list);
}


// --- Fungsi Inisialisasi (Diperbarui) ---
export function init(kinerjaDataFromCache, skpDataFromCache) {
    localKinerjaData = kinerjaDataFromCache || [];
    localSkpData = skpDataFromCache || [];

    // Hubungkan elemen DOM
    statsContainer = document.getElementById('stats-container');
    recentKinerjaContainer = document.getElementById('recent-kinerja-container');

    console.log("Halaman Dasbor diinisialisasi dengan data cache.");
    renderDashboard(localKinerjaData, localSkpData);
}

