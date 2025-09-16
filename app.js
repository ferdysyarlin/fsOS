const { createApp, ref, onMounted, computed } = Vue;

createApp({
    setup() {
        // --- STATE MANAGEMENT ---
        const gasUrl = ref('https://script.google.com/macros/s/AKfycbxCayr-wG9HIiooC92PN6dPi_0ZIOfEjzCHgBX9b3jbKzgTKkKH2dE71sgJkOTd6D3Pxg/exec'); // <-- PENTING: Ganti URL ini
        const currentPage = ref('kinerja'); // Halaman default
        const isSidebarCollapsed = ref(false);
        const isSidebarVisibleMobile = ref(false);
        
        const isLoading = ref(true);
        const isSubmitting = ref(false);
        const records = ref([]);
        const showAddModal = ref(false);
        
        const newRecord = ref({
            tanggal: new Date().toISOString().slice(0, 10),
            aktivitas: '',
            status: 'Selesai'
        });

        // --- COMPUTED PROPERTIES ---
        const tableHeaders = computed(() => {
            if (records.value.length === 0) return [];
            // Ambil header dari data pertama, kecuali 'rowIndex'
            return Object.keys(records.value[0]).filter(key => key !== 'rowIndex');
        });

        // --- METHODS ---
        const fetchRecords = async () => {
            isLoading.value = true;
            try {
                const response = await fetch(gasUrl.value);
                if (!response.ok) throw new Error('Gagal mengambil data!');
                const data = await response.json();
                // Balik urutan agar data terbaru di atas
                records.value = data.reverse(); 
            } catch (error) {
                console.error("Error fetching records:", error);
                alert('Tidak dapat memuat data dari Google Sheet.');
            } finally {
                isLoading.value = false;
            }
        };
        
        const addRecord = async () => {
            if (!newRecord.value.tanggal || !newRecord.value.aktivitas) {
                alert('Tanggal dan Aktivitas tidak boleh kosong.');
                return;
            }
            isSubmitting.value = true;
            try {
                const response = await fetch(gasUrl.value, {
                    method: 'POST',
                    body: JSON.stringify(newRecord.value),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                });
                const result = await response.json();
                if (result.status === 'success') {
                    closeAddModal();
                    await fetchRecords(); // Muat ulang data
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error("Error adding record:", error);
                alert('Gagal menyimpan data baru.');
            } finally {
                isSubmitting.value = false;
            }
        };
        
        const changePage = (page) => {
            currentPage.value = page;
            if (isSidebarVisibleMobile.value) {
                isSidebarVisibleMobile.value = false;
            }
        };

        const toggleSidebar = () => {
            isSidebarCollapsed.value = !isSidebarCollapsed.value;
        };
        
        const toggleMobileSidebar = () => {
            isSidebarVisibleMobile.value = !isSidebarVisibleMobile.value;
        };

        const openAddModal = () => {
            // Reset form sebelum dibuka
            newRecord.value = {
                tanggal: new Date().toISOString().slice(0, 10),
                aktivitas: '',
                status: 'Selesai'
            };
            showAddModal.value = true;
        };

        const closeAddModal = () => {
            showAddModal.value = false;
        };
        
        // --- LIFECYCLE HOOKS ---
        onMounted(() => {
            fetchRecords();
        });

        return {
            // state
            currentPage,
            isSidebarCollapsed,
            isSidebarVisibleMobile,
            isLoading,
            isSubmitting,
            records,
            showAddModal,
            newRecord,
            // computed
            tableHeaders,
            // methods
            changePage,
            toggleSidebar,
            toggleMobileSidebar,
            openAddModal,
            closeAddModal,
            addRecord
        };
    }
}).mount('#app');
