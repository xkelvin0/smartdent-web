# SmartDent Agent Instructions

## Project overview
This repository contains a static dental clinic landing page and prototype web experience for SmartDent. The main implementation lives in `maquetacion-html/` and uses HTML, CSS, and Tailwind-based utility classes.

## Relevant files
- `maquetacion-html/index.html` — landing page and main UI
- `maquetacion-html/css/style.css` — styling overrides and custom rules
- `README.md` — repo overview and team assignment notes

## Working rules
- Keep the work aligned with the existing premium dental-brand style already defined in the landing page.
- Prefer small, targeted edits over large rewrites.
- Maintain responsiveness and accessibility: mobile-first layout, semantic HTML, readable color contrast.
- Preserve the current structure and visual language unless the task explicitly requires a redesign.
- Do not introduce frameworks, build tools, or new dependencies for simple static-page work unless requested.
- Prefer relative links and paths within `maquetacion-html/` when creating new pages or assets.

## Editing conventions
- Use semantic sectioning (`header`, `main`, `section`, `footer`) when adding content.
- Keep Tailwind utility classes consistent with the existing palette and spacing patterns.
- If custom CSS is needed, add it carefully to `maquetacion-html/css/style.css` and avoid conflicting global styles.
- Favor clear class naming and maintainable markup.

## Validation
- This project is static; there is no application build pipeline to run.
- Validate changes by checking the rendered HTML/CSS in a browser preview and confirming the layout still matches the SmartDent design.
- If you add new pages, keep them visually consistent with the landing page and navigation patterns.

## Scope
Focus on the static prototype and front-end experience for the SmartDent clinic. Do not invent backend or deployment logic unless specifically requested.
