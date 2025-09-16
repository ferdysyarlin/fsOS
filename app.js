const { createApp, ref, onMounted, computed, watch } = Vue;

const app = createApp({
    setup() {
        // --- KONFIGURASI PENTING ---
        // >> PASTE URL WEB APP GOOGLE SCRIPT ANDA DI SINI <<
        const gasUrl = ref('https://script.google.com/macros/s/AKfycbx3cQGX7hd5ivKotlt80Kkwry6ilo8JiW-B-D8e3ehuNImmcCfPGg5VohNqyQpfPHQGRA/exec');
        // --------------------------

        // --- Reactive State ---
        const isLoading = ref(true);
        const loadingMessage = ref('Memuat data kinerja...');
        const records = ref([]);
        const currentPage = ref('kinerja');
        const isSidebarCollapsed = ref(false);
        const isSidebarVisible = ref(false); // For mobile
        
        const activeModal = ref(null); // 'edit', 'delete', 'label'
        const editableRecord = ref({});
        const recordToDelete = ref(null);
        const isSaving = ref(false);

        // --- Constants ---
        const softColors = {
            'default': { bg: 'bg-white', border: 'border-slate-200' },
            'yellow':  { bg: 'bg-yellow-50', border: 'border-yellow-200' },
            'blue':    { bg: 'bg-blue-50', border: 'border-blue-200' },
            'green':   { bg: 'bg-green-50', border: 'border-green-200' },
            'purple':  { bg: 'bg-purple-50', border: 'border-purple-200' },
            'pink':    { bg: 'bg-pink-50', border: 'border-pink-200' }
        };

        // --- Computed Properties ---
        const isNewRecord = computed(() => !editableRecord.value['ID Kinerja']);
        const sortedRecords = computed(() => {
            return [...records.value].sort((a, b) => (b.Pin || 0) - (a.Pin || 0));
        });

        // --- Methods ---
        // Helper baru untuk berkomunikasi dengan GAS melalui fetch
        const runGoogleScript = async (functionName, args) => {
             const response = await fetch(gasUrl.value, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ functionName, args })
            });
            
            const result = await response.json();

            if (result.status === 'error') {
                throw new Error(result.message);
            }
            return result.data;
        };

        const fetchRecords = async () => {
            if (!gasUrl.value || gasUrl.value.includes('GANTI_DENGAN')) {
                alert('URL Google Apps Script belum diatur di file app.js!');
                isLoading.value = false;
                return;
            }
            isLoading.value = true;
            loadingMessage.value = 'Memuat data kinerja...';
            try {
                // GET request untuk mengambil semua data awal
                const response = await fetch(gasUrl.value);
                const dataArray = await response.json();

                if (dataArray && dataArray.length > 1) {
                    const headers = dataArray[0];
                    records.value = dataArray.slice(1).map(row => {
                        const record = {};
                        headers.forEach((header, index) => {
                            record[header] = row[index];
                        });
                        return record;
                    });
                } else {
                    records.value = [];
                }
            } catch (error) {
                console.error("Failed to fetch records:", error);
                alert("Gagal memuat data dari Google Sheet.");
            } finally {
                isLoading.value = false;
            }
        };
        
        const showEditModal = (record) => {
            if (record) {
                const [day, month, year] = record.Tanggal ? record.Tanggal.split('/') : [null, null, null];
                const formattedDate = record.Tanggal ? `${year}-${month}-${day}` : '';
                editableRecord.value = { ...record, formattedDate };
            } else {
                editableRecord.value = {
                    Deskripsi: '',
                    Tanggal: new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}),
                    formattedDate: new Date().toISOString().split('T')[0],
                    Warna: 'default',
                    Pin: 0
                };
            }
            activeModal.value = 'edit';
        };

        const saveRecord = async () => {
            isSaving.value = true;
            try {
                const recordToSave = { ...editableRecord.value };
                const [year, month, day] = recordToSave.formattedDate.split('-');
                recordToSave.Tanggal = `${day}/${month}/${year}`;
                
                const originalFormattedDate = recordToSave.formattedDate; // Simpan untuk nanti
                delete recordToSave.formattedDate;

                if (isNewRecord.value) {
                    recordToSave['ID Kinerja'] = Date.now();
                    const tanggalObj = new Date(originalFormattedDate + 'T00:00:00');
                    recordToSave.Hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][tanggalObj.getDay()];
                    recordToSave.Bulan = `'${String(tanggalObj.getMonth() + 1).padStart(2, '0')}`;
                    recordToSave.Tahun = tanggalObj.getFullYear();
                    
                    await runGoogleScript('addNewRow', [recordToSave]);
                } else {
                    await runGoogleScript('updateRowData', [recordToSave]);
                }
                activeModal.value = null;
                await fetchRecords();
            } catch (error) {
                console.error("Failed to save record:", error);
                alert("Gagal menyimpan data: " + error.message);
            } finally {
                isSaving.value = false;
            }
        };

        const showDeleteModal = (record) => {
            recordToDelete.value = record;
            activeModal.value = 'delete';
        };
        
        const confirmDelete = async () => {
            if (!recordToDelete.value) return;
            isSaving.value = true;
            try {
                await runGoogleScript('deleteRow', [recordToDelete.value['ID Kinerja']]);
                activeModal.value = null;
                records.value = records.value.filter(r => r['ID Kinerja'] !== recordToDelete.value['ID Kinerja']);
            } catch (error) {
                console.error("Failed to delete record:", error);
                alert("Gagal menghapus data: " + error.message);
            } finally {
                isSaving.value = false;
                recordToDelete.value = null;
            }
        };

        const copyDescription = (text, event) => {
            navigator.clipboard.writeText(text).then(() => {
                const iconElement = event.currentTarget.querySelector("i");
                const originalIconClass = iconElement.className;
                iconElement.className = 'fas fa-check text-green-500';
                setTimeout(() => { iconElement.className = originalIconClass; }, 1500);
            });
        };

        const clearCacheAndReload = () => {
            isLoading.value = true;
            loadingMessage.value = 'Membersihkan cache dan memuat ulang...';
            setTimeout(() => location.reload(true), 1000);
        };
        
        const extractIdFromUrl = (url) => {
            if (!url) return null;
            const match = url.match(/[-\w]{25,}/);
            return match ? match[0] : null;
        };

        onMounted(() => {
            fetchRecords();
        });
        
        watch(currentPage, () => {
             if (isSidebarVisible.value) {
                 isSidebarVisible.value = false;
             }
        });

        return {
            isLoading, loadingMessage, records, currentPage, isSidebarCollapsed, isSidebarVisible,
            activeModal, editableRecord, recordToDelete, isSaving, softColors, isNewRecord, sortedRecords,
            fetchRecords, showEditModal, saveRecord, showDeleteModal, confirmDelete,
            copyDescription, clearCacheAndReload, extractIdFromUrl,
        };
    }
});

app.mount('#app');

