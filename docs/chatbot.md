# Hilfe-Chat

**Heute (ohne Server):** Der Chat (Knopf „Hilfe“ oben rechts) antwortet sofort aus dem Wissen in `src/lib/hilfe/wissen.js` – per Stichwort-Suche, kostenlos, ohne Datenweitergabe. Antworten enthalten Knöpfe, die direkt zum passenden Schritt springen.

**Mit KI (Claude):**
1. Kostenloses Cloudflare-Konto anlegen, API-Schlüssel auf console.anthropic.com erstellen (Guthaben aufladen, Ausgabenlimit setzen!).
2. `cd server/chat-worker && npm install && npx wrangler login`
3. `npx wrangler secret put ANTHROPIC_API_KEY` (Schlüssel einfügen – er landet nur bei Cloudflare, nie im Code)
4. `npx wrangler deploy` → Adresse notieren
5. In `.github/workflows/pages.yml` beim Build `VITE_CHAT_API: <Adresse>` unter `env:` eintragen.

Modell: Claude Opus 5.5 mit `effort: low` (kurze Antworten, wenig Denkaufwand). Bei einer Ablehnung aus Sicherheitsgründen springt automatisch ein anderes Modell ein (`fallbacks: "default"`). Deutlich günstiger wäre Claude Haiku 5.5 – eine Zeile in `server/chat-worker/src/index.js` (`model`).
Missbrauchsschutz: nur Anfragen von der eigenen Seite (`ALLOWED_ORIGINS`), max. 20 Fragen/Minute je Besucher, max. 12 Nachrichten Verlauf à 1000 Zeichen. Fällt die KI aus, antwortet automatisch wieder der eingebaute Bot.

Wissen ändern: nur `src/lib/hilfe/wissen.js` – gilt für beide Bots.
