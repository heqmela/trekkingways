(function () {
    const STORAGE_KEY = 'trekkingways-gear-checklist';
    const checkboxes = Array.from(document.querySelectorAll('.checklist-items input[type="checkbox"]'));
    const progressFill = document.querySelector('.checklist-progress-fill');
    const progressLabel = document.querySelector('.checklist-progress-count');
    const resetBtn = document.querySelector('.checklist-reset');
    const printBtn = document.querySelector('.checklist-print');
    const emailBtn = document.querySelector('.checklist-email');

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

    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            const categories = document.querySelectorAll('.checklist-category');
            const total = checkboxes.length;
            const checked = checkboxes.filter((cb) => cb.checked).length;
            const categoryNames = Array.from(categories).map((cat) => cat.querySelector('h2').textContent.trim());

            let body = "Here's a trekking gear checklist from TrekkingWays";
            body += checked ? ' (' + checked + ' of ' + total + ' already packed):\n\n' : ':\n\n';
            body += categoryNames.join('\n') + '\n\n';
            body += 'Open the full checklist to tick items off, print it, or forward it on:\n';
            body += window.location.href;

            // Kept short on purpose — some desktop mail clients (older Outlook/
            // Windows MAPI handlers in particular) truncate mailto bodies
            // above roughly 2000 characters, so this links to the full,
            // interactive list rather than pasting all 60+ items inline.
            const subject = 'My TrekkingWays Gear Checklist';
            const mailto = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            window.location.href = mailto;
        });
    }
})();
