// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Startet den Editor, sobald die Seite im Browser steht.
// Reihenfolge wie im Prototyp.
import { initKarteOrtswahl } from '../karte/ortswahl.js';
import { initKarteOrtswahlStart } from '../karte/ortswahl-start.js';
import { initEditorLaden } from './laden.js';
import { initEditorZeichnen } from './zeichnen.js';
import { initEditorBedienung } from './bedienung.js';
import { initEditorSeitenleiste } from './seitenleiste.js';
import { initEditorFarben } from './farben.js';
import { initEditorAnsicht } from './ansicht.js';
import { initExportExport } from '../export/export.js';
import { initEditorBeispiel } from './beispiel.js';
import { initSheet } from './sheet.js';
import { initWizard } from './assistent.js';
import { initRestore } from './wiederherstellen.js';
import { initChat } from '../hilfe/chat.js';
import { initGalerie } from '../beispiele/galerie.js';
import { initDirekt } from './direkt.js';

let started = false;
export function start() {
  if (started) return;
  started = true;
  initKarteOrtswahl();
  initKarteOrtswahlStart();
  initEditorLaden();
  initEditorZeichnen();
  initEditorBedienung();
  initEditorSeitenleiste();
  initEditorFarben();
  initEditorAnsicht();
  initExportExport();
  initEditorBeispiel();
  initSheet();
  initWizard();
  initRestore();
  initChat();
  initGalerie();
  initDirekt();
}
