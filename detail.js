document.addEventListener('DOMContentLoaded', () => {
    const detailContent = document.getElementById('detail-content');
    const errorMessage = document.getElementById('error-message');

    const dataString = sessionStorage.getItem('detailData');

    if (!dataString) {
        detailContent.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        return;
    }

    try {
        const data = JSON.parse(dataString);
        renderDetail(data);
    } catch (e) {
        console.error("Gagal mem-parsing data detail:", e);
        detailContent.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }
});

function renderDetail(data) {
    const detailContent = document.getElementById('detail-content');

    detailContent.innerHTML = `
        <div>
            <label class="text-xs text-gray-500 uppercase font-semibold">ID Kinerja</label>
            <p class="text-md text-gray-700 font-mono">${data['ID Kinerja'] || '-'}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 border-t pt-5">
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">Tanggal</label>
                <p class="text-md text-gray-900">${data.Tanggal || '-'}</p>
            </div>
            <div>
                <label class="text-xs text-gray-500 uppercase font-semibold">Status</label>
                <p>${getStatusBadge(data.Status)}</p>
            </div>
        </div>
        
        <div class="border-t pt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">Deskripsi</label>
            <p class="text-md text-gray-800 whitespace-pre-wrap">${data.Deskripsi || 'Tidak ada deskripsi.'}</p>
        </div>

        <div class="border-t pt-5">
            <label class="text-xs text-gray-500 uppercase font-semibold">File Terlampir</label>
            <div class="mt-1">${getFileLink(data.File)}</div>
        </div>
    `;
}

function getStatusBadge(status) {
    if (!status) return '<span class="text-gray-500">-</span>';
    const color = getStatusColor(status);
    return `<span class="px-2.5 py-0.5 inline-flex text-sm leading-5 font-semibold rounded-full ${color}">${status}</span>`;
}

function getFileLink(fileUrl) {
    if (fileUrl && fileUrl !== 'Gagal mengunggah file' && fileUrl !== 'Mengunggah...') {
        return `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline font-semibold transition">
            <span>Lihat File</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>`;
    } else {
        return `<p class="text-gray-500">Tidak ada file yang terlampir.</p>`;
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
