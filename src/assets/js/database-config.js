document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DB
    if (typeof EECOLIndexedDB === 'undefined') {
        console.error('❌ EECOLIndexedDB class not found');
        return;
    }

    if (!window.eecolDB) {
        window.eecolDB = new EECOLIndexedDB();
    }

    const db = window.eecolDB;
    await db.isReady();

    initModalSystem();

    // DOM Elements
    const exportDbBtn = document.getElementById('exportDbBtn');
    const importDbBtn = document.getElementById('importDbBtn');
    const deleteDbBtn = document.getElementById('deleteDbBtn');
    const importFileInput = document.getElementById('importFileInput');

    const markConverterList = document.getElementById('markConverterList');
    const stopmarkConverterList = document.getElementById('stopmarkConverterList');
    const reelcapacityEstimatorList = document.getElementById('reelcapacityEstimatorList');

    const deleteSelectedMarkConverterBtn = document.getElementById('deleteSelectedMarkConverter');
    const deleteSelectedStopmarkConverterBtn = document.getElementById('deleteSelectedStopmarkConverter');
    const deleteSelectedReelcapacityEstimatorBtn = document.getElementById('deleteSelectedReelcapacityEstimator');

    // Load and render records
    const formatRecord = (storeName, record) => {
        const timestamp = new Date(record.timestamp).toLocaleString();
        switch (storeName) {
            case 'markConverter':
                return `Start: ${record.startMark}, End: ${record.endMark}, Unit: ${record.unit} (${timestamp})`;
            case 'stopmarkConverter':
                return `Start: ${record.startMark}, Length: ${record.cutLength}, Unit: ${record.unit} (${timestamp})`;
            case 'reelcapacityEstimator':
                return `Flange: ${record.flangeDiameter.value} ${record.flangeDiameter.unit}, Barrel: ${record.barrelDiameter.value} ${record.barrelDiameter.unit}, Traverse: ${record.traverse.value} ${record.traverse.unit} (${timestamp})`;
            default:
                return JSON.stringify(record);
        }
    };

    const renderRecords = async (storeName, listElement) => {
        const records = await db.getAll(storeName);
        listElement.innerHTML = '';
        if (records.length === 0) {
            listElement.innerHTML = '<p class="text-gray-500">No records found.</p>';
            return;
        }
        records.forEach(record => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-2 border-b';
            div.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" data-id="${record.id}" class="mr-2">
                    <span class="text-sm">${formatRecord(storeName, record)}</span>
                </div>
                <button data-id="${record.id}" class="delete-record text-red-500 hover:text-red-700 text-xs">Delete</button>
            `;
            listElement.appendChild(div);
        });
    };

    const loadAllRecords = async () => {
        await renderRecords('markConverter', markConverterList);
        await renderRecords('stopmarkConverter', stopmarkConverterList);
        await renderRecords('reelcapacityEstimator', reelcapacityEstimatorList);
    };

    // Event Listeners
    exportDbBtn.addEventListener('click', async () => {
        const allData = {};
        for (const storeName of Object.keys(db.stores)) {
            allData[storeName] = await db.getAll(storeName);
        }
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eecol-db-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        await showAlert('Database exported successfully!');
    });

    importDbBtn.addEventListener('click', () => importFileInput.click());

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = JSON.parse(e.target.result);
            const confirmed = await showConfirm('Are you sure you want to import this data? This will overwrite existing data.');
            if (confirmed) {
                for (const storeName of Object.keys(data)) {
                    if(db.stores[storeName]){
                        await db.clear(storeName);
                        for (const record of data[storeName]) {
                            await db.add(storeName, record);
                        }
                    }
                }
                await loadAllRecords();
                await showAlert('Database imported successfully!');
            }
        };
        reader.readAsText(file);
    });

    deleteDbBtn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Are you sure you want to delete the entire database? This action is irreversible.');
        if (confirmed) {
            for (const storeName of Object.keys(db.stores)) {
                await db.clear(storeName);
            }
            await loadAllRecords();
            await showAlert('Database deleted successfully!');
        }
    });

    const handleDeleteSelected = async (storeName, listElement) => {
        const selectedIds = Array.from(listElement.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.dataset.id);
        if (selectedIds.length === 0) {
            await showAlert('No records selected.');
            return;
        }

        const confirmed = await showConfirm(`Are you sure you want to delete ${selectedIds.length} records?`);
        if (confirmed) {
            for (const id of selectedIds) {
                await db.delete(storeName, id);
            }
            await renderRecords(storeName, listElement);
            await showAlert(`${selectedIds.length} records deleted successfully!`);
        }
    };

    deleteSelectedMarkConverterBtn.addEventListener('click', () => handleDeleteSelected('markConverter', markConverterList));
    deleteSelectedStopmarkConverterBtn.addEventListener('click', () => handleDeleteSelected('stopmarkConverter', stopmarkConverterList));
    deleteSelectedReelcapacityEstimatorBtn.addEventListener('click', () => handleDeleteSelected('reelcapacityEstimator', reelcapacityEstimatorList));

    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-record')) {
            const id = e.target.dataset.id;
            const storeName = e.target.closest('.overflow-y-auto').id.replace('List', '');
            const confirmed = await showConfirm('Are you sure you want to delete this record?');
            if (confirmed) {
                await db.delete(storeName, id);
                await renderRecords(storeName, e.target.closest('.overflow-y-auto'));
                await showAlert('Record deleted successfully!');
            }
        }
    });

    // Initial Load
    await loadAllRecords();
});
