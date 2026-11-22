// Alle Adressen externer Dienste an EINER Stelle.
// Für eigene Server (Roadmap Schritt 6) nur hier ändern – oder beim Bauen per Umgebungsvariable setzen,
// z. B. VITE_TILES=https://karten.meine-domain.de npm run build
const env = /** @type {Record<string, string|undefined>} */ (import.meta.env);

export const KONFIG = {
	/** Kartenkacheln (OpenMapTiles-Schema): TileJSON-Adresse. Eigener Server z. B. mit Planetiler + Martin/tileserver-gl. */
	tileJson: env.VITE_TILEJSON || 'https://tiles.openfreemap.org/planet',
	/** Basis der fertigen Kartenstile (…/styles/liberty usw.) */
	styles: env.VITE_STYLES || 'https://tiles.openfreemap.org/styles',
	/** Ortssuche (Photon-kompatibel). Eigener Server: Photon mit Deutschland-Extrakt. */
	geocoder: env.VITE_GEOCODER || 'https://photon.komoot.io/api/',
	/** Höhenmodell (Terrarium-PNG-Kacheln). Selbst hostbar: gleiche Dateien auf eigenem Speicher. */
	terrain: env.VITE_TERRAIN || 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
	/** Amtliches Luftbild Bayern (WMS, CC BY 4.0) */
	luftbildBayern:
		env.VITE_LUFTBILD ||
		'https://geoservices.bayern.de/od/wms/dop/v1/dop40?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=by_dop40c&STYLES=&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg'
};
