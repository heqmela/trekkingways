(function () {
    // ---- EmailJS setup ----------------------------------------------------
    // To send the checklist directly from the site (no visitor email app
    // required), sign up free at https://www.emailjs.com, connect an email
    // service (Gmail, Outlook, or your own SMTP), and create a template with
    // these variables: {{to_email}}, {{subject}}, {{message}}. Then paste
    // your three IDs below. Until you do, the button falls back to opening
    // the visitor's own email app (mailto) — it never breaks either way.
    const EMAILJS_CONFIG = {
        publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
        serviceId: 'YOUR_EMAILJS_SERVICE_ID',
        templateId: 'YOUR_EMAILJS_TEMPLATE_ID'
    };

    const isEmailJsConfigured =
        !EMAILJS_CONFIG.publicKey.startsWith('YOUR_') &&
        !EMAILJS_CONFIG.serviceId.startsWith('YOUR_') &&
        !EMAILJS_CONFIG.templateId.startsWith('YOUR_');

    if (isEmailJsConfigured && window.emailjs) {
        window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    }

    // ---- Checklist state (ticks, progress) --------------------------------
    const STORAGE_KEY = 'trekkingways-gear-checklist';
    const checkboxes = Array.from(document.querySelectorAll('.checklist-items input[type="checkbox"]'));
    const progressFill = document.querySelector('.checklist-progress-fill');
    const progressLabel = document.querySelector('.checklist-progress-count');
    const resetBtn = document.querySelector('.checklist-reset');
    const printBtn = document.querySelector('.checklist-print');
    const emailForm = document.getElementById('checklist-email-form');
    const emailInput = document.getElementById('checklist-email-input');
    const emailStatus = document.getElementById('checklist-email-status');

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

    // ---- Build the checklist as plain text (used by both send paths) ------
    function buildChecklistText() {
        const categories = document.querySelectorAll('.checklist-category');
        const total = checkboxes.length;
        const checked = checkboxes.filter((cb) => cb.checked).length;

        let text = "Here's your trekking gear checklist from TrekkingWays";
        text += checked ? ' (' + checked + ' of ' + total + ' already packed):\n\n' : ':\n\n';

        categories.forEach((cat) => {
            const heading = cat.querySelector('h2').cloneNode(true);
            heading.querySelectorAll('.badge-multiday').forEach((b) => b.remove());
            text += heading.textContent.trim().toUpperCase() + '\n';

            cat.querySelectorAll('li').forEach((li) => {
                const cb = li.querySelector('input[type="checkbox"]');
                const label = li.querySelector('.item-text');
                const isMultiDay = !!li.querySelector('.badge-multiday');
                const box = cb && cb.checked ? '[x]' : '[ ]';
                text += '  ' + box + ' ' + label.textContent.trim() + (isMultiDay ? ' (multi-day)' : '') + '\n';
            });
            text += '\n';
        });

        text += 'View, edit or print it any time: ' + window.location.href + '\n';
        text += '— TrekkingWays';
        return text;
    }

    function buildMailtoFallback(email) {
        const subject = 'Your TrekkingWays gear checklist';
        // Kept short on purpose — some desktop mail clients (older Outlook/
        // Windows MAPI handlers in particular) truncate mailto bodies above
        // roughly 2000 characters, so the fallback links to the live,
        // interactive checklist rather than pasting all 60+ items inline.
        const body =
            "Here's a trekking gear checklist from TrekkingWays:\n\n" +
            window.location.href +
            '\n\nTick items off, print it, or forward it on.\n\n— Sent via TrekkingWays';
        const mailto = 'mailto:' + (email || '') +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body);
        window.location.href = mailto;
    }

    function setStatus(message, tone) {
        if (!emailStatus) return;
        emailStatus.textContent = message;
        emailStatus.className = 'checklist-email-status' + (tone ? ' is-' + tone : '');
    }

    if (emailForm) {
        emailForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (!email) return;

            const submitBtn = emailForm.querySelector('button[type="submit"]');

            // No EmailJS keys set up yet — fall back to the visitor's own
            // email app rather than pretending to send something we can't.
            if (!isEmailJsConfigured || !window.emailjs) {
                buildMailtoFallback(email);
                return;
            }

            const params = {
                to_email: email,
                subject: 'Your TrekkingWays gear checklist',
                message: buildChecklistText()
            };

            if (submitBtn) submitBtn.disabled = true;
            setStatus('Sending…', 'pending');

            window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, params)
                .then(() => {
                    setStatus('Sent — check ' + email, 'success');
                    emailInput.value = '';
                })
                .catch((err) => {
                    console.error('EmailJS send failed:', err);
                    setStatus("Couldn't send that — opening your email app instead…", 'error');
                    setTimeout(() => buildMailtoFallback(email), 1200);
                })
                .finally(() => {
                    if (submitBtn) submitBtn.disabled = false;
                });
        });
    }
})();
