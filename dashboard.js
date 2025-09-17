// --- PENTING: Ganti dengan URL Anda ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwIuNqfyRRnR8IaPIL7oVyfWwp9Vh1M6GStsAj-HKgCQ3C3BFDVLJMsuGXdRbaieNJcRQ/exec';

let localKinerjaData = [];
let localSkpData = [];

// --- Elemen DOM ---
let statsContainer, recentKinerjaContainer;

// --- Fungsi Fetch Data (Sekarang di-export) ---
export async function fetchData() {
    // Tampilkan loading skeleton
    statsContainer.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm animate-pulse h-28"></div>
        <div class="bg-white p-6 rounded-xl shadow-sm animate-pulse h-28"></div>
        <div class="bg-white p-6 rounded-xl shadow-sm animate-pulse h-28"></div>
    `;
    recentKinerjaContainer.innerHTML = `<div class="text-center py-10 text-gray-500">Memuat aktivitas terakhir...</div>`;

    try {
        // Ambil kedua data secara paralel untuk efisiensi
        const [kinerjaRes, skpRes] = await Promise.all([
            fetch(`${GAS_WEB_APP_URL}?page=kinerja`),
            fetch(`${GAS_WEB_APP_URL}?page=skp`)
        ]);

        if (!kinerjaRes.ok || !skpRes.ok) throw new Error('Gagal mengambil data untuk dasbor.');

        localKinerjaData = await kinerjaRes.json();
        localSkpData = await skpRes.json();
        
        renderDashboard();

    } catch (error) {
        statsContainer.innerHTML = `<p class="text-red-500 col-span-3">${error.message}</p>`;
        recentKinerjaContainer.innerHTML = '';
    }
}

// --- Fungsi Render ---
function renderDashboard() {
    // 1. Kalkulasi Statistik
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear().toString();

    const kinerjaBulanIni = localKinerjaData.filter(item => {
        const [, month, year] = item.Tanggal.split('/');
        return month === currentMonth && year === currentYear;
    }).length;

    const kinerjaTahunIni = localKinerjaData.filter(item => {
        const [, , year] = item.Tanggal.split('/');
        return year === currentYear;
    }).length;

    const totalSkp = localSkpData.length;

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
    const recentKinerja = localKinerjaData.slice(0, 5);
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
                <p class="text-sm font-medium text-gray-800">${item.Deskripsi.substring(0, 50)}...</p>
                <p class="text-xs text-gray-500">${item.Tanggal}</p>
            </div>
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">${item.Status}</span>
        `;
        list.appendChild(li);
    });
    recentKinerjaContainer.appendChild(list);
}


// --- Fungsi Inisialisasi ---
export function init() {
    console.log("Halaman Dasbor diinisialisasi.");
    statsContainer = document.getElementById('stats-container');
    recentKinerjaContainer = document.getElementById('recent-kinerja-container');
    fetchData();
}
