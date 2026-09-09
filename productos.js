document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('productsPageGrid');
    if (!grid || !window.EJData) return;

    const search = document.getElementById('productsSearch');
    const filters = document.getElementById('productsFilters');
    const count = document.getElementById('productsCount');
    const empty = document.getElementById('productsEmpty');
    const modal = document.getElementById('programModal');
    let selectedType = '';
    let programs = EJData.getPrograms().filter(item => item.active);

    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

    function render() {
        const term = search.value.trim().toLowerCase();
        const visible = programs.filter(item => (!selectedType || item.type === selectedType) && (!term || `${item.title} ${item.description} ${item.type}`.toLowerCase().includes(term)));
        count.textContent = `${visible.length} ${visible.length === 1 ? 'programa' : 'programas'}`;
        empty.hidden = visible.length !== 0;
        grid.innerHTML = visible.map(item => `<article class="catalog-card"><div class="catalog-cover"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"><span>${escapeHtml(item.type)}</span></div><div class="catalog-content"><div class="catalog-meta"><span><i class="fa-regular fa-clock"></i> ${escapeHtml(item.hours)}</span><span><i class="fa-solid fa-laptop"></i> Virtual</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><div class="catalog-actions"><button data-program-detail="${item.id}">Ver detalles</button><a href="https://wa.me/51987654321?text=${encodeURIComponent(`Hola, deseo información sobre ${item.title}`)}" target="_blank" rel="noopener noreferrer" aria-label="Consultar ${escapeHtml(item.title)} por WhatsApp"><i class="fa-brands fa-whatsapp"></i></a></div></div></article>`).join('');
    }

    function openModal(item) {
        document.getElementById('modalProgramImage').src = item.image;
        document.getElementById('modalProgramImage').alt = item.title;
        document.getElementById('modalProgramType').textContent = item.type;
        document.getElementById('modalProgramHours').textContent = item.hours;
        document.getElementById('modalProgramTitle').textContent = item.title;
        document.getElementById('modalProgramDescription').textContent = item.description;
        document.getElementById('modalWhatsapp').href = `https://wa.me/51987654321?text=${encodeURIComponent(`Hola, deseo información sobre ${item.title}`)}`;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); }
    search.addEventListener('input', render);
    filters.addEventListener('click', event => { const button = event.target.closest('[data-type]'); if (!button) return; selectedType = button.dataset.type; filters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button)); render(); });
    grid.addEventListener('click', event => { const button = event.target.closest('[data-program-detail]'); if (!button) return; const item = programs.find(program => String(program.id) === button.dataset.programDetail); if (item) openModal(item); });
    modal.addEventListener('click', event => { if (event.target.closest('[data-close-modal]')) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
    render();
});
