(function () {
    // ---- Checklist state (ticks, progress) --------------------------------
    const STORAGE_KEY = 'trekkingways-gear-checklist';
    const checkboxes = Array.from(document.querySelectorAll('.checklist-items input[type="checkbox"]'));
    const progressFill = document.querySelector('.checklist-progress-fill');
    const progressLabel = document.querySelector('.checklist-progress-count');
    const resetBtn = document.querySelector('.checklist-reset');
    const printBtn = document.querySelector('.checklist-print');

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Storage unavailable (private browsing etc.) — checklist still works,
            // it just won't remember ticks between visits.
        }
    }

    function updateProgress() {
        const total = checkboxes.length;
        const checked = checkboxes.filter((cb) => cb.checked).length;
        if (progressFill) progressFill.style.width = (total ? (checked / total) * 100 : 0) + '%';
        if (progressLabel) progressLabel.textContent = checked + ' of ' + total + ' packed';
    }

    // Restore ticks from a previous visit.
    const state = loadState();
    checkboxes.forEach((cb) => {
        if (state[cb.id]) cb.checked = true;
        cb.addEventListener('change', () => {
            const s = loadState();
            s[cb.id] = cb.checked;
            saveState(s);
            updateProgress();
        });
    });
    updateProgress();

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            checkboxes.forEach((cb) => { cb.checked = false; });
            saveState({});
            updateProgress();
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
})();
