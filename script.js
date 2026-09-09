/* ==========================================================================
   ESCUELA JURÍDICA - FUNCIONALIDADES INTERACTIVAS (Semana 2)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Aplicar cambios realizados desde la maqueta administrativa.
    if (window.EJData && localStorage.getItem('ej_programs')) {
        const grid = document.querySelector('.productos-grid');
        grid.innerHTML = window.EJData.getPrograms().filter(item => item.active).map(item => `
            <div class="product-card"><div class="product-card-header"><span class="prod-badge badge-${item.type === 'Curso' ? 'orange' : item.type === 'Seminario' ? 'burgundy' : 'navy'}">${item.type}</span><span class="prod-hours"><i class="fa-regular fa-clock"></i> ${item.hours}</span></div><div class="product-card-body"><div class="prod-cover"><img src="${item.image}" alt="${item.title}" class="prod-cover-img"></div><h3 class="prod-title">${item.title}</h3><p class="prod-desc">${item.description}</p></div><div class="product-card-footer"><a href="contacto.html" class="btn-product">Más Información</a></div></div>`).join('');
    }
    if (window.EJData && localStorage.getItem('ej_allies')) {
        const track = document.getElementById('aliadosTrack');
        const savedAllies = window.EJData.getAllies();
        [...track.querySelectorAll('.logo-partner')].forEach((card, index) => {
            const item = savedAllies.find(ally => ally.id === index + 1);
            if (!item || !item.active) { card.remove(); return; }
            card.title = item.name;
            card.querySelector('strong').textContent = item.name;
            card.querySelector(':scope > span').textContent = item.category;
            if (item.image) {
                const logoBox = card.querySelector('.partner-logo-box');
                logoBox.innerHTML = `<img src="${item.image}" alt="Logo de ${item.name}" class="partner-logo" data-fallback="${item.short}">`;
            }
        });
        savedAllies.filter(item => item.id > 11 && item.active).forEach(item => {
            track.insertAdjacentHTML('beforeend', `<div class="logo-partner" title="${item.name}"><div class="partner-logo-box">${item.image ? `<img src="${item.image}" alt="Logo de ${item.name}" class="partner-logo" data-fallback="${item.short}">` : `<span class="partner-logo-fallback">${item.short}</span>`}</div><strong>${item.name}</strong><span>${item.category}</span></div>`);
        });
    }

    /* ==========================================
       1. Menú Móvil Hamburguesa
       ========================================== */
    const menuBtn = document.getElementById('menuBtn');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');

    // Alternar menú móvil
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mainNav.classList.toggle('open');
        const isOpen = mainNav.classList.contains('open');
        menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    // Cerrar menú al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('open');
            menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });

    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', (e) => {
        if (!mainNav.contains(e.target) && !menuBtn.contains(e.target)) {
            mainNav.classList.remove('open');
            menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
    });


    /* ==========================================
       2. Hero Slider (Carrusel)
       ========================================== */
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('slidePrev');
    const nextBtn = document.getElementById('slideNext');
    let currentSlide = 0;
    let slideInterval;
    const intervalTime = 6000; // Cambiar diapositiva cada 6 segundos

    // Función para mostrar una diapositiva específica
    function showSlide(index) {
        // Quitar clases activas
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Controlar límites (wraparound)
        currentSlide = (index + slides.length) % slides.length;

        // Añadir clases activas a los elementos seleccionados
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    // Funciones de navegación
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Eventos de botones
    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetTimer();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetTimer();
    });

    // Eventos de indicadores (dots)
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetTimer();
        });
    });

    // Auto-carrusel
    function startTimer() {
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    function resetTimer() {
        clearInterval(slideInterval);
        startTimer();
    }

    // Iniciar temporizador
    startTimer();

    // Soporte para gestos táctiles (Swiping) en móvil
    let touchStartX = 0;
    let touchEndX = 0;
    const sliderContainer = document.getElementById('sliderContainer');

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50; // Desplazamiento mínimo en px
        if (touchStartX - touchEndX > threshold) {
            nextSlide(); // Deslizar hacia la izquierda -> Siguiente
            resetTimer();
        } else if (touchEndX - touchStartX > threshold) {
            prevSlide(); // Deslizar hacia la derecha -> Anterior
            resetTimer();
        }
    }


    /* ==========================================
       3. Carrusel de Aliados (Autoplay & Manual)
       ========================================== */
    const aliadosTrack = document.getElementById('aliadosTrack');
    const aliadosCarousel = document.querySelector('.aliados-carousel');
    const aliadosPrev = document.getElementById('aliadosPrev');
    const aliadosNext = document.getElementById('aliadosNext');
    let aliadosIndex = 0;
    let aliadosInterval;
    const aliadosIntervalTime = 3000; // Desplazamiento cada 3 segundos

    // Si una fuente externa no responde, conservar una marca visible en la tarjeta.
    document.querySelectorAll('.partner-logo').forEach((logo) => {
        logo.addEventListener('error', () => {
            const fallback = document.createElement('span');
            fallback.className = 'partner-logo-fallback';
            fallback.textContent = logo.dataset.fallback || 'ALIADO';
            logo.replaceWith(fallback);
        }, { once: true });
    });

    // Cantidad de tarjetas completas según el espacio real del carrusel.
    function getVisibleLogos() {
        const width = aliadosCarousel.clientWidth;
        if (width >= 900) return 4;
        if (width >= 650) return 3;
        if (width >= 430) return 2;
        return 1;
    }

    function sizeAliadosCards() {
        const logos = document.querySelectorAll('.aliados-track .logo-partner');
        const visibleLogos = getVisibleLogos();
        const trackStyles = window.getComputedStyle(aliadosTrack);
        const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
        const cardWidth = (aliadosCarousel.clientWidth - gap * (visibleLogos - 1)) / visibleLogos;

        logos.forEach((logo) => {
            logo.style.flexBasis = `${cardWidth}px`;
            logo.style.width = `${cardWidth}px`;
        });
    }

    function slideAliados(direction) {
        const logos = document.querySelectorAll('.aliados-track .logo-partner');
        const totalLogos = logos.length;
        const visibleLogos = getVisibleLogos();
        const maxIndex = totalLogos - visibleLogos;

        if (direction === 'next') {
            if (aliadosIndex < maxIndex) {
                aliadosIndex++;
            } else {
                aliadosIndex = 0; // Reiniciar al inicio
            }
        } else if (direction === 'prev') {
            if (aliadosIndex > 0) {
                aliadosIndex--;
            } else {
                aliadosIndex = maxIndex; // Ir al final
            }
        }

        // Calcular el ancho real de una tarjeta más el espacio entre tarjetas.
        const trackStyles = window.getComputedStyle(aliadosTrack);
        const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
        const slideWidth = logos[0].getBoundingClientRect().width + gap;
        aliadosTrack.style.transform = `translateX(-${aliadosIndex * slideWidth}px)`;
    }

    aliadosNext.addEventListener('click', () => {
        slideAliados('next');
        resetAliadosTimer();
    });

    aliadosPrev.addEventListener('click', () => {
        slideAliados('prev');
        resetAliadosTimer();
    });

    function startAliadosTimer() {
        aliadosInterval = setInterval(() => {
            slideAliados('next');
        }, aliadosIntervalTime);
    }

    function resetAliadosTimer() {
        clearInterval(aliadosInterval);
        startAliadosTimer();
    }

    sizeAliadosCards();
    startAliadosTimer();

    // Recalcular posición si la ventana cambia de tamaño
    window.addEventListener('resize', () => {
        sizeAliadosCards();
        aliadosIndex = 0;
        aliadosTrack.style.transform = 'translateX(0)';
    });


    /* ==========================================
       4. Indicación Activa en Navegación (Scroll)
       ========================================== */
    const sections = document.querySelectorAll('section[id]');

    function updateActiveLink() {
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120; // Compensación de la cabecera sticky
            const sectionId = current.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector(`.nav a[href*=${sectionId}]`)?.classList.add('active');
            } else {
                document.querySelector(`.nav a[href*=${sectionId}]`)?.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    // Ejecutar una vez al inicio para establecer la selección correcta
    updateActiveLink();
});
