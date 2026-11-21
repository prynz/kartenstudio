// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Gemeinsamer, veränderlicher Zustand aller Editor-Module.
// (Im Prototyp waren das globale Variablen; hier liegen sie gebündelt in einem Objekt.)
export const app = {
	DATA: null,
	S: null,
	undoS: [],
	redoS: [],
	pending: null,
	sel: new Set(),
	selCls: null,
	map: null,
	mapInit: false,
	landingRun: null,
	TILEURL: null,
	lastB: null,
	genBusy: false,
	ldT: null,
	ldStart: 0,
	poster: null,
	tool: 'sel',
	drag: null,
	cv: null,
	curText: 'title',
	rasterJob: null,
	msgT: null,
	dlF: 'png',
};
