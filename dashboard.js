// --- Variabel Global ---
let localKinerjaData = [];
let localSkpData = [];

// --- Variabel DOM ---
let statsContainer, recentKinerjaContainer, monthlyChartContainer, statusChartContainer;

// --- Fungsi Fetch Data (untuk Reload) ---
export async function fetchData() {
    // Reload ditangani oleh admin.js, fungsi ini hanya untuk konsistensi
    return true; 
}

// --- Fungsi Render ---
function renderDashboard(kinerjaData, skpData) {
    if (!statsContainer) return; // Pastikan elemen sudah ada

    // 1. Kalkulasi Statistik
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear().toString();

    const kinerjaBulanIni = kinerjaData.filter(item => item.Tanggal.endsWith(`/${currentMonth}/${currentYear}`)).length;
    const kinerjaTahunIni = kinerjaData.filter(item => item.Tanggal.endsWith(`/${currentYear}`)).length;
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
    } else {
        recentKinerjaContainer.innerHTML = '';
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
    
    // 4. Render Grafik
    renderMonthlyChart(kinerjaData, currentYear);
    renderStatusChart(kinerjaData, currentMonth, currentYear);
}

function renderMonthlyChart(kinerjaData, currentYear) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyCounts = Array(12).fill(0);

    kinerjaData.forEach(item => {
        const [, month, year] = item.Tanggal.split('/');
        if (year === currentYear) {
            monthlyCounts[parseInt(month, 10) - 1]++;
        }
    });

    const options = {
        series: [{ name: 'Jumlah Kinerja', data: monthlyCounts }],
        chart: { type: 'bar', height: 350, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: monthNames },
        yaxis: { title: { text: 'Jumlah' } },
        fill: { opacity: 1 },
        tooltip: { y: { formatter: (val) => `${val} Kinerja` } }
    };

    const chart = new ApexCharts(monthlyChartContainer, options);
    chart.render();
}

function renderStatusChart(kinerjaData, currentMonth, currentYear) {
    const statusCounts = {};
    const kinerjaBulanIni = kinerjaData.filter(item => item.Tanggal.endsWith(`/${currentMonth}/${currentYear}`));

    kinerjaBulanIni.forEach(item => {
        statusCounts[item.Status] = (statusCounts[item.Status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const series = Object.values(statusCounts);

    if (labels.length === 0) {
        statusChartContainer.innerHTML = `<p class="text-center py-10 text-gray-500">Tidak ada data untuk bulan ini.</p>`;
        return;
    }

    const options = {
        series: series,
        chart: { type: 'donut', height: 350 },
        labels: labels,
        responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
    };
    
    const chart = new ApexCharts(statusChartContainer, options);
    chart.render();
}


// --- Fungsi Inisialisasi ---
export function init(kinerjaDataFromCache, skpDataFromCache) {
    localKinerjaData = kinerjaDataFromCache || [];
    localSkpData = skpDataFromCache || [];

    // Hubungkan elemen DOM
    statsContainer = document.getElementById('stats-container');
    recentKinerjaContainer = document.getElementById('recent-kinerja-container');
    monthlyChartContainer = document.getElementById('monthly-chart-container');
    statusChartContainer = document.getElementById('status-chart-container');

    console.log("Halaman Dasbor diinisialisasi dengan data cache.");
    renderDashboard(localKinerjaData, localSkpData);
}

