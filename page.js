document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const mainNav = document.getElementById('mainNav');
    if (!menuBtn || !mainNav) return;
    menuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('open');
        menuBtn.innerHTML = mainNav.classList.contains('open') ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
});
