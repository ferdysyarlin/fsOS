import { init as initKinerja, fetchData as fetchKinerjaData } from './kinerja.js';
import { init as initSkp, fetchData as fetchSkpData } from './skp.js';
import { init as initDashboard } from './dashboard.js';

// --- Konfigurasi ---
const CORRECT_PIN = '1234';
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwxslQdGhgnr2brwrT8RK7tjiagiAVdbPBF8Gxbwuj2cdzQKUyjU0qkBzzqaFodTSqBdA/exec';

// --- Cache Data Global ---
const appDataCache = {
    kinerja: null,
    skp: null
};

// --- Elemen DOM Global ---
const pinModalOverlay = document.getElementById('pin-modal-overlay');
const mainAppContainer = document.getElementById('main-app-container');
const contentContainer = document.getElementById('content-container');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const hamburgerButton = document.getElementById('hamburger-button');
const reloadDataButton = document.getElementById('reload-data-button');
const navLinks = document.querySelectorAll('.nav-link');
const addDataButton = document.getElementById('add-data-button');
let currentPage = 'dashboard';

// --- Logika Pemuatan & Caching Data ---
async function preloadAllData() {
    try {
        const [kinerjaRes, skpRes] = await Promise.all([
            fetch(`${GAS_WEB_APP_URL}?page=kinerja`),
            fetch(`${GAS_WEB_APP_URL}?page=skp`)
        ]);
        if (!kinerjaRes.ok || !skpRes.ok) throw new Error('Gagal mengambil data awal.');
        
        appDataCache.kinerja = await kinerjaRes.json();
        appDataCache.skp = await skpRes.json();
        
        console.log("Semua data awal berhasil dimuat dan disimpan di cache.");
    } catch (error) {
        console.error("Error saat preloading data:", error);
        throw error;
    }
}

// --- Logika Utama (Navigasi) ---
async function showView(pageName) {
    currentPage = pageName;
    contentContainer.innerHTML = `<div class="text-center py-10"><p class="flex items-center justify-center gap-2 text-gray-500"><i data-lucide="loader-2" class="animate-spin"></i> Memuat halaman...</p></div>`;
    lucide.createIcons();
    closeSidebar();
    updateActiveLink();
    
    if (addDataButton) {
        addDataButton.classList.toggle('hidden', pageName !== 'kinerja');
    }

    try {
        const response = await fetch(`${pageName}.html`);
        if (!response.ok) throw new Error(`Halaman ${pageName}.html tidak ditemukan.`);
        
        contentContainer.innerHTML = await response.text();
        
        if (pageName === 'dashboard') {
            initDashboard(appDataCache.kinerja, appDataCache.skp);
        } else if (pageName === 'kinerja') {
            initKinerja(appDataCache.kinerja);
        } else if (pageName === 'skp') {
            initSkp(appDataCache.skp);
        }

    } catch (error) {
        contentContainer.innerHTML = `<div class="text-center py-10 bg-red-50 p-4 rounded-lg"><p class="font-semibold text-red-700">Gagal memuat halaman</p><p class="text-red-600 text-sm">${error.message}</p></div>`;
    }
}

// --- Sidebar ---
function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
}

function updateActiveLink() {
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === currentPage);
    });
}

// --- Verifikasi PIN ---
async function handlePinSubmit(e) {
    e.preventDefault();
    const pinInput = document.getElementById('pin-input');
    const pinError = document.getElementById('pin-error');
    const pinForm = document.getElementById('pin-form');
    const submitButton = pinForm.querySelector('button[type="submit"]');

    if (pinInput.value === CORRECT_PIN) {
        submitButton.innerHTML = `<i data-lucide="loader-2" class="animate-spin w-5 h-5"></i>`;
        lucide.createIcons();
        submitButton.disabled = true;

        try {
            await preloadAllData();
            pinModalOverlay.classList.add('opacity-0', 'pointer-events-none');
            mainAppContainer.classList.remove('hidden');
            showView('dashboard'); 
        } catch (error) {
            pinError.textContent = 'Gagal memuat data awal.';
            submitButton.innerHTML = `<i data-lucide="arrow-right" class="w-5 h-5"></i>`;
            lucide.createIcons();
            submitButton.disabled = false;
        }

    } else {
        const pinModalContent = pinModalOverlay.querySelector('div');
        pinError.textContent = 'PIN salah, coba lagi.';
        if(pinModalContent) pinModalContent.classList.add('shake');
        pinInput.value = '';
        pinInput.focus();
        setTimeout(() => {
            if(pinModalContent) pinModalContent.classList.remove('shake');
        }, 500);
    }
}

// --- Fungsi Reload Data ---
async function reloadCurrentPageData() {
    try {
        if (currentPage === 'dashboard' || currentPage === 'kinerja') {
            appDataCache.kinerja = await fetchKinerjaData();
        }
        if (currentPage === 'dashboard' || currentPage === 'skp') {
            appDataCache.skp = await fetchSkpData();
        }
        showView(currentPage);
    } catch (error) {
         contentContainer.innerHTML = `<div class="text-center py-10 bg-red-50 p-4 rounded-lg"><p class="font-semibold text-red-700">Gagal memuat ulang data</p><p class="text-red-600 text-sm">${error.message}</p></div>`;
    }
}


// --- Inisialisasi & Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    
    pinModalOverlay.innerHTML = `
         <div id="pin-modal-content" class="text-center p-5 transition-transform duration-300">
              <div class="flex items-center gap-2 justify-center">
                  <a href="index.html" class="p-3 rounded-lg border bg-gray-100 text-gray-600 hover:bg-gray-200 transition" aria-label="Kembali ke Beranda"><i data-lucide="home" class="w-5 h-5"></i></a>
                  <form id="pin-form" class="flex items-center">
                      <input type="password" id="pin-input" name="pin" class="w-48 text-center text-lg tracking-widest bg-white border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" maxlength="4" pattern="[0-9]*" inputmode="numeric" autocomplete="off">
                      <button type="submit" class="p-3 rounded-r-lg bg-indigo-600 text-white hover:bg-indigo-700 transition" aria-label="Masuk"><i data-lucide="arrow-right" class="w-5 h-5"></i></button>
                  </form>
              </div>
              <p id="pin-error" class="text-red-500 text-sm mt-2 h-5"></p>
         </div>`;
    document.getElementById('pin-form').addEventListener('submit', handlePinSubmit);
    
    hamburgerButton.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    reloadDataButton.addEventListener('click', reloadCurrentPageData);
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            showView(page);
        });
    });

    lucide.createIcons();

     if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js');
        });
    }
});

