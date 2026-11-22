<script lang="ts">
	import Rechtsseite from '#lib/recht/Rechtsseite.svelte';
</script>

<Rechtsseite title="Datenschutzerklärung">
	<p class="hinweis">Vorlage, passend zum aktuellen technischen Stand der App (ohne Konto, ohne Shop, ohne Cookies). Vor dem Verkaufsstart rechtlich prüfen lassen und ergänzen (Zahlung, Versand, Druckpartner).</p>

	<h2>1. Verantwortlicher</h2>
	<p><span class="ph">[Name, Anschrift, E-Mail – wie im Impressum]</span></p>

	<h2>2. Das Wichtigste in Kürze</h2>
	<ul>
		<li>Kartenstudio braucht <b>kein Konto</b> und setzt <b>keine Cookies</b>. Es gibt keine Werbe- oder Analyse-Dienste.</li>
		<li>Deine Gestaltung wird <b>nur in deinem Browser</b> gespeichert (lokaler Speicher), damit du später weitermachen kannst. Sie wird nicht an uns übertragen.</li>
		<li>Für Karten, Ortssuche, Luftbilder und Höhendaten ruft dein Browser Daten bei den unten genannten Diensten ab. Dabei wird – technisch bedingt – deine IP-Adresse an diese Dienste übermittelt.</li>
	</ul>

	<h2>3. Hosting</h2>
	<p>
		Die Website wird über <span class="ph">[GitHub Pages (GitHub Inc., USA) – oder späterer eigener Server/Anbieter]</span> ausgeliefert. Beim Aufruf verarbeitet der Anbieter technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Datei) in Server-Protokollen. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sichere und stabile Bereitstellung).
	</p>

	<h2>4. Abgerufene Dienste</h2>
	<p>Wenn du die jeweilige Funktion nutzt, lädt dein Browser Daten direkt von diesen Diensten (Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO – Bereitstellung der von dir gewünschten Funktion):</p>
	<ul>
		<li><b>Ortssuche:</b> Photon (komoot GmbH, Deutschland) – übermittelt wird dein Suchbegriff.</li>
		<li><b>Kartendaten und Kartenstile:</b> OpenFreeMap (tiles.openfreemap.org).</li>
		<li><b>Luftbilder (Bayern):</b> Bayerische Vermessungsverwaltung (geoservices.bayern.de).</li>
		<li><b>Höhenlinien:</b> Terrain Tiles bei Amazon Web Services (AWS Open Data, s3.amazonaws.com).</li>
	</ul>
	<p>Es ist geplant, diese Daten künftig selbst bereitzustellen; dann entfällt die Übermittlung an Dritte.</p>

	<h2>5. Lokale Speicherung im Browser</h2>
	<p>
		Dein aktueller Entwurf wird im lokalen Speicher deines Browsers abgelegt („Weiter mit deinem Entwurf“). Zusätzlich werden Programmdateien und Kartenkacheln zwischengespeichert, damit die App schneller startet und offline funktioniert. Du kannst diese Daten jederzeit über die Einstellungen deines Browsers löschen. Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich für den gewünschten Dienst).
	</p>

	<h2>6. Teilen- und Geschenk-Links</h2>
	<p>Ein geteilter Link enthält deine Gestaltung (und ggf. deine Grußbotschaft) im Link selbst. Sie wird nicht auf unseren Servern gespeichert. Wer den Link hat, kann die Gestaltung sehen.</p>

	<h2>7. Deine Rechte</h2>
	<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde (z. B. <span class="ph">[zuständige Landesbehörde, in Bayern: BayLDA]</span>).</p>

	<p><small>Stand: November 2026</small></p>
</Rechtsseite>
