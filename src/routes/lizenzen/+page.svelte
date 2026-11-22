<script lang="ts">
	import Rechtsseite from '#lib/recht/Rechtsseite.svelte';
</script>

<Rechtsseite title="Lizenzen & Quellen">
	<p>Kartenstudio steht auf den Schultern vieler freier Projekte. Danke an alle, die sie möglich machen.</p>

	<h2>Daten</h2>
	<ul>
		<li><b>Kartendaten</b> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>, verfügbar unter der Open Database License (ODbL 1.0). Jedes Poster trägt diese Quellenangabe.</li>
		<li><b>Vektorkacheln und Kartenstile:</b> <a href="https://openfreemap.org">OpenFreeMap</a>, Schema und Stile © <a href="https://openmaptiles.org">OpenMapTiles</a> (BSD-3 / CC BY 4.0).</li>
		<li><b>Luftbilder Bayern:</b> Datenquelle: Bayerische Vermessungsverwaltung – <a href="https://www.geodaten.bayern.de">www.geodaten.bayern.de</a>, Lizenz <a href="https://creativecommons.org/licenses/by/4.0/deed.de">CC BY 4.0</a>.</li>
		<li><b>Höhenlinien:</b> Terrain Tiles (Mapzen / Amazon Web Services Open Data). In Europa: „Produced using Copernicus data and information funded by the European Union – EU-DEM layers.“ Weitere Quellen u. a. SRTM (NASA), GMTED (USGS), ETOPO1 (NOAA).</li>
		<li><b>Sterne, Sternbilder, Milchstraße:</b> <a href="https://github.com/ofrohn/d3-celestial">d3-celestial</a> von Olaf Frohn (BSD-3-Clause), Sternpositionen aus dem Hipparcos-Katalog (ESA).</li>
		<li><b>Ortssuche:</b> <a href="https://photon.komoot.io">Photon</a> (komoot), Daten © OpenStreetMap-Mitwirkende.</li>
	</ul>

	<h2>Schriften</h2>
	<ul>
		<li><b>Inter</b> – Rasmus Andersson, SIL Open Font License 1.1</li>
		<li><b>KaTeX Fraktur</b> – KaTeX-Projekt, SIL Open Font License 1.1 (ergänzt um Umlaute)</li>
		<li><b>Great Vibes</b> – The Great Vibes Pro Project Authors, SIL Open Font License 1.1</li>
		<li><b>Kaushan Script</b> (Pinselschrift) – Pablo Impallari, Igino Marini, SIL Open Font License 1.1</li>
	</ul>

	<h2>Software</h2>
	<ul>
		<li><b>SvelteKit / Svelte / Vite</b> – MIT-Lizenz</li>
		<li><b>MapLibre GL JS</b> – BSD-3-Clause</li>
		<li><b>jsPDF</b> und <b>svg2pdf.js</b> – MIT-Lizenz</li>
	</ul>

	<h2>Lizenztext BSD-3-Clause (d3-celestial, MapLibre)</h2>
	<p style="font-size:13px;white-space:pre-wrap">Copyright (c) 2015, Olaf Frohn. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.</p>
	<p class="hinweis">Die vollständigen Lizenztexte aller Pakete liegen zusätzlich im Quellcode des Projekts (Ordner <code>docs/</code> und die jeweiligen Paketordner).</p>
</Rechtsseite>
