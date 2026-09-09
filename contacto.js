document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactPageForm');
    const success = document.getElementById('contactSuccess');
    if (!form || !success) return;
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
});
