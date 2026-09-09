document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('.login-page');
    const options = document.querySelectorAll('.role-option');
    const content = {
        student: {
            badge: 'Aula del alumno',
            title: 'Continúa con tu formación jurídica',
            description: 'Accede a tus clases, grabaciones y materiales académicos desde un solo lugar.',
            features: ['Videoclases grabadas en HD', 'Diapositivas y lecturas descargables', 'Evaluaciones y notas en tiempo real'],
            welcome: 'Bienvenido(a), alumno(a)',
            formDescription: 'Ingresa tus credenciales para acceder al aula.',
            userLabel: 'Código de alumno o DNI',
            placeholder: 'Ingresa tu código o documento',
            submit: 'Entrar al Aula'
        },
        teacher: {
            badge: 'Portal del profesor',
            title: 'Gestiona y acompaña el aprendizaje',
            description: 'Organiza tus sesiones, comparte recursos y realiza el seguimiento académico de tus estudiantes.',
            features: ['Gestión de clases y materiales', 'Registro de evaluaciones y notas', 'Seguimiento del progreso estudiantil'],
            welcome: 'Bienvenido(a), profesor(a)',
            formDescription: 'Ingresa tus credenciales docentes para continuar.',
            userLabel: 'Código de docente o DNI',
            placeholder: 'Ingresa tu código de docente',
            submit: 'Entrar al Portal Docente'
        }
    };
    let currentRole = 'student';
    let transitionTimer;

    function updateRoleContent(role) {
        const selected = content[role];
        page.classList.toggle('teacher-mode', role === 'teacher');

        options.forEach((option) => {
            const active = option.dataset.role === role;
            option.classList.toggle('active', active);
            option.setAttribute('aria-pressed', String(active));
        });

        document.getElementById('roleBadge').textContent = selected.badge;
        document.getElementById('login-title').textContent = selected.title;
        document.getElementById('roleDescription').textContent = selected.description;
        document.getElementById('featureOne').textContent = selected.features[0];
        document.getElementById('featureTwo').textContent = selected.features[1];
        document.getElementById('featureThree').textContent = selected.features[2];
        document.getElementById('welcomeText').textContent = selected.welcome;
        document.getElementById('formDescription').textContent = selected.formDescription;
        document.getElementById('userLabel').textContent = selected.userLabel;
        document.getElementById('username').placeholder = selected.placeholder;
        document.getElementById('loginSubmit').textContent = selected.submit;
    }

    function setRole(role) {
        if (role === currentRole || page.classList.contains('role-transitioning')) return;

        page.classList.add('role-transitioning');
        clearTimeout(transitionTimer);

        transitionTimer = setTimeout(() => {
            currentRole = role;
            updateRoleContent(role);
            page.classList.remove('role-transitioning');
            page.classList.add('role-transition-enter');

            window.setTimeout(() => {
                page.classList.remove('role-transition-enter');
            }, 450);
        }, 180);
    }

    options.forEach((option) => {
        option.addEventListener('click', () => setRole(option.dataset.role));
    });
});
