// Die App läuft komplett im Browser (Karte, Zeichnen, Export brauchen ihn ohnehin).
// Beim Bauen entsteht eine statische Seite, die auf jedem Webspace laufen kann.
export const ssr = false;
export const prerender = true;
