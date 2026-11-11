/* ============================================================
   WareSafe — interface icons
   A small inline SVG set drawn on a 24x24 grid with a 1.8 stroke,
   so every glyph shares one weight and optical size.
   ============================================================ */

const PATHS = {
  search:
    '<circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8 21 21"/>',
  close: '<path d="M6 6 18 18M18 6 6 18"/>',
  back: '<path d="M15 4.5 7.5 12 15 19.5"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  alert: '<path d="M12 3.6 21.4 20H2.6Z"/><path d="M12 10v4.2"/><circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11.2v5.2"/><circle cx="12" cy="7.9" r="0.95" fill="currentColor" stroke="none"/>',
  shield: '<path d="M12 2.8 20 6v6.2c0 4.6-3.4 8.2-8 9.4-4.6-1.2-8-4.8-8-9.4V6Z"/><path d="M8.6 12.1 11 14.6l4.6-4.8"/>',
  box: '<path d="M3.2 7.6 12 2.8l8.8 4.8v8.8L12 21.2 3.2 16.4Z"/><path d="M3.2 7.6 12 12.4l8.8-4.8M12 12.4v8.8"/>',
  compare:
    '<path d="M3.5 8.5h13M16.5 8.5 13.6 5.6M16.5 8.5 13.6 11.4"/><path d="M20.5 15.5h-13M7.5 15.5 10.4 12.6M7.5 15.5 10.4 18.4"/>',
  cross: '<path d="M10 3.4h4v6.6h6.6v4H14v6.6h-4V14H3.4v-4H10Z"/>',
  phone:
    '<path d="M5.4 3.4h3.1l1.9 4.8-2.4 1.5a12.3 12.3 0 0 0 6.3 6.3l1.5-2.4 4.8 1.9v3.1a2.1 2.1 0 0 1-2.3 2.1A16.6 16.6 0 0 1 3.3 5.7a2.1 2.1 0 0 1 2.1-2.3Z"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 6.8V12l3.4 2.2"/>',
  refresh: '<path d="M20.2 12a8.2 8.2 0 1 1-2.6-6"/><path d="M20.4 3.6v5h-5"/>',
  swap: '<path d="M7 4.5v12M4 13.5l3 3 3-3"/><path d="M17 19.5v-12M14 10.5l3-3 3 3"/>',
  plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  offline:
    '<path d="M7.2 18.4a4.6 4.6 0 0 1-.7-9.14A6.2 6.2 0 0 1 18.1 10.6 4 4 0 0 1 17.4 18.4Z"/><path d="M3.2 3.2 20.8 20.8"/>',
  document:
    '<path d="M6.2 2.8h7.4l4.2 4.2v14.2H6.2Z"/><path d="M13.6 2.8v4.2h4.2M9 12.4h6M9 16.2h6"/>',
  filter: '<path d="M3.6 4.6h16.8l-6.6 7.8v6l-3.6 2v-8Z"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.6"/><path d="M8 12.2 11 15.2l5-5.6"/>',
  xCircle: '<circle cx="12" cy="12" r="8.6"/><path d="M9.2 9.2 14.8 14.8M14.8 9.2 9.2 14.8"/>',
  help: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><circle cx="12" cy="16.6" r="0.95" fill="currentColor" stroke="none"/>',
  eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.1"/>',
  drop: '<path d="M12 3.4c3.4 4.2 5.4 7 5.4 9.5a5.4 5.4 0 1 1-10.8 0c0-2.5 2-5.3 5.4-9.5Z"/>',
  breath: '<path d="M3 8h9.5a2 2 0 1 0-2-2"/><path d="M3 12.5h13a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 17h6.5a1.8 1.8 0 1 1-1.8 1.8"/>',
  drink: '<path d="M7 3.5h10l-1 15.5a2 2 0 0 1-2 1.9H10a2 2 0 0 1-2-1.9Z"/><path d="M8.5 8h7"/>',
  drum: '<ellipse cx="12" cy="8" rx="7" ry="2.8"/><path d="M5 8v8.2c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V8"/><path d="M5 16.2c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8"/>',
  drums: '<ellipse cx="8" cy="8" rx="5" ry="2.2"/><path d="M3 8v6c0 1.2 2.24 2.2 5 2.2s5-1 5-2.2V8"/><path d="M3 14c0 1.2 2.24 2.2 5 2.2s5-1 5-2.2"/><ellipse cx="17" cy="8" rx="4" ry="2.2"/><path d="M13 8v6c0 1.2 1.79 2.2 4 2.2s4-1 4-2.2V8"/><path d="M13 14c0 1.2 1.79 2.2 4 2.2s4-1 4-2.2"/>',
  lock: '<path d="M6.4 10.4h11.2v9.4H6.4Z"/><path d="M8.8 10.4V7.6a3.2 3.2 0 0 1 6.4 0v2.8"/>',
  layers: '<path d="M12 3.2 21 8l-9 4.8L3 8Z"/><path d="M3 12.6 12 17.4l9-4.8M3 16.8 12 21.6l9-4.8"/>',
};

/**
 * Build an SVG element for one icon.
 *
 * The markup below is a compile-time constant: no user data ever
 * reaches innerHTML. Everything else in the app renders text with
 * textContent only.
 */
export function icon(name, className) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  /* An SVG with only a viewBox stretches to fill its container, so an
     intrinsic size is set here. A class that needs a different size
     overrides it in CSS, because CSS beats a presentation attribute. */
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  if (className) svg.setAttribute("class", className);
  svg.innerHTML = PATHS[name] || PATHS.help;
  return svg;
}
