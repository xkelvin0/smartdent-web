(() => {
  const links = [...document.querySelectorAll("aside nav a[href^='#']")];
  if (!links.length) return;

  const activeClasses = ["bg-slate-100", "font-bold", "text-navy"];
  const inactiveClasses = ["text-slate-600"];
  const views = [...document.querySelectorAll("[data-dashboard-view]")];

  function setActiveLink(activeLink) {
    links.forEach((link) => {
      const selected = link === activeLink;
      activeClasses.forEach((className) => link.classList.toggle(className, selected));
      inactiveClasses.forEach((className) => link.classList.toggle(className, !selected));
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function showView(target) {
    if (!target?.hasAttribute("data-dashboard-view")) return false;
    views.forEach((view) => view.classList.toggle("hidden", view !== target));
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  links.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    target.classList.add("scroll-mt-8");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveLink(link);
      if (!showView(target)) target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", link.getAttribute("href"));
    });
  });

  const currentLink = links.find((link) => link.getAttribute("href") === window.location.hash);
  const initialLink = currentLink || links[0];
  setActiveLink(initialLink);
  showView(document.querySelector(initialLink.getAttribute("href")));
})();
