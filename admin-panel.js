document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.admin-menu-item');
    const views = document.querySelectorAll('.admin-view');
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('adminSidebarToggle');

    function openSection(id) {
        menuItems.forEach(item => item.classList.toggle('active', item.dataset.section === id));
        views.forEach(view => view.classList.toggle('active', view.id === id));
        sidebar.classList.remove('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    menuItems.forEach(item => item.addEventListener('click', () => openSection(item.dataset.section)));
    document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => openSection(button.dataset.go)));
    document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => showAdminToast(`${button.dataset.demo}: función demostrativa`)));
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

    const programBody = document.getElementById('programsAdminBody');
    const programSearch = document.getElementById('programSearch');
    const programFilter = document.getElementById('programFilter');
    const alliesGrid = document.getElementById('alliesAdminGrid');

    function renderPrograms() {
        const search = programSearch.value.toLowerCase();
        const filter = programFilter.value;
        const programs = EJData.getPrograms().filter(item => item.title.toLowerCase().includes(search) && (!filter || item.type === filter));
        programBody.innerHTML = programs.map(item => `<tr><td><div class="admin-program-cell"><img src="${item.image}" alt=""><span><strong>${item.title}</strong><small>${item.description}</small></span></div></td><td>${item.type}</td><td>${item.hours}</td><td><button class="status-toggle ${item.active ? 'active' : ''}" data-program-toggle="${item.id}">${item.active ? 'Publicado' : 'Oculto'}</button></td><td><button class="table-action" data-program-edit="${item.id}" title="Editar"><i class="fa-solid fa-pen"></i></button><button class="table-action danger" data-program-delete="${item.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
        const allPrograms = EJData.getPrograms();
        document.querySelector('[data-section="programas"] b').textContent = allPrograms.length;
        document.querySelector('.admin-stats article:nth-child(2) strong').textContent = allPrograms.filter(item => item.active).length;
    }

    function renderAllies() {
        const allies = EJData.getAllies();
        alliesGrid.innerHTML = allies.map(item => `<article class="${item.active ? '' : 'admin-item-hidden'}"><div class="admin-ally-logo">${allyLogoMarkup(item)}</div><strong>${item.name}</strong><small>${item.category}</small><span class="ally-actions"><button data-ally-edit="${item.id}" title="Editar"><i class="fa-solid fa-pen"></i></button><button data-ally-toggle="${item.id}" title="Mostrar u ocultar"><i class="fa-solid fa-${item.active ? 'eye' : 'eye-slash'}"></i></button><button data-ally-delete="${item.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button></span></article>`).join('');
        document.querySelector('[data-section="aliados"] b').textContent = allies.length;
        document.querySelector('.admin-stats article:nth-child(4) strong').textContent = allies.filter(item => item.active).length;
    }

    function allyLogoMarkup(item) {
        if (item.image) return `<img src="${item.image}" alt="Logo de ${item.name}" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'${item.short}'}))">`;
        const customLogos = {
            4: '<span class="gonzales-logo"><small>JORGE LUIS · GONZALES LOLI</small><b>JL</b><strong>NOTARÍA<br>GONZALES LOLI</strong></span>',
            5: '<span class="pj-symbol"><b>PJ</b><b>PJ</b><b>PJ</b><b>PJ</b></span>',
            7: '<span class="admin-ercc-logo"><span class="ercc-monogram">ERCC</span></span>',
            8: '<span class="admin-lima-norte-logo"><span class="lima-norte-seal"><b>PJ</b><small>Corte Superior de<br>Justicia de Lima Norte</small></span></span>',
            9: '<span class="admin-paino-logo"><span class="paino-logo"><b>P</b><small>NOTARÍA</small><strong>AINO</strong></span></span>',
            11: '<img src="https://subastapublica.sbn.gob.pe/assets/logo.png" alt="Logo de la Superintendencia Nacional de Bienes Estatales" onerror="this.replaceWith(Object.assign(document.createElement(\'b\'),{textContent:\'SBN\'}))">'
        };
        if (customLogos[item.id]) return customLogos[item.id];
        return `<b>${item.short}</b>`;
    }

    function promptProgram(existing = {}) {
        const title = prompt('Nombre del programa:', existing.title || ''); if (!title) return;
        const type = prompt('Tipo: Diplomado, Curso o Seminario', existing.type || 'Curso') || 'Curso';
        const hours = prompt('Duración:', existing.hours || '40 hrs') || '';
        const description = prompt('Descripción breve:', existing.description || '') || '';
        const image = prompt('URL de la imagen:', existing.image || '') || 'img/curso1.jpg';
        return { ...existing, title, type, hours, description, image, active: existing.active ?? true };
    }

    document.getElementById('addProgramBtn').addEventListener('click', () => {
        const item = promptProgram({ id: Date.now() }); if (!item) return;
        const data = EJData.getPrograms(); data.push(item); EJData.savePrograms(data); renderPrograms(); showAdminToast('Programa agregado y sincronizado');
    });
    programBody.addEventListener('click', event => {
        const edit = event.target.closest('[data-program-edit]'); const toggleButton = event.target.closest('[data-program-toggle]'); const remove = event.target.closest('[data-program-delete]');
        const data = EJData.getPrograms();
        if (edit) { const index = data.findIndex(item => item.id == edit.dataset.programEdit); const updated = promptProgram(data[index]); if (updated) data[index] = updated; else return; }
        else if (toggleButton) { const item = data.find(item => item.id == toggleButton.dataset.programToggle); item.active = !item.active; }
        else if (remove) { const index = data.findIndex(item => item.id == remove.dataset.programDelete); if (!confirm('¿Eliminar este programa?')) return; data.splice(index, 1); }
        else return;
        EJData.savePrograms(data); renderPrograms(); showAdminToast('Programas actualizados');
    });
    programSearch.addEventListener('input', renderPrograms); programFilter.addEventListener('change', renderPrograms);

    function promptAlly(existing = {}) {
        const name = prompt('Nombre de la institución:', existing.name || ''); if (!name) return;
        const short = prompt('Sigla o texto del logo:', existing.short || '') || name.slice(0, 5).toUpperCase();
        const category = prompt('Categoría o sede:', existing.category || 'Institución aliada') || '';
        const image = prompt('URL del logo (puede dejarse vacío):', existing.image || '') || '';
        return { ...existing, name, short, category, image, active: existing.active ?? true };
    }
    document.getElementById('addAllyBtn').addEventListener('click', () => { const item = promptAlly({ id: Date.now() }); if (!item) return; const data = EJData.getAllies(); data.push(item); EJData.saveAllies(data); renderAllies(); showAdminToast('Aliado agregado y sincronizado'); });
    alliesGrid.addEventListener('click', event => {
        const edit = event.target.closest('[data-ally-edit]'); const toggleButton = event.target.closest('[data-ally-toggle]'); const remove = event.target.closest('[data-ally-delete]'); const data = EJData.getAllies();
        if (edit) { const index = data.findIndex(item => item.id == edit.dataset.allyEdit); const updated = promptAlly(data[index]); if (updated) data[index] = updated; else return; }
        else if (toggleButton) { const item = data.find(item => item.id == toggleButton.dataset.allyToggle); item.active = !item.active; }
        else if (remove) { const index = data.findIndex(item => item.id == remove.dataset.allyDelete); if (!confirm('¿Eliminar esta institución?')) return; data.splice(index, 1); }
        else return;
        EJData.saveAllies(data); renderAllies(); showAdminToast('Aliados actualizados');
    });

    renderPrograms(); renderAllies();
});

function showAdminToast(message) {
    const toast = document.getElementById('adminToast');
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    window.clearTimeout(window.adminToastTimer);
    window.adminToastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}
