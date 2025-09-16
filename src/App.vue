<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
       <div class="h-16 flex items-center justify-between px-4 border-b border-slate-200">
         <h1 class="text-xl font-bold text-slate-900">fsOS Vue</h1>
       </div>
       <nav class="flex-1 p-4 space-y-2">
         <a href="#" @click.prevent="page = 'dashboard'" :class="['nav-link', { active: page === 'dashboard' }]">
           <i class="fa-solid fa-chart-pie w-5 h-5 mr-3 text-center"></i>
           <span>Dashboard</span>
         </a>
         <a href="#" @click.prevent="page = 'kinerja'" :class="['nav-link', { active: page === 'kinerja' }]">
           <i class="fa-solid fa-desktop w-5 h-5 mr-3 text-center"></i>
           <span>Kinerja</span>
         </a>
       </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col relative">
      <main class="flex-1 p-6 overflow-y-auto">
        <!-- Dashboard View -->
        <div v-if="page === 'dashboard'">
            <div class="bg-white shadow-lg rounded-xl p-6">
              <h2 class="text-2xl font-bold text-slate-800">Selamat Datang di fsOS</h2>
              <p class="mt-2 text-slate-600">Pilih menu 'Kinerja' untuk mengelola data.</p>
            </div>
        </div>

        <!-- Kinerja View -->
        <div v-if="page === 'kinerja'">
          <div v-if="isLoading" class="text-center p-10">
            <i class="fas fa-spinner fa-spin fa-3x text-indigo-500"></i>
            <p class="mt-4 text-gray-600">Memuat data...</p>
          </div>
          <div v-else-if="error" class="p-4 text-red-600 bg-red-100 rounded-lg">
            <strong>Error:</strong> {{ error }}
          </div>
          <div v-else class="masonry-container">
            <div v-for="item in kinerjaData" :key="item['ID Kinerja']" class="masonry-item">
                <!-- Di sini kita akan menggunakan komponen Card, namun untuk simple, kita inline dulu -->
                <div 
                  class="group relative border rounded-xl shadow-sm hover:shadow-lg p-4 flex flex-col cursor-pointer"
                  :class="getCardColor(item.Warna).bg + ' ' + getCardColor(item.Warna).border"
                  @click="editKinerja(item)"
                >
                  <!-- Konten Card -->
                   <p class="text-xs text-slate-500 mb-2">{{ item.Tanggal }}</p>
                   <p class="text-slate-800 text-sm whitespace-pre-wrap">{{ item.Deskripsi }}</p>
                </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Floating Add Button -->
       <div v-if="page === 'kinerja'" class="absolute bottom-8 right-8">
         <button @click="addKinerja" title="Tambah Data Baru" class="bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
           <i class="fas fa-plus fa-lg"></i>
         </button>
       </div>
    </div>
  </div>

  <!-- Modal (Sederhana, bisa dibuat komponen terpisah) -->
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-scale-in">
          <div class="p-6">
              <h3 class="text-lg font-bold mb-4">{{ isEditing ? 'Edit Kinerja' : 'Tambah Kinerja Baru' }}</h3>
              <form @submit.prevent="saveKinerja">
                  <textarea v-model="formData.Deskripsi" class="w-full border rounded p-2 mb-2" rows="5" placeholder="Deskripsi..."></textarea>
                  <input v-model="formData.Tanggal" type="date" class="w-full border rounded p-2 mb-4">
                  <div class="flex justify-end gap-2">
                      <button type="button" @click="showModal = false" class="px-4 py-2 bg-slate-200 rounded">Batal</button>
                      <button type="submit" class="px-4 py-2 bg-slate-800 text-white rounded">Simpan</button>
                  </div>
              </form>
          </div>
      </div>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSheetData, addNewRow, updateRowData, getDataById } from './api/kinerja.js';

// State Aplikasi
const page = ref('dashboard');
const kinerjaData = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const formData = ref({});

// Palet Warna (Sama seperti sebelumnya)
const softColors = {
  'default': { bg: 'bg-white', border: 'border-slate-200' },
  'yellow':  { bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'blue':    { bg: 'bg-blue-50', border: 'border-blue-200' },
  'green':   { bg: 'bg-green-50', border: 'border-green-200' },
  'purple':  { bg: 'bg-purple-50', border: 'border-purple-200' },
  'pink':    { bg: 'bg-pink-50', border: 'border-pink-200' }
};

// Fungsi Lifecycle
onMounted(() => {
  fetchData();
});

// Methods
async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await getSheetData();
    if (response.status === 'success') {
      kinerjaData.value = response.data;
    } else {
      throw new Error(response.message);
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

function getCardColor(colorName) {
    return softColors[colorName] || softColors['default'];
}

function addKinerja() {
    isEditing.value = false;
    formData.value = {
        Deskripsi: '',
        Tanggal: new Date().toISOString().split('T')[0] // Default tanggal hari ini
    };
    showModal.value = true;
}

function editKinerja(item) {
    isEditing.value = true;
    const [day, month, year] = item.Tanggal.split('/');
    formData.value = { 
      ...item,
      Tanggal: `${year}-${month}-${day}` // Format untuk input date
    };
    showModal.value = true;
}

async function saveKinerja() {
    // Format tanggal kembali ke DD/MM/YYYY
    const [year, month, day] = formData.value.Tanggal.split('-');
    const dataToSave = {
        ...formData.value,
        Tanggal: `${day}/${month}/${year}`
    };

    if (isEditing.value) {
        // Logika Update
        await updateRowData(dataToSave);
    } else {
        // Logika Add New
        const tgl = new Date(formData.value.Tanggal + 'T00:00:00');
        const newData = {
          'ID Kinerja': `KIN-${Date.now()}`,
          'Tanggal': `${String(tgl.getDate()).padStart(2, '0')}/${String(tgl.getMonth() + 1).padStart(2, '0')}/${tgl.getFullYear()}`,
          'Hari': ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][tgl.getDay()],
          'Bulan': `'${String(tgl.getMonth() + 1).padStart(2, '0')}`,
          'Tahun': tgl.getFullYear(),
          'Deskripsi': formData.value.Deskripsi,
          'Pin': 0
        };
        await addNewRow(newData);
    }
    showModal.value = false;
    fetchData(); // Muat ulang data setelah menyimpan
}
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  color: #475569; /* slate-600 */
}
.nav-link:hover {
  background-color: #f1f5f9; /* slate-100 */
}
.nav-link.active {
  background-color: #e2e8f0; /* slate-200 */
  color: #0f172a; /* slate-900 */
  font-weight: 600;
}
.masonry-container {
  column-count: 1;
  column-gap: 1.5rem;
}
@media (min-width: 768px) { .masonry-container { column-count: 2; } }
@media (min-width: 1024px) { .masonry-container { column-count: 3; } }
.masonry-item {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}
</style>
